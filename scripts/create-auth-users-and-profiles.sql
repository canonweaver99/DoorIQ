-- ============================================
-- Complete SQL Script: Create 10 Teammates for Loopline
-- This script creates auth users AND user profiles
-- Requires Supabase Admin privileges
-- ============================================

-- Organization and Team IDs
DO $$
DECLARE
    org_id UUID := '55e8d2c6-c3eb-4908-93da-bac2d7be0c21';
    team_id UUID := '71da82d4-d162-43f1-b316-9519745b276e';
    user_id UUID;
    rep_id TEXT;
    teammate_data RECORD;
BEGIN
    -- Array of teammate data
    FOR teammate_data IN 
        SELECT * FROM (VALUES
            ('test.teammate1@looplne.design', 'Alex Thompson', 'a1x'),
            ('test.teammate2@looplne.design', 'Jordan Martinez', 'j2m'),
            ('test.teammate3@looplne.design', 'Casey Kim', 'c3k'),
            ('test.teammate4@looplne.design', 'Morgan Davis', 'm4d'),
            ('test.teammate5@looplne.design', 'Riley Johnson', 'r5j'),
            ('test.teammate6@looplne.design', 'Taylor Chen', 't6c'),
            ('test.teammate7@looplne.design', 'Quinn Williams', 'q7w'),
            ('test.teammate8@looplne.design', 'Sage Rodriguez', 's8r'),
            ('test.teammate9@looplne.design', 'Blake Anderson', 'b9a'),
            ('test.teammate10@looplne.design', 'Cameron Lee', 'c10l')
        ) AS t(email, full_name, rep_suffix)
    LOOP
        -- Check if auth user already exists
        SELECT id INTO user_id 
        FROM auth.users 
        WHERE email = teammate_data.email 
        LIMIT 1;
        
        -- If user doesn't exist, create them
        -- Note: This requires admin privileges and may need to be done via API
        -- For now, we'll assume they exist or will be created via Supabase Dashboard/API
        IF user_id IS NULL THEN
            RAISE NOTICE '⚠️  Auth user does not exist: %. Create via Supabase Dashboard or Admin API first.', teammate_data.email;
            CONTINUE;
        END IF;
        
        -- Generate rep ID
        rep_id := 'REP-' || TO_CHAR(EXTRACT(EPOCH FROM NOW())::bigint, 'FM999999') || '-' || teammate_data.rep_suffix;
        
        -- Insert or update user profile
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
        ) VALUES (
            user_id,
            teammate_data.email,
            teammate_data.full_name,
            rep_id,
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
        
        RAISE NOTICE '✅ Created/updated: % (%)', teammate_data.full_name, teammate_data.email;
    END LOOP;
    
    RAISE NOTICE '✅ Done! Created 10 teammates.';
END $$;

-- ============================================
-- Alternative: Direct INSERT statements
-- Use this if you already have the auth user IDs
-- ============================================

/*
-- Replace these UUIDs with actual auth user IDs from auth.users table
-- Get IDs with: SELECT id, email FROM auth.users WHERE email LIKE 'test.teammate%@looplne.design';

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
    onboarding_completed
) VALUES
-- Replace UUIDs below with actual auth user IDs
('AUTH_USER_ID_1', 'test.teammate1@looplne.design', 'Alex Thompson', 'REP-1734567890-a1x', 'rep', '55e8d2c6-c3eb-4908-93da-bac2d7be0c21', '71da82d4-d162-43f1-b316-9519745b276e', 0, true, false),
('AUTH_USER_ID_2', 'test.teammate2@looplne.design', 'Jordan Martinez', 'REP-1734567891-j2m', 'rep', '55e8d2c6-c3eb-4908-93da-bac2d7be0c21', '71da82d4-d162-43f1-b316-9519745b276e', 0, true, false),
('AUTH_USER_ID_3', 'test.teammate3@looplne.design', 'Casey Kim', 'REP-1734567892-c3k', 'rep', '55e8d2c6-c3eb-4908-93da-bac2d7be0c21', '71da82d4-d162-43f1-b316-9519745b276e', 0, true, false),
('AUTH_USER_ID_4', 'test.teammate4@looplne.design', 'Morgan Davis', 'REP-1734567893-m4d', 'rep', '55e8d2c6-c3eb-4908-93da-bac2d7be0c21', '71da82d4-d162-43f1-b316-9519745b276e', 0, true, false),
('AUTH_USER_ID_5', 'test.teammate5@looplne.design', 'Riley Johnson', 'REP-1734567894-r5j', 'rep', '55e8d2c6-c3eb-4908-93da-bac2d7be0c21', '71da82d4-d162-43f1-b316-9519745b276e', 0, true, false),
('AUTH_USER_ID_6', 'test.teammate6@looplne.design', 'Taylor Chen', 'REP-1734567895-t6c', 'rep', '55e8d2c6-c3eb-4908-93da-bac2d7be0c21', '71da82d4-d162-43f1-b316-9519745b276e', 0, true, false),
('AUTH_USER_ID_7', 'test.teammate7@looplne.design', 'Quinn Williams', 'REP-1734567896-q7w', 'rep', '55e8d2c6-c3eb-4908-93da-bac2d7be0c21', '71da82d4-d162-43f1-b316-9519745b276e', 0, true, false),
('AUTH_USER_ID_8', 'test.teammate8@looplne.design', 'Sage Rodriguez', 'REP-1734567897-s8r', 'rep', '55e8d2c6-c3eb-4908-93da-bac2d7be0c21', '71da82d4-d162-43f1-b316-9519745b276e', 0, true, false),
('AUTH_USER_ID_9', 'test.teammate9@looplne.design', 'Blake Anderson', 'REP-1734567898-b9a', 'rep', '55e8d2c6-c3eb-4908-93da-bac2d7be0c21', '71da82d4-d162-43f1-b316-9519745b276e', 0, true, false),
('AUTH_USER_ID_10', 'test.teammate10@looplne.design', 'Cameron Lee', 'REP-1734567899-c10l', 'rep', '55e8d2c6-c3eb-4908-93da-bac2d7be0c21', '71da82d4-d162-43f1-b316-9519745b276e', 0, true, false)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    organization_id = EXCLUDED.organization_id,
    team_id = EXCLUDED.team_id,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;
*/

-- ============================================
-- Verification Query
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
    u.onboarding_completed,
    u.created_at
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
LEFT JOIN teams t ON u.team_id = t.id
WHERE u.email LIKE 'test.teammate%@looplne.design'
ORDER BY u.email;
