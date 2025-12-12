-- Create error_logs table for error tracking
-- Migration: 129_create_error_logs_table.sql
-- Date: 2025-01-XX
-- Purpose: Track application errors for admin monitoring and debugging

-- ============================================
-- 1. Create error_logs table
-- ============================================

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_type TEXT, -- 'client', 'server', 'api', 'elevenlabs', 'webrtc', etc.
  page_url TEXT,
  user_agent TEXT,
  component_name TEXT,
  severity TEXT DEFAULT 'error', -- 'error', 'warning', 'critical'
  resolved BOOLEAN DEFAULT FALSE,
  metadata JSONB -- store additional context
);

-- ============================================
-- 2. Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);

-- ============================================
-- 3. Enable Row Level Security
-- ============================================

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Create RLS Policies
-- ============================================

-- Admins can view all errors
CREATE POLICY error_logs_admin_select ON error_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Users can insert their own errors
CREATE POLICY error_logs_user_insert ON error_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admins can update errors (for marking resolved)
CREATE POLICY error_logs_admin_update ON error_logs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================
-- 5. Add comments
-- ============================================

COMMENT ON TABLE error_logs IS 'Application error logs for tracking and debugging. Admins can view all errors, users can log their own errors.';
COMMENT ON COLUMN error_logs.user_id IS 'User who encountered the error (null for anonymous/unauthenticated errors)';
COMMENT ON COLUMN error_logs.user_email IS 'Email of the user who encountered the error (for easier identification)';
COMMENT ON COLUMN error_logs.error_message IS 'Main error message';
COMMENT ON COLUMN error_logs.error_stack IS 'Full error stack trace if available';
COMMENT ON COLUMN error_logs.error_type IS 'Type of error: client, server, api, elevenlabs, webrtc, etc.';
COMMENT ON COLUMN error_logs.page_url IS 'URL of the page where error occurred (client-side only)';
COMMENT ON COLUMN error_logs.user_agent IS 'User agent string of the browser/client';
COMMENT ON COLUMN error_logs.component_name IS 'React component name where error occurred (if applicable)';
COMMENT ON COLUMN error_logs.severity IS 'Error severity: warning, error, or critical';
COMMENT ON COLUMN error_logs.resolved IS 'Whether the error has been resolved/reviewed by admin';
COMMENT ON COLUMN error_logs.metadata IS 'Additional context data stored as JSON';

-- ============================================
-- Migration Complete
-- ============================================
