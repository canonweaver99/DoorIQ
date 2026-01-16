-- Quick fix: Create user record for authenticated user missing from users table
-- Run this in Supabase SQL Editor for user: 112c590a-a7d6-494e-a82e-dd3922f36d4f

-- First, check if user exists in auth.users
-- Then create/update the users table record

INSERT INTO users (
  id,
  email,
  full_name,
  rep_id,
  role,
  virtual_earnings,
  onboarding_completed
)
VALUES (
  '112c590a-a7d6-494e-a82e-dd3922f36d4f',
  (SELECT email FROM auth.users WHERE id = '112c590a-a7d6-494e-a82e-dd3922f36d4f'),
  COALESCE(
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = '112c590a-a7d6-494e-a82e-dd3922f36d4f'),
    (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = '112c590a-a7d6-494e-a82e-dd3922f36d4f'),
    'User'
  ),
  'REP-' || to_char(EXTRACT(EPOCH FROM NOW())::bigint, 'FM999999'),
  'rep',
  0,
  true
)
ON CONFLICT (id) DO UPDATE SET
  onboarding_completed = COALESCE(users.onboarding_completed, true),
  checkout_session_id = NULL;

