-- Migration: 070_add_org_active_reps.sql
-- Add active reps tracking functions and update seats_used calculation

-- Function to get count of active reps for an organization
CREATE OR REPLACE FUNCTION get_organization_active_reps(org_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM users
    WHERE organization_id = org_id
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate seats_used based on active reps
CREATE OR REPLACE FUNCTION recalculate_organization_seats(org_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE organizations
  SET seats_used = get_organization_active_reps(org_id)
  WHERE id = org_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment seats_used when a rep is activated
CREATE OR REPLACE FUNCTION increment_organization_seats_if_active(org_id UUID, user_is_active BOOLEAN)
RETURNS void AS $$
BEGIN
  IF user_is_active THEN
    UPDATE organizations
    SET seats_used = seats_used + 1
    WHERE id = org_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement seats_used when a rep is deactivated
CREATE OR REPLACE FUNCTION decrement_organization_seats_if_inactive(org_id UUID, user_is_active BOOLEAN)
RETURNS void AS $$
BEGIN
  IF NOT user_is_active THEN
    UPDATE organizations
    SET seats_used = GREATEST(0, seats_used - 1)
    WHERE id = org_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update seats_used when user is_active changes
CREATE OR REPLACE FUNCTION update_org_seats_on_user_status_change()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Check if organization_id column exists and get its value
  -- Use a safe method to access the column
  BEGIN
    -- Try to access organization_id directly
    -- This will fail gracefully if column doesn't exist
    SELECT NEW.organization_id INTO org_id;
    
    -- Only process if organization_id exists and is_active changed
    IF org_id IS NOT NULL AND (OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
      IF NEW.is_active = true AND (OLD.is_active = false OR OLD.is_active IS NULL) THEN
        -- User activated: increment seats
        UPDATE organizations
        SET seats_used = seats_used + 1
        WHERE id = org_id;
      ELSIF NEW.is_active = false AND OLD.is_active = true THEN
        -- User deactivated: decrement seats
        UPDATE organizations
        SET seats_used = GREATEST(0, seats_used - 1)
        WHERE id = org_id;
      END IF;
    END IF;
  EXCEPTION
    WHEN undefined_column THEN
      -- Column doesn't exist yet, skip processing
      NULL;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update seats_used when user is_active changes
-- Only create trigger if organization_id column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'organization_id'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_update_org_seats_on_user_status ON users;
    -- Create trigger that fires on is_active changes
    -- The function will handle checking if organization_id exists
    CREATE TRIGGER trigger_update_org_seats_on_user_status
      AFTER UPDATE OF is_active ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_org_seats_on_user_status_change();
    
    -- Also create trigger for organization_id changes
    CREATE TRIGGER trigger_update_org_seats_on_org_change
      AFTER UPDATE OF organization_id ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_org_seats_on_user_status_change();
  END IF;
END $$;

-- Recalculate all organization seats_used based on current active reps
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT id FROM organizations LOOP
    PERFORM recalculate_organization_seats(org_record.id);
  END LOOP;
END $$;

-- Add comments
COMMENT ON FUNCTION get_organization_active_reps IS 'Returns count of active reps for an organization';
COMMENT ON FUNCTION recalculate_organization_seats IS 'Recalculates seats_used based on current active rep count';
COMMENT ON FUNCTION increment_organization_seats_if_active IS 'Increments seats_used if user is active';
COMMENT ON FUNCTION decrement_organization_seats_if_inactive IS 'Decrements seats_used if user is inactive';

