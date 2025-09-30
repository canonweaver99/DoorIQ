# Production Environment Variables Setup

## 🚨 CRITICAL: Sessions Not Grading Issue

If your sessions show "Not graded" (like the 28 sessions in your screenshot), it's likely because **OPENAI_API_KEY is not set in production**.

## 📋 Required Environment Variables

Add these to your **Vercel Project Settings** → **Environment Variables**:

### Supabase (Database)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://fzhtqmbaxznikmxdglyl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6aHRxbWJheHpuaWtteGRnbHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTk3NTksImV4cCI6MjA3NDEzNTc1OX0.8SeovFJWrpLo9qBgHFmyzK92OSp2HN8I_aZRPoF0JwY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6aHRxbWJheHpuaWtteGRnbHlsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU1OTc1OSwiZXhwIjoyMDc0MTM1NzU5fQ.4puCepuAk9usP8jgVr6Cy2fNLjWILNKoQ3WoWArJSAA
```

### OpenAI (Session Grading & Analytics) 🔴 CRITICAL
```bash
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_KEY_HERE
```
**Why critical**: Without this, sessions won't get AI grading/feedback

### ElevenLabs (Voice AI)
```bash
ELEVENLABS_API_KEY=sk_YOUR_ELEVENLABS_KEY_HERE
```

### Application Settings
```bash
NODE_ENV=production
MODEL_NAME=gpt-4o-mini
NEXT_PUBLIC_APP_URL=https://dooriq.ai
```

### Optional (Auth)
```bash
NEXTAUTH_SECRET=your_random_secret_string
NEXTAUTH_URL=https://dooriq.ai
```

## 🔧 How to Add to Vercel

1. Go to: https://vercel.com/canonweaver99s-projects/dooriq
2. Click **Settings** → **Environment Variables**
3. Add each variable above (Name + Value)
4. Select: **Production**, **Preview**, and **Development**
5. Click **Save**
6. **Redeploy** your app for changes to take effect

## 🧪 How to Verify It's Working

### Check if OpenAI key is set:
After deployment, visit your site and complete a training session. Then check the session analytics page. You should see:
- ✅ Scores displayed (not "--% Not graded")
- ✅ AI feedback and coaching tips
- ✅ Line-by-line ratings

### If still showing "Not graded":
1. Check Vercel deployment logs for errors
2. Look for "OPENAI_API_KEY not configured" errors
3. Verify the key is actually saved in Vercel settings
4. Ensure you redeployed after adding the variable

## 📊 What Each Variable Does

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Database connection | ✅ YES |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public database access | ✅ YES |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB operations | ✅ YES |
| `OPENAI_API_KEY` | AI grading & analytics | ✅ YES (for grading) |
| `ELEVENLABS_API_KEY` | Voice agent conversations | ✅ YES (for voice) |
| `MODEL_NAME` | Which OpenAI model to use | ⚠️ Recommended |
| `NEXT_PUBLIC_APP_URL` | Base app URL | ⚠️ Recommended |

## 🚨 Common Issues

### Issue: "Not graded" on all sessions
**Cause**: OPENAI_API_KEY not set in production
**Fix**: Add OPENAI_API_KEY to Vercel environment variables and redeploy

### Issue: "Cannot connect to database"
**Cause**: Supabase credentials not set
**Fix**: Add all SUPABASE_* variables to Vercel and redeploy

### Issue: Voice agent not working
**Cause**: ELEVENLABS_API_KEY not set
**Fix**: Add ELEVENLABS_API_KEY to Vercel and redeploy

## 🔄 After Adding Variables

**IMPORTANT**: You MUST redeploy your app after adding environment variables!

Options to redeploy:
1. Go to Vercel dashboard → **Deployments** → Click **...** → **Redeploy**
2. Or push a dummy commit to trigger auto-deploy:
   ```bash
   git commit --allow-empty -m "chore: trigger redeployment"
   git push origin main
   ```

## ✅ Checklist

- [ ] All environment variables added to Vercel
- [ ] Redeployed application
- [ ] Tested new training session
- [ ] Verified session gets graded
- [ ] Checked analytics page shows scores
- [ ] Confirmed virtual earnings work
