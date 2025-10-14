-- Step 1: Find your user ID (run this first to see your user ID)
SELECT id, email, full_name, role FROM users ORDER BY created_at DESC LIMIT 5;

-- Step 2: Create a team (note the ID that gets returned)
INSERT INTO teams (name) VALUES ('My Team') RETURNING id, name;

-- Step 3: After getting the team ID from step 2, update this query with the actual IDs
-- Replace YOUR_EMAIL_HERE with your actual email from step 1
-- Replace TEAM_ID_HERE with the team id from step 2
UPDATE users 
SET team_id = 'TEAM_ID_HERE', 
    role = 'manager' 
WHERE email = 'YOUR_EMAIL_HERE'
RETURNING id, email, full_name, team_id, role;

-- Or if you want to assign ALL users to the same team:
-- UPDATE users SET team_id = 'TEAM_ID_HERE', role = 'manager' WHERE team_id IS NULL;

