# ElevenLabs Agent Setup for DoorIQ

## Tool Configuration

### Tool Name: `submit.transcript`

**Endpoint:** `POST https://api.dooriq.com/api/webhooks/grade`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{EVAL_API_KEY}}
```

**Body:**
```json
{
  "session_id": "{{conversation.id}}",
  "agent_id": "{{agent.id}}",
  "started_at": "{{conversation.started_at}}",
  "ended_at": "{{conversation.ended_at}}",
  "transcript": {{conversation.transcript_json}},
  "rubric_id": "amanda_v1",
  "evaluate_speaker": "rep"
}
```

## Agent System Prompt Addition

Add this to your agent's system prompt:

```
At end of conversation or on 'score now', call tool submit.transcript once with the full transcript and summarize the numeric grade and 3 coaching notes. Do not reveal rubric internals.
```

## Environment Variables

Set these in your Vercel project:

```env
# Required: Secret key for webhook authentication
EVAL_API_KEY=your-long-random-secret-here

# Optional: Enable LLM-enhanced grading
EVAL_USE_LLM=false

# Required if EVAL_USE_LLM=true
OPENAI_API_KEY=your-openai-key-here
```

## Domain Setup

1. Add subdomain `api.dooriq.com` to your Vercel project
2. Point it to the same deployment
3. Update webhook URL to use `api.dooriq.com` instead of the full domain

## Testing

Use this cURL command to test the webhook:

```bash
curl -s -X POST https://api.dooriq.com/api/webhooks/grade \
  -H "authorization: Bearer REPLACE_WITH_EVAL_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "session_id":"test-123",
    "agent_id":"amanda",
    "transcript":[
      {"speaker":"rep","text":"We use EPA-registered products that are safe for kids and pets. Re-entry is about 30 min."},
      {"speaker":"rep","text":"We text before arrival and offer a Wednesday morning window; the visit takes ~45 min."},
      {"speaker":"rep","text":"Monthly price is $49–$69 and includes ants and spiders with no hidden fees."},
      {"speaker":"customer","text":"That answers my questions."}
    ]
  }' | jq
```

Expected response should show grading with safety/time/price/value scores.
