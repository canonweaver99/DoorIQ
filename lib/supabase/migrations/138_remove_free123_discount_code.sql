-- Migration: Remove FREE123 discount code
-- Migration: 138_remove_free123_discount_code.sql
-- Date: 2025-01-XX
-- Purpose: Remove the FREE123 discount code since Individual plans already have a 7-day free trial

-- Delete the FREE123 discount code
DELETE FROM discount_codes
WHERE code = 'FREE123';

-- Add comment for documentation
COMMENT ON TABLE discount_codes IS 'Admin-created discount codes for checkout. FREE123 has been removed - Individual plans have a 7-day free trial instead.';

