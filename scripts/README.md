# Test Scripts

## Grading Pipeline End-to-End Test

Tests the complete grading system with a synthetic transcript to verify:
- Session creation
- Transcript storage
- AI grading (OpenAI GPT-4o-mini)
- Line-by-line analysis
- Feedback generation
- Score calculation

### Prerequisites

1. **Dev server running:**
   ```bash
   npm run dev
   ```

2. **Environment variables set:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`

### Run the test

```bash
npm run test:grading
```

### What it does

1. Creates a test session in Supabase with a realistic door-to-door sales transcript
2. Calls `/api/grade/session` to grade the conversation
3. Displays:
   - Overall scores (rapport, objection handling, closing, etc.)
   - Line-by-line ratings (excellent/good/poor with explanations)
   - AI feedback (strengths, improvements, specific tips)
   - Link to view in the analytics UI

### Expected output

```
🧪 Testing Grading Pipeline End-to-End
============================================================

📝 Step 1: Creating test session with synthetic transcript...
✅ Created test session: abc123...
   Transcript entries: 15
   Duration: 180s

🤖 Step 2: Running grading API...
✅ Grading completed successfully

📊 Step 3: Fetching graded results...
✅ Results fetched

============================================================
📈 GRADING RESULTS
============================================================

🎯 Overall Scores:
   Overall Score:           85/100
   Rapport Score:           90/100
   Introduction Score:      85/100
   ...

📝 Line-by-Line Ratings:
   🟢 Line 0: EXCELLENT
      "Hi there! My name is John from Pest Shield Solutions..."
      💡 Advanced sale with empathy, assumptive close or quality discovery.
   ...

💪 Strengths:
   1. Strong opening with clear introduction
   2. Excellent discovery questions
   ...

🎯 Areas for Improvement:
   1. Could have addressed pricing objection more directly
   ...

🌐 View in App:
   http://localhost:3000/trainer/analytics/abc123...
```

### Troubleshooting

**"Failed to call grading API"**
- Make sure `npm run dev` is running
- Check that port 3000 is available

**"Missing Supabase environment variables"**
- Verify `.env.local` has the required variables
- Restart the script after adding them

**"OPENAI_API_KEY not configured"**
- Add `OPENAI_API_KEY` to `.env.local`
- Get your key from https://platform.openai.com/api-keys

### Using the results

1. Open the URL shown at the end in your browser
2. You should see:
   - Color-coded transcript with green/yellow/red highlights
   - Hover over lines to see AI advice
   - "What Worked" and "What Failed" sections
   - Detailed score breakdown

If all this works, the grading pipeline is healthy and the issue is with live transcript capture during actual sessions.

