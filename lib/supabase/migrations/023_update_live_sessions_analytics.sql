-- Update live_sessions table to ensure analytics column can store line-by-line ratings
-- The analytics JSONB column already exists and will store:
-- {
--   line_ratings: [{ line_number, effectiveness, score, alternative_lines, improvement_notes, category }],
--   feedback: { strengths, improvements, specific_tips },
--   graded_at: timestamp,
--   grading_version: string
-- }

-- Add any missing score columns that weren't in previous migrations
ALTER TABLE live_sessions
ADD COLUMN IF NOT EXISTS needs_discovery_score INTEGER CHECK (needs_discovery_score >= 0 AND needs_discovery_score <= 100);

-- Create extension for vector embeddings if needed (optional - uncomment if you have pgvector installed)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Add knowledge_base table for storing uploaded documents
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  -- team_id removed as teams table doesn't exist in current schema
  
  -- File information
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  
  -- Content and metadata
  content TEXT, -- Extracted text content
  -- embedding vector(1536), -- Uncomment if you have pgvector extension installed
  embedding_data JSONB, -- Alternative: store embeddings as JSONB array for now
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Access control
  is_public BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for knowledge base (IF NOT EXISTS for idempotency)
CREATE INDEX IF NOT EXISTS idx_knowledge_base_user_id ON knowledge_base(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_is_active ON knowledge_base(is_active);

-- Enable RLS for knowledge base
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS knowledge_base_select_policy ON knowledge_base;
DROP POLICY IF EXISTS knowledge_base_insert_policy ON knowledge_base;
DROP POLICY IF EXISTS knowledge_base_update_policy ON knowledge_base;
DROP POLICY IF EXISTS knowledge_base_delete_policy ON knowledge_base;

-- Users can see their own documents and public documents
CREATE POLICY knowledge_base_select_policy ON knowledge_base
  FOR SELECT
  USING (
    is_public = true 
    OR user_id = auth.uid()
  );

-- Users can insert their own documents
CREATE POLICY knowledge_base_insert_policy ON knowledge_base
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own documents
CREATE POLICY knowledge_base_update_policy ON knowledge_base
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own documents
CREATE POLICY knowledge_base_delete_policy ON knowledge_base
  FOR DELETE
  USING (user_id = auth.uid());

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update the updated_at column (only create if table was just created)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_knowledge_base_updated_at') THEN
    CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON knowledge_base
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- Add comment documenting the enhanced analytics structure
COMMENT ON COLUMN live_sessions.analytics IS 'Enhanced analytics including: {
  line_ratings: [{ 
    line_number: number,
    effectiveness: "excellent" | "good" | "average" | "poor",
    score: 0-100,
    alternative_lines: string[],
    improvement_notes: string,
    category: "introduction" | "rapport" | "discovery" | "objection_handling" | "closing" | "safety" | "general"
  }],
  feedback: { 
    strengths: string[], 
    improvements: string[], 
    specific_tips: string[] 
  },
  sentiment_data: { overall, by_section },
  key_moments: { price_discussed, safety_addressed, etc },
  transcript_sections: { introduction, discovery, presentation, closing },
  scores: { decimal values },
  grading_version: string,
  graded_at: timestamp
}';

COMMENT ON TABLE knowledge_base IS 'Stores uploaded documents for contextual grading and training';
COMMENT ON COLUMN knowledge_base.embedding_data IS 'Stores embedding vectors as JSONB array - can be migrated to vector type when pgvector is available';
