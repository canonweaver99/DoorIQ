-- ============================================
-- Add 10 Teammates to Organization
-- Finds organization and team dynamically
-- ============================================
-- 
-- IMPORTANT: Auth users must be created first via Supabase Admin API
-- Password for all: TestTeammate2024!
-- ============================================

DO $$
DECLARE
    org_id UUID;
    team_id UUID;
    owner_id UUID;
    teammate_emails TEXT[] := ARRAY[
        'test.teammate1@looplne.design',
        'test.teammate2@looplne.design',
        'test.teammate3@looplne.design',
        'test.teammate4@looplne.design',
        'test.teammate5@looplne.design',
        'test.teammate6@looplne.design',
        'test.teammate7@looplne.design',
        'test.teammate8@looplne.design',
        'test.teammate9@looplne.design',
        'test.teammate10@looplne.design'
    ];
    teammate_names TEXT[] := ARRAY[
        'Alex Thompson',
        'Jordan Martinez',
        'Casey Kim',
        'Morgan Davis',
        'Riley Johnson',
        'Taylor Chen',
        'Quinn Williams',
        'Sage Rodriguez',
        'Blake Anderson',
        'Cameron Lee'
    ];
    rep_suffixes TEXT[] := ARRAY['a1x', 'j2m', 'c3k', 'm4d', 'r5j', 't6c', 'q7w', 's8r', 'b9a', 'c10l'];
    i INT;
    auth_user_id UUID;
    rep_id TEXT;
BEGIN
    -- Find organization by finding a manager/admin user
    -- You can modify this to find by organization name or other criteria
    SELECT u.organization_id INTO org_id
    FROM users u
    WHERE u.role IN ('manager', 'admin')
      AND u.organization_id IS NOT NULL
    LIMIT 1;
    
    IF org_id IS NULL THEN
        RAISE EXCEPTION 'No organization found. Please ensure at least one manager/admin exists with an organization_id.';
    END IF;
    
    -- Find or get the first team in the organization
    SELECT t.id INTO team_id
    FROM teams t
    WHERE t.organization_id = org_id
    LIMIT 1;
    
    -- If no team exists, create one
    IF team_id IS NULL THEN
        -- Get owner ID
        SELECT u.id INTO owner_id
        FROM users u
        WHERE u.organization_id = org_id
          AND u.role IN ('manager', 'admin')
        LIMIT 1;
        
        INSERT INTO teams (name, organization_id, owner_id)
        VALUES ('Default Team', org_id, owner_id)
        RETURNING id INTO team_id;
        
        RAISE NOTICE 'Created new team: Default Team (%)', team_id;
    END IF;
    
    RAISE NOTICE 'Using organization: %', org_id;
    RAISE NOTICE 'Using team: %', team_id;
    
    -- Insert user profiles for each teammate
    FOR i IN 1..array_length(teammate_emails, 1) LOOP
        -- Find auth user
        SELECT id INTO auth_user_id
        FROM auth.users
        WHERE email = teammate_emails[i]
        LIMIT 1;
        
        IF auth_user_id IS NULL THEN
            RAISE NOTICE 'Skipping % - auth user not found. Create auth user first.', teammate_emails[i];
            CONTINUE;
        END IF;
        
        -- Generate rep ID
        rep_id := 'REP-' || TO_CHAR(EXTRACT(EPOCH FROM NOW())::bigint, 'FM999999') || '-' || rep_suffixes[i];
        
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
            auth_user_id,
            teammate_emails[i],
            teammate_names[i],
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
        
        RAISE NOTICE 'Created/updated: % (%)', teammate_names[i], teammate_emails[i];
    END LOOP;
    
    RAISE NOTICE 'Done! Created teammates.';
END $$;

-- Verification: Show all teammates created
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
