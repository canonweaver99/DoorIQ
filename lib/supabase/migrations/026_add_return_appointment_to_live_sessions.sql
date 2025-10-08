-- Add return_appointment boolean column to live_sessions

ALTER TABLE live_sessions
ADD COLUMN IF NOT EXISTS return_appointment boolean DEFAULT false;

COMMENT ON COLUMN live_sessions.return_appointment IS 'Indicates whether a follow-up inspection/appointment was scheduled during the conversation';

