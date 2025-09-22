-- Create training_documents table for PDF content
CREATE TABLE IF NOT EXISTS training_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('objection_handling', 'closing_techniques', 'discovery_questions', 'value_proposition', 'general')),
  source_file TEXT NOT NULL,
  page_number INTEGER,
  keywords TEXT[] -- Array of extracted keywords
);

-- Create index for text search
CREATE INDEX idx_training_documents_content ON training_documents USING gin(to_tsvector('english', content));
CREATE INDEX idx_training_documents_category ON training_documents(category);
CREATE INDEX idx_training_documents_keywords ON training_documents USING gin(keywords);

-- RLS policy
ALTER TABLE training_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read training documents" ON training_documents FOR SELECT USING (true);
CREATE POLICY "Admins can manage training documents" ON training_documents FOR ALL USING (true);
