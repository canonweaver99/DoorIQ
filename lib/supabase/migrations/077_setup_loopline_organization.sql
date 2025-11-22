-- Migration: 077_setup_loopline_organization.sql
-- Creates Loopline organization and sets up 10 rep users
-- Sets up Canon Weaver (canonweaver@loopline.design) as manager

-- Ensure organizations table exists (creates it if it doesn't)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  stripe_subscription_item_id TEXT,
  plan_tier TEXT CHECK (plan_tier IN ('starter', 'team', 'enterprise')),
  seat_limit INTEGER DEFAULT 0,
  seats_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure organization_id column exists in users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
  END IF;
  
  -- Ensure credits column exists in users table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'credits'
  ) THEN
    ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 0;
  END IF;
  
  -- Ensure last_daily_credit_reset column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'last_daily_credit_reset'
  ) THEN
    ALTER TABLE users ADD COLUMN last_daily_credit_reset DATE;
  END IF;
END $$;

-- Ensure user_session_limits table exists
CREATE TABLE IF NOT EXISTS user_session_limits (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  sessions_this_month INTEGER DEFAULT 0,
  sessions_limit INTEGER DEFAULT 5,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE
);

DO $$
DECLARE
  org_id UUID;
  manager_user_id UUID;
  rep_count INTEGER := 0;
  rep_names TEXT[] := ARRAY[
    'Alex Anderson', 'Jordan Brown', 'Taylor Davis', 'Morgan Garcia', 'Casey Harris',
    'Riley Jackson', 'Avery Johnson', 'Quinn Martinez', 'Blake Miller', 'Cameron Moore'
  ];
  rep_emails TEXT[] := ARRAY[
    'alex.anderson123@loopline.com', 'jordan.brown456@loopline.com', 'taylor.davis789@loopline.com',
    'morgan.garcia234@loopline.com', 'casey.harris567@loopline.com', 'riley.jackson890@loopline.com',
    'avery.johnson345@loopline.com', 'quinn.martinez678@loopline.com', 'blake.miller901@loopline.com',
    'cameron.moore234@loopline.com'
  ];
  rep_id TEXT;
  i INTEGER;
  new_user_id UUID;
BEGIN

  -- Step 1: Create or get Loopline organization
  SELECT id INTO org_id FROM organizations WHERE name = 'Loopline' LIMIT 1;

  IF org_id IS NULL THEN
    INSERT INTO organizations (name, plan_tier, seat_limit, seats_used)
    VALUES ('Loopline', 'team', 20, 0)
    RETURNING id INTO org_id;
    RAISE NOTICE 'Created new Loopline organization';
  ELSE
    RAISE NOTICE 'Loopline organization already exists';
  END IF;

  RAISE NOTICE 'Organization Loopline created/found with ID: %', org_id;

  -- Step 2: Find and update your user account
  SELECT id INTO manager_user_id 
  FROM users 
  WHERE email = 'canonweaver@loopline.design'
  LIMIT 1;

  IF manager_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: canonweaver@loopline.design';
  END IF;

  -- Update user to be manager in Loopline
  UPDATE users
  SET organization_id = org_id,
      role = 'manager'
  WHERE id = manager_user_id;

  RAISE NOTICE 'Updated user % to be manager of Loopline', manager_user_id;

  -- Step 3: Create 10 rep users
  -- Note: These will create user records, but auth accounts need to be created separately
  -- You can create auth accounts via Supabase Dashboard or use the Supabase Auth API
  
  FOR i IN 1..10 LOOP
    -- Check if rep already exists
    SELECT id INTO new_user_id FROM users WHERE email = rep_emails[i] LIMIT 1;
    
    IF new_user_id IS NULL THEN
      -- Generate rep ID
      rep_id := 'REP-' || TO_CHAR(EXTRACT(EPOCH FROM NOW())::BIGINT, 'FM999999') || '-' || i;
      
      -- Generate a UUID for the user (auth user will need to be created with this same ID)
      new_user_id := gen_random_uuid();
      
      -- Insert user record
      INSERT INTO users (
        id,
        email,
        full_name,
        rep_id,
        role,
        organization_id,
        virtual_earnings,
        credits,
        last_daily_credit_reset
      )
      VALUES (
        new_user_id,
        rep_emails[i],
        rep_names[i],
        rep_id,
        'rep',
        org_id,
        0,
        5,
        CURRENT_DATE
      );

      -- Create session limits
      INSERT INTO user_session_limits (
        user_id,
        sessions_this_month,
        sessions_limit,
        last_reset_date
      )
      VALUES (
        new_user_id,
        0,
        5,
        CURRENT_DATE
      )
      ON CONFLICT (user_id) DO NOTHING;

      rep_count := rep_count + 1;
      RAISE NOTICE 'Created rep %: % (%)', i, rep_names[i], rep_emails[i];
    ELSE
      -- Update existing rep to be in Loopline if not already
      UPDATE users
      SET organization_id = org_id,
          role = 'rep'
      WHERE id = new_user_id AND (organization_id IS NULL OR organization_id != org_id);
      
      RAISE NOTICE 'Rep already exists: % (%)', rep_names[i], rep_emails[i];
    END IF;
  END LOOP;


  -- Step 4: Update organization seat count
  UPDATE organizations
  SET seats_used = (
    SELECT COUNT(*) 
    FROM users 
    WHERE organization_id = org_id
  )
  WHERE id = org_id;

  RAISE NOTICE 'Created % rep users for Loopline organization', rep_count;
  RAISE NOTICE 'Total seats used: %', (SELECT seats_used FROM organizations WHERE id = org_id);

END $$;

-- After running this migration, you'll need to create auth accounts for the 10 reps
-- You can do this via:
-- 1. Supabase Dashboard > Authentication > Add User (manual)
-- 2. Or use the Supabase Auth Admin API
-- 3. Or run: node scripts/create-auth-for-loopline-reps.js (if we create that script)

-- Rep credentials (password for all: Loopline2024!)
-- 1. alex.anderson123@loopline.com
-- 2. jordan.brown456@loopline.com
-- 3. taylor.davis789@loopline.com
-- 4. morgan.garcia234@loopline.com
-- 5. casey.harris567@loopline.com
-- 6. riley.jackson890@loopline.com
-- 7. avery.johnson345@loopline.com
-- 8. quinn.martinez678@loopline.com
-- 9. blake.miller901@loopline.com
-- 10. cameron.moore234@loopline.com

