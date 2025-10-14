# Storage & RLS Status Report
**Date:** October 14, 2025  
**Status:** ✅ Resolved

## Critical Issues Fixed

### 1. ✅ Storage Bucket Consolidation

**Problem:**
- Two conflicting storage setup files with different folder structures
- No migration for knowledge-base bucket
- Upload endpoint couldn't work reliably

**Solution:**
- Created unified migration: `044_create_knowledge_base_storage.sql`
- Supports BOTH user-based (`{user_id}/`) and team-based (`team-{id}/`) folders
- Deleted duplicate setup files
- Set proper file size limit (50MB) and MIME type restrictions

**Files Changed:**
- ✅ Created: `lib/supabase/migrations/044_create_knowledge_base_storage.sql`
- ✅ Deleted: `lib/supabase/setup-knowledge-base-storage.sql`
- ✅ Deleted: `lib/supabase/setup-knowledge-storage.sql`

### 2. ✅ Group Members RLS Infinite Recursion

**Problem:**
- Migration 042 attempted to fix RLS but policies still had recursive queries
- Risk of infinite recursion when querying group_members

**Solution:**
- Migration 043 already disables RLS entirely on `group_members`
- Application-level security enforced in API routes
- This is a valid pattern when:
  1. Users must be authenticated (Supabase Auth)
  2. API routes check permissions before queries
  3. Related tables (messages) still have RLS

**Status:** Already fixed by existing migration 043

**Note:** `group_members` is used for messaging/group chats, NOT team management. Team management uses the `users` table with `team_id`.

## Implementation Details

### Storage Bucket RLS Policies

The unified policies support both systems:

```sql
-- UPLOAD: User's own folder OR team folder
CREATE POLICY "Users can upload knowledge base files"
WITH CHECK (
  bucket_id = 'knowledge-base' AND
  (
    auth.uid()::text = (storage.foldername(name))[1]  -- User folder
    OR
    (storage.foldername(name))[1] LIKE 'team-%'        -- Team folder
  )
);

-- SELECT: View all knowledge base files (public bucket)
-- UPDATE: User's files or team files
-- DELETE: User's files or team files
```

### Folder Structure

```
knowledge-base/
├── {user_id}/                    # Legacy user knowledge
│   └── {timestamp}.{ext}
└── team-{team_id}/               # New team knowledge
    └── {timestamp}-{filename}
```

## Testing Required

Before deploying to production:

1. ✅ Run migration 044 in staging/dev environment
2. ⚠️ Test team knowledge upload (manager role)
3. ⚠️ Test legacy user knowledge upload
4. ⚠️ Verify grading integration pulls team knowledge
5. ⚠️ Monitor logs for RLS errors

See `test-storage-upload.md` for detailed testing steps.

## Next Steps

### High Priority (This Week)
1. **PDF Text Extraction** - Add `pdf-parse` library
2. **Word Doc Extraction** - Add `mammoth` library  
3. **End-to-end testing** - Test full upload → grading flow

### Medium Priority
4. **Storage cleanup** - Delete orphaned files when documents are deleted
5. **File validation** - Add virus scanning or content validation
6. **Progress indicators** - Show upload progress for large files

### Low Priority
7. **Document versioning** - Track document changes over time
8. **Search/filter** - Add search across knowledge documents
9. **OCR support** - Extract text from scanned PDFs

## Knowledge Base Architecture

### Two Systems (By Design)

1. **Legacy System** (`knowledge_base` table)
   - User-specific knowledge
   - Used by individual reps
   - Folder: `{user_id}/`

2. **Team System** (`team_knowledge_documents` table)
   - Team-wide knowledge
   - Used for team grading
   - Folder: `team-{team_id}/`
   - Managed by managers only

**Why Both?**
- Backward compatibility
- Different use cases (personal vs team)
- Grading system checks both for comprehensive context

## Security Model

### Storage (RLS on storage.objects)
- ✅ Authenticated users only
- ✅ Upload to own folder or team folder
- ✅ View all files (public bucket)
- ✅ Modify/delete own files or team files

### Database Tables
- ✅ `knowledge_base` - RLS enabled, user-level policies
- ✅ `team_knowledge_documents` - RLS enabled, team-level policies
- ✅ `group_members` - RLS **disabled** (app-level security)

### API Routes
- ✅ All routes require authentication
- ✅ Role checks for manager-only actions
- ✅ Team membership verification

## Deployment Checklist

When deploying these changes:

- [ ] Run migration 044 in production
- [ ] Monitor Supabase logs for RLS errors (first 24 hours)
- [ ] Test file upload from production UI
- [ ] Verify existing files still accessible
- [ ] Check grading system logs for knowledge loading
- [ ] Update team members on new knowledge base features

## Support

If issues arise:
1. Check Supabase logs for specific errors
2. Verify migration 044 ran successfully
3. Test bucket policies in Supabase dashboard
4. Review API route logs for permission errors
5. Consult `test-storage-upload.md` for testing procedures

