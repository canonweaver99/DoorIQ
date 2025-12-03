-- SQL to add 10 fake users to canonweaver@loopline.design's team
-- Run this in your Supabase SQL editor

-- Step 1: Get the team_id (run this first to verify)
-- SELECT team_id FROM users WHERE email = 'canonweaver@loopline.design';

-- Step 2: Insert 10 fake users (replace YOUR_TEAM_ID with the actual UUID from step 1)
-- OR use this version that automatically gets the team_id:

INSERT INTO users (
  id,
  email,
  full_name,
  rep_id,
  team_id,
  role,
  virtual_earnings,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  fake_data.email,
  fake_data.full_name,
  'REP-' || LPAD(fake_data.num::text, 6, '0') || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
  (SELECT team_id FROM users WHERE email = 'canonweaver@loopline.design' LIMIT 1),
  'rep',
  fake_data.virtual_earnings,
  NOW() - (fake_data.num || ' days')::interval,
  NOW() - (fake_data.num || ' days')::interval
FROM (
  VALUES
    (1, 'fake.user1@example.com', 'Alex Johnson', 55000),
    (2, 'fake.user2@example.com', 'Sarah Martinez', 50000),
    (3, 'fake.user3@example.com', 'Michael Chen', 45000),
    (4, 'fake.user4@example.com', 'Emily Rodriguez', 40000),
    (5, 'fake.user5@example.com', 'David Thompson', 35000),
    (6, 'fake.user6@example.com', 'Jessica Williams', 30000),
    (7, 'fake.user7@example.com', 'Ryan Anderson', 25000),
    (8, 'fake.user8@example.com', 'Amanda Davis', 20000),
    (9, 'fake.user9@example.com', 'Chris Brown', 15000),
    (10, 'fake.user10@example.com', 'Lauren Taylor', 10000)
) AS fake_data(num, email, full_name, virtual_earnings)
WHERE EXISTS (
  SELECT 1 FROM users WHERE email = 'canonweaver@loopline.design' AND team_id IS NOT NULL
);

-- Step 3: Verify the users were added
SELECT 
  full_name,
  email,
  virtual_earnings,
  team_id,
  created_at
FROM users
WHERE email LIKE 'fake.user%@example.com'
ORDER BY virtual_earnings DESC;
