-- Allow starter plan access to learning_page (Basic Sales Playbook)
-- Update user_has_feature_access function to allow starter plan access to learning_page

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
  v_organization_id UUID;
  v_plan_tier TEXT;
BEGIN
  -- Get user's subscription status and organization
  SELECT u.subscription_status, u.trial_ends_at, u.organization_id
  INTO v_subscription_status, v_trial_ends_at, v_organization_id
  FROM users u
  WHERE u.id = p_user_id;

  -- Get feature requirements
  SELECT requires_subscription, enabled_for_trial, enabled_for_free
  INTO v_feature_requires_subscription, v_enabled_for_trial, v_enabled_for_free
  FROM feature_flags
  WHERE feature_key = p_feature_key;

  -- If feature doesn't require subscription, everyone has access
  IF NOT v_feature_requires_subscription THEN
    RETURN TRUE;
  END IF;

  -- Special handling for learning_page feature - check organization plan_tier
  IF p_feature_key = 'learning_page' THEN
    -- Get organization plan_tier if user belongs to an organization
    IF v_organization_id IS NOT NULL THEN
      SELECT plan_tier INTO v_plan_tier
      FROM organizations
      WHERE id = v_organization_id;
      
      -- Learning page now available for starter, team, and enterprise plans
      IF v_plan_tier IN ('starter', 'team', 'enterprise') THEN
        v_is_active := v_subscription_status = 'active';
        v_is_trialing := v_subscription_status = 'trialing' AND (v_trial_ends_at IS NULL OR v_trial_ends_at > NOW());
        
        -- Active subscription = full access
        IF v_is_active THEN
          RETURN TRUE;
        END IF;
        
        -- Trial period = check if feature is enabled for trial
        IF v_is_trialing AND v_enabled_for_trial THEN
          RETURN TRUE;
        END IF;
      END IF;
    ELSE
      -- Individual users (no organization) don't have access to learning_page
      RETURN FALSE;
    END IF;
    
    -- Default deny for learning_page if we get here
    RETURN FALSE;
  END IF;

  -- For all other features, use standard logic
  -- Check if user has active subscription
  v_is_active := v_subscription_status = 'active';
  
  -- Check if user is in trial period
  v_is_trialing := v_subscription_status = 'trialing' AND (v_trial_ends_at IS NULL OR v_trial_ends_at > NOW());

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

