# Environment Setup for DoorIQ

## Required Environment Variables

Create a `.env.local` file in the root directory with the following:

```bash
# OpenAI API Key (REQUIRED for voice features)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## How to get your OpenAI API Key:

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (it starts with `sk-proj-`)
5. Paste it in your `.env.local` file

## Verifying Setup

After adding your API key:
1. Restart your development server (`npm run dev`)
2. Check the browser console for "Token generated successfully"
3. The voice features should now work

## Troubleshooting

If you see "OPENAI_API_KEY missing":
- Make sure `.env.local` file exists in the root directory
- Ensure the key is properly formatted (no quotes needed)
- Restart the development server after adding the key

If you see 401 Unauthorized:
- Your API key may be invalid or expired
- Check your OpenAI account for the correct key
- Ensure you have Realtime API access on your OpenAI account
