-- Fix RLS policy for team_knowledge_documents to allow INSERT
-- The existing policy only had USING clause, but FOR ALL requires WITH CHECK for INSERT

-- Drop the incomplete policy
DROP POLICY IF EXISTS "Managers can manage their team documents" ON team_knowledge_documents;

-- Recreate with proper WITH CHECK clause for INSERT operations
CREATE POLICY "Managers can manage their team documents" ON team_knowledge_documents
  FOR ALL
  USING (
    -- For SELECT, UPDATE, DELETE: Check if user is manager of the document's team
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND team_id = team_knowledge_documents.team_id
      AND role IN ('manager', 'admin')
    )
  )
  WITH CHECK (
    -- For INSERT, UPDATE: Check if user is manager of the team they're trying to insert to
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND team_id = team_knowledge_documents.team_id
      AND role IN ('manager', 'admin')
    )
  );

