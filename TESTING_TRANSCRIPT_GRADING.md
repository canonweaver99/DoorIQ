# Testing Transcript Grading

## Summary

The new transcript storage system has been successfully tested! The test session was created with the correct format and all validation checks passed.

## Test Results

✅ **Session Created**: `6fe21a79-1c28-4d85-a83d-467347f7d43f`
- 12 transcript entries
- 60 seconds duration
- All entries validated successfully
- Format compatible with grading endpoints

## Test Scripts

### 1. Create Test Session & Test Grading
```bash
node scripts/test-grading-endpoint.js
```

This script will:
1. Create a test session with a realistic sample transcript
2. Validate the transcript format
3. Test both grading endpoints (`/api/grade/session` and `/api/grade/stream`)

**Note**: Requires the dev server to be running (`npm run dev`)

### 2. Validate Transcript Format Only
```bash
node scripts/validate-transcript-format.js <sessionId>
```

This script validates the transcript format without requiring the server:
- Checks all required fields (speaker, text, timestamp)
- Validates data types
- Verifies compatibility with grading endpoints

**Example**:
```bash
node scripts/validate-transcript-format.js 6fe21a79-1c28-4d85-a83d-467347f7d43f
```

## Testing Grading Endpoints

### Prerequisites
1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Ensure environment variables are set:
   - `OPENAI_API_KEY` - Required for grading
   - `NEXT_PUBLIC_SUPABASE_URL` - Database connection
   - `SUPABASE_SERVICE_ROLE_KEY` - Database access

### Test Non-Streaming Endpoint
```bash
curl -X POST http://localhost:3000/api/grade/session \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "6fe21a79-1c28-4d85-a83d-467347f7d43f"}'
```

### Test Streaming Endpoint
```bash
curl -X POST http://localhost:3000/api/grade/stream \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "6fe21a79-1c28-4d85-a83d-467347f7d43f"}'
```

## Transcript Format

The new transcript format includes:
- `id`: Unique identifier (timestamp-random)
- `speaker`: Either `'user'` or `'homeowner'`
- `text`: The transcript text content
- `timestamp`: ISO timestamp string

Example:
```json
{
  "id": "1763589520256-tusjtx4",
  "speaker": "user",
  "text": "Hi there! I'm Sarah from DoorIQ...",
  "timestamp": "2025-11-19T21:58:40.256Z"
}
```

## Sample Transcript Created

The test script creates a realistic 12-line conversation covering:
- Introduction and rapport building
- Objection handling (price concerns)
- Value communication
- Safety concerns
- Closing attempt with appointment scheduling

This provides a good test case for the grading system to evaluate:
- Rapport building
- Objection handling
- Value communication
- Closing effectiveness

## Next Steps

1. **Start the dev server**: `npm run dev`
2. **Run the full test**: `node scripts/test-grading-endpoint.js`
3. **Check the results**: The script will show scores and feedback from the grading endpoints

## Troubleshooting

If grading fails:
1. Check that OpenAI API key is set correctly
2. Verify the session has a transcript (use validation script)
3. Check server logs for errors
4. Ensure the session is ended (`ended_at` is set)

