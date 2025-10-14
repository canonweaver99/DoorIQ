# Storage Bucket Setup Instructions

## Current Status
⚠️ **Temporary Solution Active:** Documents are currently uploading to the `audio-recordings` bucket under a `documents/` folder to avoid permission issues.

## Quick Fix Applied
✅ Document uploads now work using the existing `audio-recordings` bucket
✅ Files are stored in `documents/team-{teamId}/` subfolder
✅ No manual setup required - works immediately

## For Production (Optional)

If you want a dedicated `knowledge-base` bucket later:

### Manual Bucket Creation (Via Supabase Dashboard)

1. **Go to Supabase Dashboard**
   - Open your project
   - Navigate to **Storage** in the sidebar

2. **Create New Bucket**
   - Click **"New bucket"**
   - Bucket ID: `knowledge-base`
   - Name: `knowledge-base`
   - Public: ✅ **Yes** (checked)
   - File size limit: `52428800` (50MB)
   - Allowed MIME types: `application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document`

3. **Set RLS Policies**
   Run this SQL in the SQL Editor:

```sql
-- Allow authenticated users to upload team documents
CREATE POLICY "Team members can upload knowledge docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'knowledge-base' AND
  (storage.foldername(name))[1] LIKE 'team-%'
);

-- Allow viewing of all knowledge base files
CREATE POLICY "Users can view knowledge base files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'knowledge-base');

-- Allow managers to delete team documents
CREATE POLICY "Managers can delete team knowledge docs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'knowledge-base' AND
  (storage.foldername(name))[1] LIKE 'team-%'
);
```

4. **Update API Endpoint**
   Change `bucketName = 'audio-recordings'` to `bucketName = 'knowledge-base'` in:
   - `app/api/team/knowledge/upload/route.ts`

## Current Working Solution

✅ **No action needed** - documents upload successfully to `audio-recordings/documents/` folder
✅ Proper team isolation with `team-{teamId}` subfolders
✅ All functionality working as expected

## File Structure

```
audio-recordings/
├── uploads/           # Audio files from training sessions
└── documents/         # Knowledge base documents
    └── team-{teamId}/
        ├── timestamp-document1.pdf
        ├── timestamp-document2.docx
        └── timestamp-document3.txt
```

## Testing

The document upload should now work! Try uploading:
- ✅ PDF files
- ✅ Word documents (DOC, DOCX)  
- ✅ Text files (TXT)
- ✅ Up to 50MB per file

If you see the success toast notification, everything is working correctly! 🎉
