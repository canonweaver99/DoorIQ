-- Add additional subscription tracking fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_features JSONB DEFAULT '[]'::jsonb;

-- Create subscription events log table for tracking all subscription changes
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- trial_started, trial_ending_soon, trial_ended, payment_succeeded, payment_failed, subscription_canceled, etc.
  event_data JSONB,
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_notification_sent ON subscription_events(notification_sent);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at);

-- Create feature flags table for granular feature control
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  description TEXT,
  requires_subscription BOOLEAN DEFAULT TRUE,
  enabled_for_trial BOOLEAN DEFAULT TRUE,
  enabled_for_free BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default feature flags
INSERT INTO feature_flags (feature_key, feature_name, description, requires_subscription, enabled_for_trial, enabled_for_free)
VALUES 
  ('all_agents', 'All 12 AI Training Agents', 'Access to all AI training agents', TRUE, TRUE, FALSE),
  ('unlimited_sessions', 'Unlimited Practice Sessions', 'No limit on practice calls', TRUE, TRUE, FALSE),
  ('advanced_analytics', 'Advanced Analytics', 'Detailed performance analytics and insights', TRUE, TRUE, FALSE),
  ('call_recording', 'Call Recording & Playback', 'Record and review past sessions', TRUE, TRUE, FALSE),
  ('export_reports', 'Export Reports', 'Export reports in CSV/PDF format', TRUE, TRUE, FALSE),
  ('custom_scenarios', 'Custom Sales Scenarios', 'Create custom training scenarios', TRUE, TRUE, FALSE),
  ('team_features', 'Team Collaboration', 'Team management and collaboration features', TRUE, FALSE, FALSE),
  ('priority_support', 'Priority Support', 'Priority email and chat support', TRUE, TRUE, FALSE),
  ('basic_agents', 'Basic AI Agents', 'Access to 3 basic AI training agents', FALSE, TRUE, TRUE),
  ('basic_sessions', 'Limited Sessions', 'Up to 10 practice calls per month', FALSE, TRUE, TRUE)
ON CONFLICT (feature_key) DO NOTHING;

-- Create user session limits table
CREATE TABLE IF NOT EXISTS user_session_limits (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  sessions_this_month INTEGER DEFAULT 0,
  sessions_limit INTEGER DEFAULT 10, -- 10 for free, unlimited (-1) for paid
  last_reset_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to check if user has access to a feature
CREATE OR REPLACE FUNCTION user_has_feature_access(
  p_user_id UUID,
  p_feature_key TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_subscription_status TEXT;
  v_trial_ends_at TIMESTAMPTZ;
  v_feature_requires_subscription BOOLEAN;
  v_enabled_for_trial BOOLEAN;
  v_enabled_for_free BOOLEAN;
  v_is_trialing BOOLEAN;
  v_is_active BOOLEAN;
BEGIN
  -- Get user's subscription status
  SELECT subscription_status, trial_ends_at
  INTO v_subscription_status, v_trial_ends_at
  FROM users
  WHERE id = p_user_id;

  -- Get feature requirements
  SELECT requires_subscription, enabled_for_trial, enabled_for_free
  INTO v_feature_requires_subscription, v_enabled_for_trial, v_enabled_for_free
  FROM feature_flags
  WHERE feature_key = p_feature_key;

  -- If feature doesn't require subscription, everyone has access
  IF NOT v_feature_requires_subscription THEN
    RETURN TRUE;
  END IF;

  -- Check if user has active subscription
  v_is_active := v_subscription_status = 'active';
  
  -- Check if user is in trial period
  v_is_trialing := v_subscription_status = 'trialing' AND v_trial_ends_at > NOW();

  -- Active subscription = full access
  IF v_is_active THEN
    RETURN TRUE;
  END IF;

  -- Trial period = check if feature is enabled for trial
  IF v_is_trialing AND v_enabled_for_trial THEN
    RETURN TRUE;
  END IF;

  -- Free tier = check if feature is enabled for free
  IF v_enabled_for_free THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and reset session limits
CREATE OR REPLACE FUNCTION check_user_session_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit_record RECORD;
  v_subscription_status TEXT;
BEGIN
  -- Get subscription status
  SELECT subscription_status INTO v_subscription_status
  FROM users WHERE id = p_user_id;

  -- Active or trialing users have unlimited access
  IF v_subscription_status IN ('active', 'trialing') THEN
    RETURN TRUE;
  END IF;

  -- Get or create limit record
  INSERT INTO user_session_limits (user_id, sessions_this_month, sessions_limit)
  VALUES (p_user_id, 0, 10)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_limit_record
  FROM user_session_limits
  WHERE user_id = p_user_id;

  -- Reset if new month
  IF v_limit_record.last_reset_date < DATE_TRUNC('month', CURRENT_DATE)::DATE THEN
    UPDATE user_session_limits
    SET sessions_this_month = 0,
        last_reset_date = CURRENT_DATE
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;

  -- Check if under limit
  RETURN v_limit_record.sessions_this_month < v_limit_record.sessions_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment session count
CREATE OR REPLACE FUNCTION increment_user_session_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_session_limits (user_id, sessions_this_month, sessions_limit)
  VALUES (p_user_id, 1, 10)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    sessions_this_month = user_session_limits.sessions_this_month + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_session_limits ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription events
CREATE POLICY "Users can view own subscription events"
  ON subscription_events FOR SELECT
  USING (auth.uid() = user_id);

-- Everyone can view feature flags (they're public)
CREATE POLICY "Anyone can view feature flags"
  ON feature_flags FOR SELECT
  TO public
  USING (true);

-- Users can view their own session limits
CREATE POLICY "Users can view own session limits"
  ON user_session_limits FOR SELECT
  USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE subscription_events IS 'Tracks all subscription-related events for notifications and auditing';
COMMENT ON TABLE feature_flags IS 'Defines which features are available for different subscription tiers';
COMMENT ON TABLE user_session_limits IS 'Tracks session usage for free tier users';
COMMENT ON FUNCTION user_has_feature_access IS 'Checks if a user has access to a specific feature based on their subscription';
COMMENT ON FUNCTION check_user_session_limit IS 'Checks if a user is under their session limit for the current month';

