# QUICK FIX: Create Storage Bucket Now

## You're seeing "Failed to upload files" because the storage bucket doesn't exist yet.

### Fix it in 3 steps (5 minutes):

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your DoorIQ project

2. **Create the Bucket**
   - Click **Storage** in left sidebar
   - Click **"New bucket"** button
   - Enter these settings:
     ```
     Name: knowledge-base
     Public: ✓ YES (check the box)
     File size limit: 52428800
     ```
   - Click **Create**

3. **Configure MIME Types**
   - Click on the newly created `knowledge-base` bucket
   - Click **Settings** (gear icon)
   - Under "Allowed MIME types", add:
     ```
     application/pdf
     text/plain
     text/markdown
     application/msword
     application/vnd.openxmlformats-officedocument.wordprocessingml.document
     ```
   - Click **Save**

4. **Run Migration 044**
   - In Supabase Dashboard, go to **SQL Editor**
   - Click **New query**
   - Copy/paste from: `lib/supabase/migrations/044_create_knowledge_base_storage.sql`
   - Click **Run**

5. **Refresh Your App**
   - Go back to your app
   - Refresh the page
   - Try uploading again - should work now! ✅

---

## Visual Guide

### Step 1: Navigate to Storage
```
Supabase Dashboard → Left Sidebar → Storage
```

### Step 2: Create Bucket
```
Click "New bucket" button
Name: knowledge-base
[✓] Public bucket
File size limit: 52428800
Click "Create bucket"
```

### Step 3: The upload will work!

---

## Still not working?

Check browser console (F12) for the actual error, then we can debug further.

