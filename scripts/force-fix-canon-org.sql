-- ============================================
-- Force Fix: Ensure Canon Has Organization
-- This directly updates the user record
-- ============================================

-- Step 1: Show current state
SELECT 
    'BEFORE FIX' as status,
    au.id,
    au.email,
    u.organization_id,
    u.team_id,
    u.role,
    o.name as org_name,
    o.plan_tier,
    o.seat_limit,
    o.seats_used
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE au.email ILIKE '%canonweaver@loopline.design%'
   OR au.email ILIKE '%canonweaver%loopline%'
   OR au.email = 'canonweaver@loopline.design'
LIMIT 1;

-- Step 2: Find or create organization
DO $$
DECLARE
    canon_user_id UUID;
    org_id UUID;
    target_team_id UUID;
BEGIN
    -- Get Canon's user ID
    SELECT id INTO canon_user_id
    FROM auth.users
    WHERE email ILIKE '%canonweaver@loopline.design%'
       OR email ILIKE '%canonweaver%loopline%'
       OR email = 'canonweaver@loopline.design'
    LIMIT 1;
    
    IF canon_user_id IS NULL THEN
        RAISE EXCEPTION 'Canon user not found';
    END IF;
    
    RAISE NOTICE 'Canon user ID: %', canon_user_id;
    
    -- Find Loopline Design organization
    SELECT id INTO org_id
    FROM organizations
    WHERE name ILIKE '%loopline%'
    LIMIT 1;
    
    -- Create if doesn't exist
    IF org_id IS NULL THEN
        INSERT INTO organizations (name, plan_tier, seat_limit, seats_used)
        VALUES ('Loopline Design', 'team', 20, 0)
        RETURNING id INTO org_id;
        RAISE NOTICE 'Created organization: Loopline Design (%)', org_id;
    ELSE
        RAISE NOTICE 'Found organization: %', org_id;
    END IF;
    
    -- Find or create team
    SELECT id INTO target_team_id
    FROM teams
    WHERE organization_id = org_id
    LIMIT 1;
    
    IF target_team_id IS NULL THEN
        INSERT INTO teams (name, organization_id, owner_id)
        VALUES ('Canon''s Team', org_id, canon_user_id)
        RETURNING id INTO target_team_id;
        RAISE NOTICE 'Created team: Canon''s Team (%)', target_team_id;
    ELSE
        RAISE NOTICE 'Found team: %', target_team_id;
    END IF;
    
    -- FORCE UPDATE: Directly set organization_id and team_id
    UPDATE users
    SET 
        organization_id = org_id,
        team_id = target_team_id,
        role = COALESCE(NULLIF(role, ''), 'manager'),
        is_active = true
    WHERE id = canon_user_id;
    
    -- Ensure user record exists (create if missing)
    -- First check if user record exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = canon_user_id) THEN
        -- Create new user record
        INSERT INTO users (
            id,
            email,
            full_name,
            organization_id,
            team_id,
            role,
            is_active,
            rep_id,
            virtual_earnings
        )
        SELECT 
            canon_user_id,
            email,
            'Canon Weaver',
            org_id,
            target_team_id,
            'manager',
            true,
            'REP-' || TO_CHAR(EXTRACT(EPOCH FROM NOW())::bigint, 'FM999999'),
            0
        FROM auth.users
        WHERE id = canon_user_id;
        
        RAISE NOTICE 'Created new user record';
    ELSE
        -- Update existing user record
        UPDATE users
        SET 
            organization_id = org_id,
            team_id = target_team_id,
            role = 'manager',
            is_active = true
        WHERE id = canon_user_id;
        
        RAISE NOTICE 'Updated existing user record';
    END IF;
    
    RAISE NOTICE 'Updated user record';
    
    -- Update seat count
    UPDATE organizations
    SET seats_used = (
        SELECT COUNT(*)
        FROM users
        WHERE organization_id = org_id
          AND is_active = true
    )
    WHERE id = org_id;
    
    RAISE NOTICE 'Updated seat count';
END $$;

-- Step 3: Verify AFTER fix
SELECT 
    'AFTER FIX' as status,
    au.id,
    au.email,
    u.organization_id,
    u.team_id,
    u.role,
    o.name as org_name,
    o.plan_tier,
    o.seat_limit,
    o.seats_used,
    t.name as team_name
FROM auth.users au
JOIN users u ON au.id = u.id
LEFT JOIN organizations o ON u.organization_id = o.id
LEFT JOIN teams t ON u.team_id = t.id
WHERE au.email ILIKE '%canonweaver@loopline.design%'
   OR au.email ILIKE '%canonweaver%loopline%'
   OR au.email = 'canonweaver@loopline.design'
LIMIT 1;

-- Step 4: Test what the API sees (exact query from API)
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
WHERE u.id IN (
    SELECT id FROM auth.users 
    WHERE email ILIKE '%canonweaver@loopline.design%'
       OR email ILIKE '%canonweaver%loopline%'
       OR email = 'canonweaver@loopline.design'
    LIMIT 1
)
LIMIT 1;
