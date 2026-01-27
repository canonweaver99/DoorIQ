-- Add industry field to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS industry_slug TEXT;

-- Add comment
COMMENT ON COLUMN users.industry_slug IS 'Industry slug (pest, fiber, roofing, solar, windows, security)';
