# Production Environment Variables Setup

## ✅ Local Development (.env.local)

Your local `.env.local` is now configured with:

```env
# Production Site URL
NEXT_PUBLIC_SITE_URL=https://dooriq.ai

# Resend Email API
RESEND_API_KEY=re_BD79cbR3_L4CUMSKP6bH6onKb1Ccnbpt5
RESEND_FROM_EMAIL=notifications@dooriq.ai

# ElevenLabs, Supabase, OpenAI (already configured)
...
```

## 🚀 Production Deployment (Vercel)

To make invite links work with `https://dooriq.ai` in production, add this environment variable to Vercel:

### Step 1: Go to Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Select your DoorIQ project
3. Click **Settings** tab
4. Click **Environment Variables**

### Step 2: Add Variables

Add these environment variables:

#### **NEXT_PUBLIC_SITE_URL**
```
Key: NEXT_PUBLIC_SITE_URL
Value: https://dooriq.ai
Environment: Production, Preview, Development
```

#### **RESEND_API_KEY**
```
Key: RESEND_API_KEY
Value: re_BD79cbR3_L4CUMSKP6bH6onKb1Ccnbpt5
Environment: Production, Preview, Development
```

#### **RESEND_FROM_EMAIL**
```
Key: RESEND_FROM_EMAIL
Value: notifications@dooriq.ai
Environment: Production, Preview, Development
```

### Step 3: Redeploy

After adding variables:
1. Click **Deployments** tab
2. Find latest deployment
3. Click **⋯** menu → **Redeploy**

OR just push to main - auto-deploys with new env vars!

## 🔗 What This Fixes

### Before:
- Invite links: `http://localhost:3000/invite/abc123`
- Only works locally ❌

### After:
- Invite links: `https://dooriq.ai/invite/abc123`
- Works anywhere ✅
- Can be shared via email, Slack, etc.

## 📧 Email Invite Flow

When you click "Send via Email" or the invite is auto-sent:

```
1. Invite created → token generated
2. URL: https://dooriq.ai/invite/{token}?ref={referral_code}
3. Email sent from team@dooriq.ai
4. Recipient clicks link
5. Redirected to dooriq.ai (production)
6. Signs up or logs in
7. Automatically added to team
```

## 🧪 Testing

### Test Locally:
1. Restart your dev server (picks up new env var)
2. Go to `/team/invite`
3. Create invite link
4. Should show: `https://dooriq.ai/invite/...` (not localhost!)

### Test in Production:
1. Push to GitHub (triggers Vercel deploy)
2. Go to `https://dooriq.ai/team/invite`
3. Create invite
4. Link should be: `https://dooriq.ai/invite/...`
5. Copy and open in incognito - should work!

## 🎯 Environment Variables Checklist

### Already Set (in .env.local):
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ OPENAI_API_KEY
- ✅ ELEVENLABS_API_KEY
- ✅ ELEVEN_LABS_API_KEY
- ✅ RESEND_API_KEY
- ✅ RESEND_FROM_EMAIL
- ✅ NEXT_PUBLIC_SITE_URL ← Just added!

### Need to Add to Vercel Production:
- ⚠️ NEXT_PUBLIC_SITE_URL=https://dooriq.ai
- ⚠️ RESEND_API_KEY
- ⚠️ RESEND_FROM_EMAIL

### Optional (for Stripe):
- STRIPE_SECRET_KEY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET
- NEXT_PUBLIC_STRIPE_PRICE_*

## 💡 Pro Tips

### Use Different URLs for Different Environments:

**Development:**
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Preview (Vercel):**
```env
NEXT_PUBLIC_SITE_URL=https://dooriq-git-[branch]-yourname.vercel.app
```

**Production:**
```env
NEXT_PUBLIC_SITE_URL=https://dooriq.ai
```

Vercel lets you set different values per environment!

### Check Current Value:

In your app:
```typescript
console.log('Site URL:', process.env.NEXT_PUBLIC_SITE_URL)
```

In browser console:
```javascript
console.log(process.env.NEXT_PUBLIC_SITE_URL)
```

## 🔧 Troubleshooting

### Invite links still showing localhost?

1. **Restart dev server:**
   ```bash
   # Kill existing server, then:
   npm run dev
   ```

2. **Hard refresh browser:**
   - Mac: `Cmd + Shift + R`
   - Windows: `Ctrl + Shift + R`

3. **Check environment variable:**
   ```bash
   grep NEXT_PUBLIC_SITE_URL .env.local
   ```

### In production still using wrong URL?

1. Check Vercel environment variables
2. Redeploy after adding variables
3. Check deployment logs for env var loading

## 📝 Next Steps

1. ✅ Added NEXT_PUBLIC_SITE_URL to .env.local
2. 🔜 Restart dev server to test
3. 🔜 Add to Vercel production environment
4. 🔜 Test invite link generation
5. 🔜 Send test invite to verify email delivery

---

**After restart:** Invite links will use `https://dooriq.ai` instead of localhost! 🎯

