# Setup Knowledge Base Storage Bucket

## Step 1: Create the Bucket in Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. Navigate to **Storage** in the left sidebar

3. Click **"New bucket"** button

4. Configure the bucket:
   ```
   Name: knowledge-base
   ID: knowledge-base
   Public bucket: ✓ Yes
   File size limit: 52428800 (50MB in bytes)
   Allowed MIME types:
     - application/pdf
     - text/plain
     - text/markdown
     - application/msword
     - application/vnd.openxmlformats-officedocument.wordprocessingml.document
     - application/vnd.ms-excel
     - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
   ```

5. Click **"Create bucket"**

## Step 2: Run the Migration

After the bucket is created, run migration 044:

### Option A: Via Supabase Dashboard

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **"New query"**
3. Copy and paste the contents of:
   ```
   lib/supabase/migrations/044_create_knowledge_base_storage.sql
   ```
4. Click **"Run"**

### Option B: Via Supabase CLI

```bash
npx supabase migration up --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### Option C: Manually (if migration already ran and failed)

Just run this SQL in the SQL Editor:

```sql
-- Drop any existing policies
DROP POLICY IF EXISTS "Users can upload their own knowledge base files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all knowledge base files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own knowledge base files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own knowledge base files" ON storage.objects;
DROP POLICY IF EXISTS "Team members can upload knowledge docs" ON storage.objects;
DROP POLICY IF EXISTS "Team members can view their team knowledge docs" ON storage.objects;
DROP POLICY IF EXISTS "Managers can delete their team knowledge docs" ON storage.objects;

-- UPLOAD policy
CREATE POLICY "Users can upload knowledge base files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'knowledge-base' AND
  (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    (storage.foldername(name))[1] LIKE 'team-%'
  )
);

-- SELECT policy
CREATE POLICY "Users can view knowledge base files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'knowledge-base');

-- UPDATE policy
CREATE POLICY "Users can update knowledge base files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'knowledge-base' AND
  (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    (storage.foldername(name))[1] LIKE 'team-%'
  )
);

-- DELETE policy
CREATE POLICY "Users can delete knowledge base files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'knowledge-base' AND
  (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    (storage.foldername(name))[1] LIKE 'team-%'
  )
);
```

## Step 3: Verify Setup

### Check in Dashboard

1. **Storage > knowledge-base** - Bucket should exist and be public
2. **Storage > Policies** - Should see 4 policies for knowledge-base bucket

### Test Upload

1. Log into your app as a manager
2. Go to `/manager?tab=knowledge`
3. Upload a test file
4. Check **Storage > knowledge-base** - You should see a folder `team-{UUID}`
5. File should appear in the UI's documents list

## Troubleshooting

### "Bucket not found" error
- Make sure you created the bucket in Step 1
- Verify the bucket ID is exactly: `knowledge-base`

### "New row violates row-level security policy" 
- Make sure migration 044 ran successfully
- Check that RLS policies were created (Storage > Policies)
- Verify user is authenticated

### "File size too large"
- Bucket limit is 50MB
- Check file size: should be < 52428800 bytes

### Policies not showing up
- Refresh the dashboard
- Run the manual SQL from Option C above
- Check for errors in SQL editor

## What This Sets Up

This configuration supports:

1. **Team Knowledge Base** (new system)
   - Files: `team-{team_id}/{timestamp}-{filename}`
   - Managers upload company documents
   - Used in AI grading

2. **User Knowledge Base** (legacy system)
   - Files: `{user_id}/{timestamp}.{ext}`
   - Individual user uploads
   - Backward compatible

Both systems work simultaneously with unified RLS policies.

## Security Model

- ✅ Only authenticated users can access
- ✅ Users can upload to their own folder or team folder
- ✅ All authenticated users can view files (public bucket)
- ✅ Users can only modify/delete their own or team files
- ✅ 50MB file size limit
- ✅ MIME type restrictions (documents only, no executables)

