-- Migration: 074_enhance_organizations_billing.sql
-- Add billing_interval and trial_ends_at to organizations table
-- Only runs if organizations table exists (migration 068 must be run first)

DO $$
BEGIN
  -- Only proceed if organizations table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'organizations'
  ) THEN
    -- Add billing_interval column
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'organizations' 
      AND column_name = 'billing_interval'
    ) THEN
      ALTER TABLE organizations
      ADD COLUMN billing_interval TEXT CHECK (billing_interval IN ('monthly', 'annual')) DEFAULT 'monthly';
    END IF;

    -- Add trial_ends_at column
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'organizations' 
      AND column_name = 'trial_ends_at'
    ) THEN
      ALTER TABLE organizations
      ADD COLUMN trial_ends_at TIMESTAMPTZ;
    END IF;

    -- Create index for billing_interval queries
    CREATE INDEX IF NOT EXISTS idx_organizations_billing_interval ON organizations(billing_interval);

    -- Create index for trial_ends_at queries
    CREATE INDEX IF NOT EXISTS idx_organizations_trial_ends_at ON organizations(trial_ends_at);

    -- Add comments
    COMMENT ON COLUMN organizations.billing_interval IS 'Billing interval: monthly or annual';
    COMMENT ON COLUMN organizations.trial_ends_at IS 'When the trial period ends for this organization';
  END IF;
END $$;

