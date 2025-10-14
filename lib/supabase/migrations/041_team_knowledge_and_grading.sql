-- Team-specific grading configuration
CREATE TABLE IF NOT EXISTS team_grading_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE UNIQUE,
  
  -- Company Information
  company_name TEXT,
  company_mission TEXT,
  product_description TEXT,
  service_guarantees TEXT,
  company_values TEXT[],
  
  -- Pricing Information
  pricing_info JSONB DEFAULT '[]'::jsonb,
  
  -- Objection Handlers
  objection_handlers JSONB DEFAULT '[]'::jsonb,
  
  -- Custom Grading Rubric
  custom_grading_rubric JSONB DEFAULT '{
    "weights": {
      "rapport_score": 15,
      "objection_handling_score": 25,
      "close_effectiveness_score": 30,
      "needs_discovery_score": 20,
      "introduction_score": 10
    },
    "custom_criteria": [],
    "automatic_fails": []
  }'::jsonb,
  
  -- Thresholds
  passing_score INTEGER DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
  
  -- Status
  enabled BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Knowledge base documents
CREATE TABLE IF NOT EXISTS team_knowledge_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Document Info
  document_name TEXT NOT NULL,
  file_url TEXT,
  file_size_bytes BIGINT,
  extracted_content TEXT,
  
  -- Classification
  document_type TEXT CHECK (document_type IN ('playbook', 'pricing', 'policy', 'script', 'product_info', 'training', 'other')),
  
  -- Usage
  use_in_grading BOOLEAN DEFAULT true,
  is_shared BOOLEAN DEFAULT false, -- Can be shared with other teams
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Version tracking (for future)
  version INTEGER DEFAULT 1
);

-- Shared documents access (for cross-team sharing)
CREATE TABLE IF NOT EXISTS team_shared_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES team_knowledge_documents(id) ON DELETE CASCADE,
  shared_with_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES users(id) ON DELETE SET NULL,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(document_id, shared_with_team_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_grading_configs_team_id ON team_grading_configs(team_id);
CREATE INDEX IF NOT EXISTS idx_team_knowledge_docs_team_id ON team_knowledge_documents(team_id);
CREATE INDEX IF NOT EXISTS idx_team_knowledge_docs_type ON team_knowledge_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_team_shared_docs_team_id ON team_shared_documents(shared_with_team_id);

-- RLS policies
ALTER TABLE team_grading_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_shared_documents ENABLE ROW LEVEL SECURITY;

-- Team grading configs: Managers can view/edit their team's config
CREATE POLICY "Team members can view their team grading config" ON team_grading_configs
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage their team grading config" ON team_grading_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND team_id = team_grading_configs.team_id
      AND role IN ('manager', 'admin')
    )
  );

-- Knowledge documents: Team members can view, managers can manage
CREATE POLICY "Team members can view their team documents" ON team_knowledge_documents
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
    OR id IN (
      SELECT document_id FROM team_shared_documents 
      WHERE shared_with_team_id IN (
        SELECT team_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Managers can manage their team documents" ON team_knowledge_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND team_id = team_knowledge_documents.team_id
      AND role IN ('manager', 'admin')
    )
  );

-- Shared documents: Managers can share
CREATE POLICY "Managers can share documents" ON team_shared_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN team_knowledge_documents d ON d.id = team_shared_documents.document_id
      WHERE u.id = auth.uid() 
      AND u.team_id = d.team_id
      AND u.role IN ('manager', 'admin')
    )
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_grading_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_grading_configs_updated_at
  BEFORE UPDATE ON team_grading_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_team_grading_config_updated_at();

-- Comments
COMMENT ON TABLE team_grading_configs IS 'Team-specific grading configuration and company knowledge';
COMMENT ON TABLE team_knowledge_documents IS 'Uploaded documents and training materials for team-specific grading';
COMMENT ON TABLE team_shared_documents IS 'Cross-team document sharing configuration';

