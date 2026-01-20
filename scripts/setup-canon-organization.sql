-- ============================================
-- Setup Organization for Canon Weaver and Teammates
-- Creates organization, adds Canon as manager, and adds all teammates
-- ============================================

DO $$
DECLARE
    org_id UUID;
    team_id UUID;
    canon_user_id UUID;
    teammate_count INTEGER;
    org_name TEXT := 'Loopline Design';
BEGIN
    -- Find Canon Weaver's user account (try multiple email patterns)
    SELECT id INTO canon_user_id
    FROM auth.users
    WHERE email ILIKE '%canonweaver%'
       OR email ILIKE '%canon%loopline%'
       OR email ILIKE '%canon%looplne%'
    LIMIT 1;
    
    IF canon_user_id IS NULL THEN
        RAISE EXCEPTION 'Could not find Canon Weaver user account. Please check email address.';
    END IF;
    
    RAISE NOTICE 'Found Canon Weaver user: %', canon_user_id;
    
    -- Check if organization already exists for this user
    SELECT u.organization_id INTO org_id
    FROM users u
    WHERE u.id = canon_user_id
      AND u.organization_id IS NOT NULL;
    
    -- If no organization exists, create one
    IF org_id IS NULL THEN
        INSERT INTO organizations (
            name,
            plan_tier,
            seat_limit,
            seats_used,
            created_at
        ) VALUES (
            org_name,
            'team',
            20, -- Enough seats for Canon + 10 teammates
            0,
            NOW()
        )
        RETURNING id INTO org_id;
        
        RAISE NOTICE 'Created new organization: % (%)', org_name, org_id;
    ELSE
        RAISE NOTICE 'Using existing organization: % (%)', org_name, org_id;
    END IF;
    
    -- Update Canon's user profile to be manager in the organization
    UPDATE users
    SET 
        organization_id = org_id,
        role = CASE 
            WHEN role IS NULL OR role = 'rep' THEN 'manager'
            ELSE role -- Keep admin if already admin
        END,
        is_active = true
    WHERE id = canon_user_id;
    
    RAISE NOTICE 'Updated Canon Weaver to manager role in organization';
    
    -- Count existing teammates
    SELECT COUNT(*) INTO teammate_count
    FROM users u
    JOIN auth.users au ON u.id = au.id
    WHERE u.email LIKE 'test.teammate%@looplne.design'
      AND u.role = 'rep';
    
    RAISE NOTICE 'Found % teammates to add', teammate_count;
    
    -- Add all teammates to the same organization
    UPDATE users u
    SET 
        organization_id = org_id,
        is_active = true
    FROM auth.users au
    WHERE u.id = au.id
      AND au.email LIKE 'test.teammate%@looplne.design'
      AND u.role = 'rep';
    
    RAISE NOTICE 'Added all teammates to organization';
    
    -- Find or create a team within the organization
    SELECT t.id INTO team_id
    FROM teams t
    WHERE t.organization_id = org_id
    LIMIT 1;
    
    IF team_id IS NULL THEN
        INSERT INTO teams (
            name,
            organization_id,
            owner_id
        ) VALUES (
            'Canon''s Team',
            org_id,
            canon_user_id
        )
        RETURNING id INTO team_id;
        
        RAISE NOTICE 'Created new team: Canon''s Team (%)', team_id;
    ELSE
        RAISE NOTICE 'Using existing team: %', team_id;
    END IF;
    
    -- Assign teammates to the team (if they don't have a team already)
    UPDATE users u
    SET team_id = team_id
    FROM auth.users au
    WHERE u.id = au.id
      AND au.email LIKE 'test.teammate%@looplne.design'
      AND u.role = 'rep'
      AND (u.team_id IS NULL OR u.team_id != team_id);
    
    -- Update organization seat count
    UPDATE organizations
    SET seats_used = (
        SELECT COUNT(*)
        FROM users
        WHERE organization_id = org_id
          AND is_active = true
    )
    WHERE id = org_id;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Setup complete!';
    RAISE NOTICE '   Organization: % (%)', org_name, org_id;
    RAISE NOTICE '   Team: Canon''s Team (%)', team_id;
    RAISE NOTICE '   Manager: Canon Weaver';
    RAISE NOTICE '   Teammates: %', teammate_count;
    RAISE NOTICE '   Seats used: %', (SELECT seats_used FROM organizations WHERE id = org_id);
    
END $$;

-- ============================================
-- Verification: Show organization structure
-- ============================================
SELECT 
    o.name as organization_name,
    o.id as organization_id,
    o.plan_tier,
    o.seat_limit,
    o.seats_used,
    COUNT(DISTINCT u.id) as total_members,
    COUNT(DISTINCT CASE WHEN u.role = 'manager' OR u.role = 'admin' THEN u.id END) as managers,
    COUNT(DISTINCT CASE WHEN u.role = 'rep' THEN u.id END) as reps,
    COUNT(DISTINCT t.id) as teams
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
LEFT JOIN teams t ON t.organization_id = o.id
WHERE o.name = 'Loopline Design'
GROUP BY o.id, o.name, o.plan_tier, o.seat_limit, o.seats_used;

-- ============================================
-- Show all members in the organization
-- ============================================
SELECT 
    u.full_name,
    au.email,
    u.role,
    u.is_active,
    t.name as team_name,
    o.name as organization_name
FROM users u
JOIN auth.users au ON u.id = au.id
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE o.name = 'Loopline Design'
ORDER BY 
    CASE WHEN u.role IN ('manager', 'admin') THEN 1 ELSE 2 END,
    u.full_name;
