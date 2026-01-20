-- ============================================
-- Verify Canon's Organization Status
-- Checks both auth.users and users tables
-- ============================================

-- Check auth.users table
SELECT 
    'auth.users' as source,
    id,
    email,
    created_at
FROM auth.users
WHERE email ILIKE '%canonweaver@mechaweaver.com%'
   OR email ILIKE '%canon%mecha%'
ORDER BY email;

-- Check users table
SELECT 
    'users' as source,
    u.id,
    au.email as auth_email,
    u.email as users_email,
    u.full_name,
    u.role,
    u.organization_id,
    u.team_id,
    u.is_active,
    o.name as organization_name,
    t.name as team_name
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
LEFT JOIN organizations o ON u.organization_id = o.id
LEFT JOIN teams t ON u.team_id = t.id
WHERE au.email ILIKE '%canonweaver@mechaweaver.com%'
   OR au.email ILIKE '%canon%mecha%'
   OR u.email ILIKE '%canonweaver@mechaweaver.com%'
   OR u.email ILIKE '%canon%mecha%'
ORDER BY COALESCE(au.email, u.email);

-- Check if there's a mismatch
SELECT 
    CASE 
        WHEN au.id IS NULL THEN 'User exists in users but NOT in auth.users'
        WHEN u.id IS NULL THEN 'User exists in auth.users but NOT in users'
        WHEN u.organization_id IS NULL THEN 'User exists but has NO organization_id'
        WHEN u.team_id IS NULL THEN 'User exists but has NO team_id'
        ELSE 'User looks good'
    END as status,
    au.id as auth_id,
    au.email as auth_email,
    u.id as user_id,
    u.organization_id,
    u.team_id,
    u.role
FROM auth.users au
FULL OUTER JOIN users u ON au.id = u.id
WHERE au.email ILIKE '%canonweaver@mechaweaver.com%'
   OR au.email ILIKE '%canon%mecha%'
   OR u.email ILIKE '%canonweaver@mechaweaver.com%'
   OR u.email ILIKE '%canon%mecha%';

-- Direct check: What does the API see?
-- This simulates what the billing API query does
SELECT 
    u.id,
    u.email,
    u.organization_id,
    u.role,
    o.name as organization_name,
    o.plan_tier,
    o.seat_limit,
    o.seats_used
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE u.email ILIKE '%canonweaver@mechaweaver.com%'
   OR u.email ILIKE '%canon%mecha%'
   OR u.id IN (
       SELECT id FROM auth.users 
       WHERE email ILIKE '%canonweaver@mechaweaver.com%'
          OR email ILIKE '%canon%mecha%'
   )
LIMIT 1;
