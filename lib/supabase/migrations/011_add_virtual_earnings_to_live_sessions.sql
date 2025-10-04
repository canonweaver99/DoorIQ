-- Add virtual_earnings support to live_sessions
-- This migration adds the virtual_earnings column and trigger to properly track and accumulate earnings

-- 1) Add virtual_earnings column to live_sessions table
ALTER TABLE live_sessions 
ADD COLUMN IF NOT EXISTS virtual_earnings DECIMAL(10, 2) DEFAULT 0.00;

-- 2) Add index for performance
CREATE INDEX IF NOT EXISTS idx_live_sessions_virtual_earnings ON live_sessions(virtual_earnings DESC);

-- 3) Create or replace the trigger function to update user's total virtual_earnings
CREATE OR REPLACE FUNCTION update_user_virtual_earnings_from_live_sessions()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if virtual_earnings is set and session is ended
  -- Also check if this is an UPDATE and the virtual_earnings actually changed
  IF NEW.virtual_earnings IS NOT NULL 
     AND NEW.virtual_earnings > 0 
     AND NEW.ended_at IS NOT NULL THEN
    
    -- For UPDATE operations, subtract old value first (if any)
    IF TG_OP = 'UPDATE' AND OLD.virtual_earnings IS NOT NULL AND OLD.virtual_earnings > 0 THEN
      UPDATE users 
      SET virtual_earnings = GREATEST(0, COALESCE(virtual_earnings, 0) - OLD.virtual_earnings + NEW.virtual_earnings)
      WHERE id = NEW.user_id;
    ELSE
      -- For INSERT or first-time earnings update
      UPDATE users 
      SET virtual_earnings = COALESCE(virtual_earnings, 0) + NEW.virtual_earnings
      WHERE id = NEW.user_id;
    END IF;
    
    -- Log the update for debugging
    RAISE NOTICE 'Updated virtual_earnings for user % by adding session earnings of %', NEW.user_id, NEW.virtual_earnings;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4) Create trigger on live_sessions
DROP TRIGGER IF EXISTS update_user_earnings_from_live_sessions_trigger ON live_sessions;
CREATE TRIGGER update_user_earnings_from_live_sessions_trigger
AFTER INSERT OR UPDATE OF virtual_earnings, ended_at ON live_sessions
FOR EACH ROW
EXECUTE FUNCTION update_user_virtual_earnings_from_live_sessions();

-- 5) Add a helpful comment
COMMENT ON COLUMN live_sessions.virtual_earnings IS 'Amount of virtual money earned in this session based on deals closed during practice';
COMMENT ON TRIGGER update_user_earnings_from_live_sessions_trigger ON live_sessions IS 'Automatically updates user total earnings when session earnings are recorded';
