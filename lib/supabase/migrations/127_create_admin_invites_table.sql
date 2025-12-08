-- Create admin_invites table for invite-only signups
-- Migration: 127_create_admin_invites_table.sql
-- Date: 2025-12-08
-- Purpose: Restrict signups to admin invites and payment checkout only

-- ============================================
-- 1. Create admin_invites table
-- ============================================

CREATE TABLE IF NOT EXISTS admin_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT, -- Optional: if set, invite is only valid for this email
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  purpose TEXT, -- e.g., 'testing', 'demo', 'beta', etc.
  
  -- Constraints
  CONSTRAINT admin_invites_token_unique UNIQUE (token),
  CONSTRAINT admin_invites_expires_check CHECK (expires_at > created_at)
);

-- ============================================
-- 2. Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_admin_invites_token ON admin_invites(token);
CREATE INDEX IF NOT EXISTS idx_admin_invites_email ON admin_invites(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_admin_invites_created_by ON admin_invites(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_invites_expires_at ON admin_invites(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_invites_used_at ON admin_invites(used_at) WHERE used_at IS NULL;

-- ============================================
-- 3. Enable Row Level Security
-- ============================================

ALTER TABLE admin_invites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Create RLS Policies
-- ============================================

-- Admins can do everything
CREATE POLICY admin_invites_admin_all ON admin_invites
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Anyone can read invites by token (needed for validation during signup)
CREATE POLICY admin_invites_read_by_token ON admin_invites
  FOR SELECT
  USING (true); -- Public read for token validation

-- ============================================
-- 5. Add comments
-- ============================================

COMMENT ON TABLE admin_invites IS 'Admin-created invite tokens for invite-only signups. Tokens can be email-specific or open.';
COMMENT ON COLUMN admin_invites.token IS 'Unique secure token for the invite link';
COMMENT ON COLUMN admin_invites.email IS 'Optional: if set, invite is only valid for this specific email address';
COMMENT ON COLUMN admin_invites.expires_at IS 'When the invite expires. After this date, invite cannot be used.';
COMMENT ON COLUMN admin_invites.used_at IS 'When the invite was used (null if unused)';
COMMENT ON COLUMN admin_invites.used_by IS 'User ID who used this invite (null if unused)';
COMMENT ON COLUMN admin_invites.purpose IS 'Purpose/notes for the invite (e.g., testing, demo, beta)';

-- ============================================
-- Migration Complete
-- ============================================
