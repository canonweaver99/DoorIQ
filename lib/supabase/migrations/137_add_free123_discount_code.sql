-- Migration: Add free123 discount code (100% discount)
-- Migration: 137_add_free123_discount_code.sql
-- Date: 2025-01-XX
-- Purpose: Create a discount code that makes the app completely free

-- ============================================
-- 1. Create discount_codes table if it doesn't exist
-- ============================================

CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER, -- NULL = unlimited uses
  uses_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT discount_codes_code_unique UNIQUE (code),
  CONSTRAINT discount_codes_value_check CHECK (
    (discount_type = 'percentage' AND discount_value <= 100) OR
    (discount_type = 'fixed')
  )
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_created_by ON discount_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_discount_codes_is_active ON discount_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_discount_codes_expires_at ON discount_codes(expires_at);

-- Enable Row Level Security
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies if they don't exist
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS discount_codes_admin_all ON discount_codes;
  DROP POLICY IF EXISTS discount_codes_read_active ON discount_codes;
  
  -- Create admin policy
  CREATE POLICY discount_codes_admin_all ON discount_codes
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
      )
    );
  
  -- Create read policy for active codes
  CREATE POLICY discount_codes_read_active ON discount_codes
    FOR SELECT
    USING (
      is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (max_uses IS NULL OR uses_count < max_uses)
    );
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_discount_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS discount_codes_updated_at ON discount_codes;
CREATE TRIGGER discount_codes_updated_at
  BEFORE UPDATE ON discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_discount_codes_updated_at();

-- ============================================
-- 2. Insert the free123 discount code
-- ============================================

-- Insert the free123 discount code with 100% discount
-- Use the admin user (canonweaver@loopline.design) as created_by
INSERT INTO discount_codes (
  code,
  discount_type,
  discount_value,
  created_by,
  expires_at,
  max_uses,
  uses_count,
  is_active,
  description
)
SELECT 
  'FREE123',
  'percentage',
  100.00,
  (SELECT id FROM users WHERE email = 'canonweaver@loopline.design' AND role = 'admin' LIMIT 1),
  NULL, -- Never expires
  NULL, -- Unlimited uses
  0,
  true,
  '100% discount - completely free access'
WHERE NOT EXISTS (
  SELECT 1 FROM discount_codes WHERE code = 'FREE123'
);

-- Add comments
COMMENT ON TABLE discount_codes IS 'Admin-created discount codes for checkout. free123 provides 100% discount.';
COMMENT ON COLUMN discount_codes.code IS 'Unique discount code (case-insensitive matching recommended)';
COMMENT ON COLUMN discount_codes.discount_type IS 'Type of discount: percentage or fixed amount';
COMMENT ON COLUMN discount_codes.discount_value IS 'Discount amount (percentage 0-100 or fixed dollar amount)';
COMMENT ON COLUMN discount_codes.created_by IS 'Admin user who created this discount code';
COMMENT ON COLUMN discount_codes.max_uses IS 'Maximum number of times this code can be used (NULL = unlimited)';
COMMENT ON COLUMN discount_codes.uses_count IS 'Number of times this code has been used';

