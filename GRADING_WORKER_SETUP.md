# Grading Worker Setup Guide (Supabase-Based)

This guide explains how to set up and run the background grading worker using **Supabase** (no Redis required).

## Overview

The grading worker processes line-by-line rating jobs in the background using Supabase's database as a simple job queue. This eliminates the need for Redis.

## Prerequisites

1. **Supabase Database**: Already configured
2. **Database Migrations**: Run migrations `082` and `083`

## Setup Steps

### 1. Run Database Migrations

Apply the migrations:

```bash
# Migration 082: Creates grading_jobs table
# Migration 083: Creates phrase_cache table
```

These migrations create:
- `grading_jobs` table - Simple job queue
- `phrase_cache` table - Cache for common phrases

### 2. Set Up Job Processing

You have two options:

#### Option A: API Route (Recommended for Vercel)

Create a Vercel Cron Job that calls `/api/grading/process` every minute:

**vercel.json:**
```json
{
  "crons": [{
    "path": "/api/grading/process",
    "schedule": "* * * * *"
  }]
}
```

#### Option B: Standalone Worker Script

Create a simple script that polls the queue:

```typescript
// scripts/process-grading-jobs.ts
import { processNextJob } from '../lib/queue/supabase-worker'

setInterval(async () => {
  try {
    await processNextJob()
  } catch (error) {
    console.error('Error processing job:', error)
  }
}, 5000) // Process every 5 seconds
```

### 3. Verify Setup

Check that jobs are being created:

```sql
SELECT * FROM grading_jobs WHERE status = 'pending' ORDER BY created_at;
```

## How It Works

1. **Main Grading**: When a session is graded via `/api/grade/stream`, jobs are inserted into `grading_jobs` table
2. **Job Processing**: Worker polls `grading_jobs` table for pending jobs
3. **Batch Processing**: Processes 5 lines at a time
4. **Caching**: Common phrases cached in `phrase_cache` table
5. **Partial Updates**: Frontend polls for updates and displays ratings as they arrive

## Advantages Over Redis

✅ **No additional service** - Uses existing Supabase database  
✅ **Simpler setup** - No Redis connection to manage  
✅ **Easier debugging** - Can query jobs directly in database  
✅ **Built-in persistence** - Jobs survive restarts  

## Disadvantages

⚠️ **Slower than Redis** - Database queries are slower than in-memory Redis  
⚠️ **Polling required** - Need to poll for jobs (vs Redis pub/sub)  
⚠️ **Database load** - Adds queries to your database  

For most use cases, Supabase queue is sufficient and much simpler!

## Monitoring

### Check Queue Status

```sql
-- Pending jobs
SELECT COUNT(*) FROM grading_jobs WHERE status = 'pending';

-- Processing jobs
SELECT COUNT(*) FROM grading_jobs WHERE status = 'processing';

-- Failed jobs
SELECT * FROM grading_jobs WHERE status = 'failed' ORDER BY failed_at DESC LIMIT 10;
```

### Check Cache Performance

```sql
SELECT COUNT(*) FROM phrase_cache;
```

## Cleanup

Old completed jobs are automatically cleaned up (older than 24 hours). You can also manually clean:

```sql
DELETE FROM grading_jobs 
WHERE status = 'completed' 
AND completed_at < NOW() - INTERVAL '24 hours';
```

## Troubleshooting

### Jobs Not Processing

1. Check if cron job is running: `SELECT * FROM grading_jobs WHERE status = 'pending'`
2. Verify `/api/grading/process` endpoint is accessible
3. Check logs for errors

### Jobs Stuck in Processing

```sql
-- Reset stuck jobs (processing for more than 10 minutes)
UPDATE grading_jobs 
SET status = 'pending', attempts = attempts + 1
WHERE status = 'processing' 
AND started_at < NOW() - INTERVAL '10 minutes';
```
