# Fix: "Failed to upload" Issue

## The Problem
The file **uploaded to storage successfully** ✅, but creating the database entry **failed** ❌ due to an incomplete RLS policy.

## Quick Fix (2 minutes)

### Run these 2 SQL migrations in Supabase:

1. **First: Fix the storage RLS policies**
   - Go to Supabase Dashboard → SQL Editor
   - Run: `lib/supabase/migrations/044_create_knowledge_base_storage.sql`

2. **Second: Fix the database RLS policy**
   - In the same SQL Editor
   - Run: `lib/supabase/migrations/045_fix_team_documents_rls.sql`

### Manual SQL (if you prefer to copy/paste)

```sql
-- Fix 1: Storage RLS policies (from migration 044)
DROP POLICY IF EXISTS "Users can upload their own knowledge base files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all knowledge base files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own knowledge base files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own knowledge base files" ON storage.objects;
DROP POLICY IF EXISTS "Team members can upload knowledge docs" ON storage.objects;
DROP POLICY IF EXISTS "Team members can view their team knowledge docs" ON storage.objects;
DROP POLICY IF EXISTS "Managers can delete their team knowledge docs" ON storage.objects;

CREATE POLICY "Users can upload knowledge base files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'knowledge-base' AND
  ((storage.foldername(name))[1] = auth.uid()::text OR (storage.foldername(name))[1] LIKE 'team-%')
);

CREATE POLICY "Users can view knowledge base files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'knowledge-base');

CREATE POLICY "Users can update knowledge base files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'knowledge-base' AND
  ((storage.foldername(name))[1] = auth.uid()::text OR (storage.foldername(name))[1] LIKE 'team-%')
);

CREATE POLICY "Users can delete knowledge base files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'knowledge-base' AND
  ((storage.foldername(name))[1] = auth.uid()::text OR (storage.foldername(name))[1] LIKE 'team-%')
);

-- Fix 2: Database RLS policy (from migration 045)
DROP POLICY IF EXISTS "Managers can manage their team documents" ON team_knowledge_documents;

CREATE POLICY "Managers can manage their team documents" ON team_knowledge_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND team_id = team_knowledge_documents.team_id
      AND role IN ('manager', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND team_id = team_knowledge_documents.team_id
      AND role IN ('manager', 'admin')
    )
  );
```

## After Running the Fixes

1. **Clean up that orphaned file** (optional):
   - In Supabase Storage → knowledge-base bucket
   - Delete the file that uploaded but didn't get a database entry
   - Or leave it (it won't hurt anything)

2. **Try uploading again**:
   - Go back to your app
   - Refresh the page
   - Upload a file
   - Should work now! ✅

## What Was Wrong?

**Storage**: No RLS policies existed, so Supabase allowed the upload

**Database**: RLS policy only had `USING` clause (for reads), but was missing `WITH CHECK` clause (for inserts)

**Result**: File uploaded ✅, but database insert blocked ❌

## Testing Checklist

After fixes:
- [ ] Upload a file in the UI
- [ ] See success message (not "failed")
- [ ] File appears in the documents list
- [ ] Can download the file
- [ ] Can delete the file

All should work now! 🎉

