-- Create phrase_cache table for caching common phrases/responses
-- This replaces Redis caching with Supabase database caching

CREATE TABLE IF NOT EXISTS phrase_cache (
  cache_key TEXT PRIMARY KEY,
  phrase TEXT NOT NULL,
  alternatives TEXT[] NOT NULL,
  rating TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_phrase_cache_created_at ON phrase_cache(created_at);

-- Add comment
COMMENT ON TABLE phrase_cache IS 'Cache for common phrases and their alternatives to avoid redundant AI calls';
COMMENT ON COLUMN phrase_cache.cache_key IS 'Hashed key based on phrase and context';
COMMENT ON COLUMN phrase_cache.alternatives IS 'Array of alternative ways to phrase the line';

-- Function to clean up expired cache entries (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_expired_phrase_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM phrase_cache
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

