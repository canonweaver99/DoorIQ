# Test Storage Upload Flow

## Steps to Test Knowledge Base Upload

### 1. Apply the Migration
```bash
# Run this in your Supabase dashboard SQL editor or via CLI:
# lib/supabase/migrations/044_create_knowledge_base_storage.sql
```

### 2. Test Team Knowledge Upload (New System)

**As a Manager:**
1. Navigate to `/manager?tab=knowledge`
2. Click on "Upload Documents" tab
3. Try uploading a test file (PDF, TXT, or DOCX)
4. Verify:
   - File uploads successfully
   - File appears in the documents list
   - File is stored in `team-{team_id}/` folder
   - You can delete the file

**Expected Result:**
- File should upload to: `knowledge-base/team-{UUID}/{timestamp}-{filename}`
- Document entry created in `team_knowledge_documents` table
- File is accessible via public URL

### 3. Test Legacy User Knowledge Upload

**As any user:**
1. Navigate to `/knowledge-base`
2. Upload a test file
3. Verify:
   - File uploads successfully
   - File appears in the list
   - File is stored in `{user_id}/` folder

**Expected Result:**
- File should upload to: `knowledge-base/{user_uuid}/{timestamp}.{ext}`
- Document entry created in `knowledge_base` table

### 4. Verify Storage Bucket

In Supabase Dashboard → Storage:
1. Check that `knowledge-base` bucket exists
2. Verify it's set to public
3. Check file size limit is 50MB
4. Verify allowed MIME types include:
   - application/pdf
   - text/plain
   - application/msword
   - application/vnd.openxmlformats-officedocument.wordprocessingml.document

### 5. Test Grading Integration

1. Complete a training session
2. Grade the session (POST to `/api/grade/session`)
3. Check logs to verify:
   - Team grading config is loaded (if user has a team)
   - Team knowledge documents are loaded (if available)
   - Grading uses team-specific criteria

## Troubleshooting

### Upload Fails with "Failed to upload file"
- Check that migration 044 has been applied
- Verify storage bucket exists in Supabase
- Check browser console for detailed error
- Verify user has manager role for team uploads

### RLS Policy Error
- Check that policies were created correctly
- Verify user is authenticated
- Check folder naming matches pattern (team-{id} or {user_id})

### File Not Extracting Text
- Currently only .txt files extract text automatically
- PDF and Word docs show placeholder text
- This is expected - PDF extraction will be added in next update

## Success Criteria

✅ Team managers can upload files to their team's knowledge base
✅ Files are stored in correct folder structure
✅ RLS policies allow proper access (view/upload/delete)
✅ Legacy user knowledge base still works
✅ Grading system pulls team knowledge correctly
✅ No RLS infinite recursion errors in logs

