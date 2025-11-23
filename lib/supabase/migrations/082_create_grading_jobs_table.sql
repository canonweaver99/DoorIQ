-- Create grading_jobs table for Supabase-based job queue
-- This replaces Redis/BullMQ with a simple database-backed queue

CREATE TABLE IF NOT EXISTS grading_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('line_rating', 'full_grading')),
  job_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result JSONB,
  error TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient job retrieval
CREATE INDEX IF NOT EXISTS idx_grading_jobs_status ON grading_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_grading_jobs_session_id ON grading_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_grading_jobs_type_status ON grading_jobs(job_type, status);

-- Add comments
COMMENT ON TABLE grading_jobs IS 'Simple database-backed job queue for grading tasks';
COMMENT ON COLUMN grading_jobs.job_data IS 'Job-specific data (transcript batches, etc.)';
COMMENT ON COLUMN grading_jobs.result IS 'Job result data when completed';
COMMENT ON COLUMN grading_jobs.error IS 'Error message when failed';

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_grading_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_grading_jobs_updated_at ON grading_jobs;
CREATE TRIGGER trigger_update_grading_jobs_updated_at
  BEFORE UPDATE ON grading_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_grading_jobs_updated_at();

-- Cleanup old completed jobs (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_grading_jobs()
RETURNS void AS $$
BEGIN
  DELETE FROM grading_jobs
  WHERE status = 'completed'
    AND completed_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

