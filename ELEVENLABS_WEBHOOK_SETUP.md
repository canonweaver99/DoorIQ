# ElevenLabs Webhook Setup Guide

This guide explains how to configure ElevenLabs webhooks to enable speech analytics in DoorIQ.

## Webhook Endpoint

**Endpoint URL**: `https://yourdomain.com/api/elevenlabs/webhook`

Replace `yourdomain.com` with your actual production domain (e.g., `dooriq.ai`).

## Configuration Steps

### 1. Configure in ElevenLabs Dashboard

1. Log in to your ElevenLabs account
2. Navigate to **Settings** → **Webhooks** (or **Conversational AI** → **Webhooks`)
3. Click **Add Webhook** or **Create Webhook**
4. Enter the webhook URL: `https://yourdomain.com/api/elevenlabs/webhook`
5. Select the following events:
   - `conversation.completed` (required - contains full transcript and metadata)
   - `conversation.analyzed` (optional - contains additional analysis)
   - `call.initiation.failure` (optional - for debugging)
6. Set a webhook secret (optional but recommended for security)
7. Save the webhook configuration

### 2. Set Environment Variable

Add the webhook secret to your environment variables:

```bash
ELEVENLABS_WEBHOOK_SECRET=wsec_cf8425322a2a66795313c066e23dcb2c4366c21496dad0f57eeecd2d9302205a
```

**Important**: 
- Set this in your production environment variables (Vercel, etc.)
- Never commit secrets to version control
- The webhook endpoint will verify signatures using this secret
- If not set, webhooks will still work but without signature verification (less secure)

### 3. Run Database Migration

The webhook requires database tables to be created. Run the migration:

```bash
# If using Supabase CLI
supabase migration up

# Or apply migration 084_create_speech_analytics_tables.sql manually
```

## How It Works

1. **Conversation Completion**: When an ElevenLabs conversation ends, a webhook is sent to your endpoint
2. **Data Storage**: The webhook handler stores:
   - Raw conversation data in `elevenlabs_conversations` table
   - Transcript, metadata, and analysis data
3. **Session Correlation**: The system automatically matches conversations to DoorIQ sessions using:
   - Agent ID matching
   - Timestamp window matching (±5 minutes)
4. **Future Analysis**: Speech analytics will be computed in Phase 2 and stored in `speech_analytics` table

## Testing

### Test Webhook Locally (Development)

1. Use a tool like [ngrok](https://ngrok.com/) to expose your local server:
   ```bash
   ngrok http 3000
   ```

2. Use the ngrok URL in ElevenLabs webhook configuration:
   ```
   https://your-ngrok-url.ngrok.io/api/elevenlabs/webhook
   ```

3. Start a training session and complete a conversation
4. Check your logs to see if the webhook was received

### Verify Webhook is Working

1. Check application logs for webhook receipt messages
2. Query the database to see if conversations are being stored:
   ```sql
   SELECT * FROM elevenlabs_conversations ORDER BY created_at DESC LIMIT 10;
   ```

3. Check if sessions are being correlated:
   ```sql
   SELECT ls.id, ls.conversation_id, ec.conversation_id 
   FROM live_sessions ls
   LEFT JOIN elevenlabs_conversations ec ON ls.conversation_id = ec.conversation_id
   WHERE ls.conversation_id IS NOT NULL
   ORDER BY ls.created_at DESC LIMIT 10;
   ```

## Troubleshooting

### Webhook Not Receiving Data

1. **Check webhook URL**: Ensure it's correctly configured in ElevenLabs dashboard
2. **Check signature**: If using signature verification, ensure `ELEVENLABS_WEBHOOK_SECRET` matches
3. **Check logs**: Look for webhook receipt messages in application logs
4. **Check ElevenLabs dashboard**: Some providers show webhook delivery status

### Sessions Not Correlating

1. **Check agent_id**: Ensure `agent_id` in `live_sessions` matches ElevenLabs agent ID
2. **Check timestamps**: Sessions must start within ±5 minutes of conversation start
3. **Check logs**: Look for correlation messages in logs with confidence levels

### Signature Verification Failing

- If webhook secret is not set, webhooks will be accepted without verification (logged as warning)
- If signature doesn't match, webhook will be rejected with 401 error
- Check that `ELEVENLABS_WEBHOOK_SECRET` matches the secret set in ElevenLabs dashboard

## Security Notes

- **Signature Verification**: Always use webhook secret in production
- **HTTPS Only**: Webhook endpoint should only be accessible via HTTPS
- **Rate Limiting**: Consider adding rate limiting to prevent abuse
- **IP Whitelisting**: ElevenLabs may provide IP ranges for webhook sources (check their docs)

## Next Steps

After Phase 1 is complete:
- Phase 2: Speech analysis engine will compute metrics from stored conversations
- Phase 3: API endpoints will expose analytics data
- Phase 4: UI components will display speech analytics to users

