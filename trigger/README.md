# Trigger.dev Tasks

This directory contains Trigger.dev tasks for background job processing in DoorIQ.

## Available Tasks

### `processGradingJob`

Processes line-by-line rating jobs for session transcripts.

**Location:** `trigger/session-grading.ts`

**Usage:**

```typescript
import { processGradingJob } from '@/trigger/session-grading'

// Trigger a grading job directly
await processGradingJob.trigger({
  sessionId: 'session-id',
  transcript: [...], // Array of transcript entries
  batchIndex: 0,
  batchSize: 5,
  salesRepName: 'John Doe',
  customerName: 'Austin',
  totalBatches: 10,
})
```

**Features:**
- Automatic retries (3 attempts with exponential backoff)
- Caching support for common phrases
- Error handling for individual line failures
- Updates session analytics in real-time
- Compatible with Supabase queue system

## API Integration

### Queue Grading Jobs

**Endpoint:** `POST /api/grading/queue`

**Request:**
```json
{
  "sessionId": "session-id",
  "useTriggerDev": true  // Optional, defaults to true
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "session-id",
  "totalBatches": 10,
  "jobsQueued": 10,
  "jobIds": ["trigger-id-1", "trigger-id-2", ...],
  "method": "trigger.dev"
}
```

### Process Jobs from Queue

**Endpoint:** `POST /api/grading/process`

**Request:**
```json
{
  "useTriggerDev": true  // Optional, defaults to false for backward compatibility
}
```

## Migration Notes

The system supports both Trigger.dev and the legacy Supabase queue:

- **Trigger.dev (default):** Better retry logic, monitoring, and scalability
- **Supabase Queue (fallback):** Set `useTriggerDev: false` for backward compatibility

## Monitoring

View task execution, retries, and errors in the Trigger.dev dashboard:
https://cloud.trigger.dev/projects/proj_ypxflgezauaiotkuegps

