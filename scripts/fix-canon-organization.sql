-- ============================================
-- Quick Fix: Ensure Canon Weaver is in Organization
-- This script checks and fixes organization assignment
-- ============================================

-- First, let's see what we're working with
SELECT 
    au.email,
    u.id,
    u.full_name,
    u.role,
    u.organization_id,
    u.team_id,
    u.is_active,
    o.name as organization_name,
    t.name as team_name
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
LEFT JOIN organizations o ON u.organization_id = o.id
LEFT JOIN teams t ON u.team_id = t.id
WHERE au.email ILIKE '%canon%'
ORDER BY au.email;

-- Fix: Find or create organization and assign Canon
DO $$
DECLARE
    canon_user_id UUID;
    canon_email TEXT;
    org_id UUID;
    team_id UUID;
BEGIN
    -- Find Canon's user
    SELECT id, email INTO canon_user_id, canon_email
    FROM auth.users
    WHERE email ILIKE '%canon%'
    LIMIT 1;
    
    IF canon_user_id IS NULL THEN
        RAISE EXCEPTION 'Could not find Canon user';
    END IF;
    
    RAISE NOTICE 'Found user: % (%)', canon_user_id, canon_email;
    
    -- Find Loopline Design organization
    SELECT id INTO org_id
    FROM organizations
    WHERE name ILIKE '%loopline%'
    LIMIT 1;
    
    -- If no org exists, create it
    IF org_id IS NULL THEN
        INSERT INTO organizations (name, plan_tier, seat_limit, seats_used)
        VALUES ('Loopline Design', 'team', 20, 0)
        RETURNING id INTO org_id;
        RAISE NOTICE 'Created organization: Loopline Design (%)', org_id;
    ELSE
        RAISE NOTICE 'Found organization: %', org_id;
    END IF;
    
    -- Find or create team
    SELECT t.id INTO team_id
    FROM teams t
    WHERE t.organization_id = org_id
    LIMIT 1;
    
    IF team_id IS NULL THEN
        INSERT INTO teams (name, organization_id, owner_id)
        VALUES ('Canon''s Team', org_id, canon_user_id)
        RETURNING id INTO team_id;
        RAISE NOTICE 'Created team: Canon''s Team (%)', team_id;
    ELSE
        RAISE NOTICE 'Found team: %', team_id;
    END IF;
    
    -- Update Canon's user record
    UPDATE users
    SET 
        organization_id = org_id,
        team_id = team_id,
        role = COALESCE(NULLIF(role, ''), 'manager'),
        is_active = true
    WHERE id = canon_user_id;
    
    RAISE NOTICE 'Updated Canon user with organization_id: % and team_id: %', org_id, team_id;
    
    -- Update all teammates to same organization
    UPDATE users u
    SET 
        organization_id = org_id,
        team_id = team_id,
        is_active = true
    FROM auth.users au
    WHERE u.id = au.id
      AND au.email LIKE 'test.teammate%@looplne.design'
      AND u.role = 'rep';
    
    RAISE NOTICE 'Updated teammates';
    
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

-- Verification: Show Canon's current status
SELECT 
    au.email,
    u.full_name,
    u.role,
    u.organization_id,
    u.team_id,
    u.is_active,
    o.name as organization_name,
    o.seat_limit,
    o.seats_used,
    t.name as team_name,
    (SELECT COUNT(*) FROM users WHERE organization_id = o.id AND is_active = true) as active_members
FROM auth.users au
JOIN users u ON au.id = u.id
LEFT JOIN organizations o ON u.organization_id = o.id
LEFT JOIN teams t ON u.team_id = t.id
WHERE au.email ILIKE '%canon%';

-- Show all teammates
SELECT 
    u.full_name,
    au.email,
    u.role,
    u.organization_id,
    u.team_id,
    u.is_active
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE au.email LIKE 'test.teammate%@looplne.design'
ORDER BY au.email;
