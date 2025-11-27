-- Migration: Add performance indexes for frequently queried columns
-- This migration adds indexes to improve query performance for common operations

-- Index for session retrieval by user (most common query)
CREATE INDEX IF NOT EXISTS idx_live_sessions_user_created 
ON live_sessions(user_id, created_at DESC);

-- Index for grading status queries (for polling/status checks)
CREATE INDEX IF NOT EXISTS idx_live_sessions_grading_status 
ON live_sessions(grading_status) 
WHERE grading_status IN ('pending', 'processing', 'instant_complete', 'moments_complete');

-- Index for team leaderboard queries (only if team_id column exists)
-- Note: team_id may not exist if using organization_id instead
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'live_sessions' AND column_name = 'team_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_live_sessions_team_earnings 
    ON live_sessions(team_id, virtual_earnings DESC) 
    WHERE team_id IS NOT NULL;
  END IF;
END $$;

-- Index for Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer 
ON users(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

-- Index for organization lookups
CREATE INDEX IF NOT EXISTS idx_users_organization 
ON users(organization_id) 
WHERE organization_id IS NOT NULL;

-- Index for team lookups (only if team_id column exists)
-- Note: team_id may have been replaced by organization_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'team_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_users_team 
    ON users(team_id) 
    WHERE team_id IS NOT NULL;
  END IF;
END $$;

-- Index for session filtering by agent
CREATE INDEX IF NOT EXISTS idx_live_sessions_agent_created 
ON live_sessions(agent_id, created_at DESC) 
WHERE agent_id IS NOT NULL;

-- Index for upload type sessions (for dashboard upload tab)
CREATE INDEX IF NOT EXISTS idx_live_sessions_upload_type 
ON live_sessions(user_id, upload_type, created_at DESC) 
WHERE upload_type = 'file_upload';

-- Index for ElevenLabs conversation correlation
CREATE INDEX IF NOT EXISTS idx_live_sessions_elevenlabs_conv 
ON live_sessions(elevenlabs_conversation_id) 
WHERE elevenlabs_conversation_id IS NOT NULL;

-- Index for subscription events (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'subscription_events'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_subscription_events_user_created 
    ON subscription_events(user_id, created_at DESC);
  END IF;
END $$;

-- Index for invite lookups (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'invites'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_invites_token 
    ON invites(token) 
    WHERE token IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_invites_email 
    ON invites(email) 
    WHERE email IS NOT NULL;
  END IF;
END $$;

-- Index for speech analysis lookups (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'speech_analysis'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_speech_analysis_session_final 
    ON speech_analysis(session_id, is_final) 
    WHERE is_final = TRUE;
  END IF;
END $$;

-- Index for elevenlabs_conversations correlation (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'elevenlabs_conversations'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_elevenlabs_conversations_session 
    ON elevenlabs_conversations(session_id) 
    WHERE session_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_elevenlabs_conversations_user 
    ON elevenlabs_conversations(user_id, created_at DESC) 
    WHERE user_id IS NOT NULL;
  END IF;
END $$;

-- Comments for documentation (only on indexes that exist)
DO $$
BEGIN
  -- Only comment if index exists
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_live_sessions_user_created') THEN
    COMMENT ON INDEX idx_live_sessions_user_created IS 'Optimizes user session history queries (dashboard, analytics)';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_live_sessions_grading_status') THEN
    COMMENT ON INDEX idx_live_sessions_grading_status IS 'Optimizes grading status polling queries';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_live_sessions_team_earnings') THEN
    COMMENT ON INDEX idx_live_sessions_team_earnings IS 'Optimizes team leaderboard queries';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_stripe_customer') THEN
    COMMENT ON INDEX idx_users_stripe_customer IS 'Optimizes Stripe customer lookups for webhooks';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_live_sessions_upload_type') THEN
    COMMENT ON INDEX idx_live_sessions_upload_type IS 'Optimizes upload tab queries in dashboard';
  END IF;
END $$;

