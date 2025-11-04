-- Migration: 056_create_testimonials_table
-- Create testimonials table for user-submitted reviews with approval workflow

CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON testimonials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_user_id ON testimonials(user_id);

-- Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can submit a review (INSERT)
CREATE POLICY "Anyone can submit reviews"
  ON testimonials
  FOR INSERT
  WITH CHECK (true);

-- Policy: Anyone can view accepted reviews
CREATE POLICY "Anyone can view accepted testimonials"
  ON testimonials
  FOR SELECT
  USING (status = 'accepted');

-- Policy: Only admins can view all reviews (pending, accepted, rejected)
CREATE POLICY "Admins can view all testimonials"
  ON testimonials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Only admins can update review status
CREATE POLICY "Admins can update testimonials"
  ON testimonials
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    NEW.accepted_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_testimonials_updated_at();

-- Add comment for documentation
COMMENT ON TABLE testimonials IS 'User-submitted testimonials with approval workflow. Only accepted reviews are visible to public.';
COMMENT ON COLUMN testimonials.status IS 'Review status: pending (awaiting approval), accepted (visible on site), rejected (hidden)';
COMMENT ON COLUMN testimonials.profile_image_url IS 'Optional profile image URL for real user reviews';

