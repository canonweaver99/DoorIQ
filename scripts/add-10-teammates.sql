-- ============================================
-- Add 10 Test Teammates to Loopline Organization
-- Organization ID: 55e8d2c6-c3eb-4908-93da-bac2d7be0c21
-- Team ID: 71da82d4-d162-43f1-b316-9519745b276e (Canon's Team)
-- ============================================

-- First, you'll need to create the auth users via Supabase Admin API or Dashboard
-- Then run these SQL statements to create the user profiles

-- Note: Replace the user IDs below with the actual auth user IDs after creating them
-- You can create auth users via: Supabase Dashboard > Authentication > Add User
-- Or use the Supabase Admin API

-- ============================================
-- Step 1: Create Auth Users (via API/Dashboard first)
-- ============================================
-- Use Supabase Admin API or Dashboard to create these users:
-- 1. test.teammate1@looplne.design
-- 2. test.teammate2@looplne.design
-- 3. test.teammate3@looplne.design
-- 4. test.teammate4@looplne.design
-- 5. test.teammate5@looplne.design
-- 6. test.teammate6@looplne.design
-- 7. test.teammate7@looplne.design
-- 8. test.teammate8@looplne.design
-- 9. test.teammate9@looplne.design
-- 10. test.teammate10@looplne.design
-- Password for all: TestTeammate2024!

-- ============================================
-- Step 2: Insert User Profiles
-- ============================================
-- After creating auth users, get their IDs and update the INSERT statements below

-- Organization and Team IDs
DO $$
DECLARE
    org_id UUID := '55e8d2c6-c3eb-4908-93da-bac2d7be0c21';
    team_id UUID := '71da82d4-d162-43f1-b316-9519745b276e';
BEGIN
    -- Insert user profiles
    -- Replace the user IDs with actual auth user IDs from Step 1
    
    INSERT INTO users (
        id,
        email,
        full_name,
        rep_id,
        role,
        organization_id,
        team_id,
        virtual_earnings,
        is_active,
        onboarding_completed,
        created_at
    ) VALUES
    -- You need to replace these UUIDs with actual auth user IDs
    -- Get auth user IDs from: SELECT id FROM auth.users WHERE email = 'test.teammate1@looplne.design';
    
    -- Teammate 1: Alex Thompson
    (
        (SELECT id FROM auth.users WHERE email = 'test.teammate1@looplne.design' LIMIT 1),
        'test.teammate1@looplne.design',
        'Alex Thompson',
        'REP-' || TO_CHAR(EXTRACT(EPOCH FROM NOW())::bigint, 'FM999999') || '-a1x',
        'rep',
        org_id,
        team_id,
        0,
        true,
        false,
        NOW()
    ),
    
    -- Teammate 2: Jordan Martinez
    (
        (SELECT id FROM auth.users WHERE email = 'test.teammate2@looplne.design' LIMIT 1),
        'test.teammate2@looplne.design',
        'Jordan Martinez',
        'REP-' || TO_CHAR(EXTRACT(EPOCH FROM NOW())::bigint, 'FM999999') || '-j2m',
        'rep',
        org_id,
        team_id,
        0,
        true,
        false,
        NOW()
    ),
    
    -- Teammate 3: Casey Kim
    (
        (SELECT id FROM auth.users WHERE email = 'test.teammate3@looplne.design' LIMIT 1),
        'test.teammate3@looplne.design',
        'Casey Kim',
        'REP-' || TO_CHAR(EXTRACT(EPOCH FROM NOW())::bigint, 'FM999999') || '-c3k',
        'rep',
        org_id,
        team_id,
        0,
        true,
        false,
        NOW()
    ),
    
    -- Teammate 4: Morgan Davis
    (
        (SELECT id FROM auth.users WHERE email = 'test.teammate4@looplne.design' LIMIT 1),
        'test.teammate4@looplne.design',
        'Morgan Davis',
        'REP-' || TO_CHAR(EXTRACT(EPOCH FROM NOW())::bigint, 'FM999999') || '-m4d',
        'rep',
        org_id,
        team_id,
        0,
        true,
        false,
        NOW()
    ),
    
    -- Teammate 5: Riley Johnson
    (
        (SELECT id FROM auth.users WHERE email = 'test.teammate5@looplne.design' LIMIT 1),
        'test.teammate5@looplne.design',
        'Riley Johnson',
        'REP-' || TO_CHAR(EXTRACT(EPOCH FROM NOW())::bigint, 'FM999999') || '-r5j',
        'rep',
        org_id,
        team_id,
        0,
        true,
        false,
        NOW()
    ),
    
    -- Teammate 6: Taylor Chen
    (
        (SELECT id FROM auth.users WHERE email = 'test.teammate6@looplne.design' LIMIT 1),
        'test.teammate6@looplne.design',
        'Taylor Chen',
        'REP-' || TO_CHAR(EXTRACT(EPOCH FROM NOW())::bigint, 'FM999999') || '-t6c',
        'rep',
        org_id,
        team_id,
        0,
        true,
        false,
        NOW()
    ),
    
    -- Teammate 7: Quinn Williams
    (
        (SELECT id FROM auth.users WHERE email = 'test.teammate7@looplne.design' LIMIT 1),
        'test.teammate7@looplne.design',
        'Quinn Williams',
        'REP-' || TO_CHAR(EXTRACT(EPOCH FROM NOW())::bigint, 'FM999999') || '-q7w',
        'rep',
        org_id,
        team_id,
        0,
        true,
        false,
        NOW()
    ),
    
    -- Teammate 8: Sage Rodriguez
    (
        (SELECT id FROM auth.users WHERE email = 'test.teammate8@looplne.design' LIMIT 1),
        'test.teammate8@looplne.design',
        'Sage Rodriguez',
        'REP-' || TO_CHAR(EXTRACT(EPOCH FROM NOW())::bigint, 'FM999999') || '-s8r',
        'rep',
        org_id,
        team_id,
        0,
        true,
        false,
        NOW()
    ),
    
    -- Teammate 9: Blake Anderson
    (
        (SELECT id FROM auth.users WHERE email = 'test.teammate9@looplne.design' LIMIT 1),
        'test.teammate9@looplne.design',
        'Blake Anderson',
        'REP-' || TO_CHAR(EXTRACT(EPOCH FROM NOW())::bigint, 'FM999999') || '-b9a',
        'rep',
        org_id,
        team_id,
        0,
        true,
        false,
        NOW()
    ),
    
    -- Teammate 10: Cameron Lee
    (
        (SELECT id FROM auth.users WHERE email = 'test.teammate10@looplne.design' LIMIT 1),
        'test.teammate10@looplne.design',
        'Cameron Lee',
        'REP-' || TO_CHAR(EXTRACT(EPOCH FROM NOW())::bigint, 'FM999999') || '-c10l',
        'rep',
        org_id,
        team_id,
        0,
        true,
        false,
        NOW()
    )
    
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        organization_id = EXCLUDED.organization_id,
        team_id = EXCLUDED.team_id,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
    
    RAISE NOTICE '✅ Successfully inserted/updated 10 teammates';
END $$;

-- ============================================
-- Verify the inserts
-- ============================================
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.rep_id,
    u.role,
    o.name as organization_name,
    t.name as team_name,
    u.is_active,
    u.onboarding_completed
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
LEFT JOIN teams t ON u.team_id = t.id
WHERE u.email LIKE 'test.teammate%@looplne.design'
ORDER BY u.email;
