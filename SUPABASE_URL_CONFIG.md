# Supabase URL Configuration for Custom Domain

## Issue
After logging in at `dooriq.ai`, users are redirected back to the Vercel URL instead of staying on the custom domain.

## ✅ Code Fixes Applied

Updated auth redirect fallback URLs from `door-iq.vercel.app` to `dooriq.ai` in:
- `app/auth/login/page.tsx` - Google OAuth redirect
- `app/auth/signup/page.tsx` - Google OAuth redirect

## 🔧 Supabase Dashboard Configuration

### Step 1: Update Site URL

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your DoorIQ project
3. Click **Authentication** → **URL Configuration**
4. Set **Site URL** to:
   ```
   https://dooriq.ai
   ```

### Step 2: Add Redirect URLs

Under **Redirect URLs**, add all of these:

```
https://dooriq.ai/**
https://dooriq.ai/auth/callback
https://dooriq.ai/auth/confirmed
https://dooriq.ai/dashboard
http://localhost:3000/**
http://localhost:3000/auth/callback
```

**Important:** The `/**` wildcard allows all paths under that domain.

### Step 3: Additional Redirect URLs (Optional)

If you want to allow redirects from Vercel preview deployments:

```
https://*.vercel.app/**
https://door-iq-*.vercel.app/**
```

### Step 4: Save Changes

Click **Save** at the bottom of the page.

## 🧪 Test the Flow

### Step 1: Clear Browser Cache
- Clear cookies for `dooriq.ai`
- Or use incognito/private window

### Step 2: Test Login
1. Go to `https://dooriq.ai/auth/login`
2. Click "Sign in with Google"
3. Complete Google auth
4. Should redirect back to `https://dooriq.ai/dashboard` ✅

### Step 3: Test Signup
1. Go to `https://dooriq.ai/auth/signup`
2. Click "Sign up with Google"
3. Complete Google auth
4. Should redirect to `https://dooriq.ai/` ✅

## 🔍 How It Works

### OAuth Flow:
```
1. User clicks "Sign in with Google"
2. Code constructs redirect URL:
   - window.location.origin (if in browser)
   - OR process.env.NEXT_PUBLIC_SITE_URL
   - OR fallback: 'https://dooriq.ai'
3. Supabase redirects to Google
4. Google redirects back to: https://dooriq.ai/auth/callback
5. Callback exchanges code for session
6. Redirects to /dashboard or home
```

### Why It Was Failing:
- Old fallback: `https://door-iq.vercel.app`
- Supabase didn't have `dooriq.ai` in allowed URLs
- Even when on dooriq.ai, OAuth redirected to vercel.app

### After Fixes:
- Fallback: `https://dooriq.ai` ✅
- Supabase allows `dooriq.ai/**` ✅
- OAuth stays on custom domain ✅

## ⚠️ Common Issues

### Still redirecting to Vercel?

1. **Check Supabase Site URL:**
   - Must be `https://dooriq.ai`
   - NOT the Vercel URL

2. **Check Redirect URLs:**
   - Must include `https://dooriq.ai/**`
   - Save changes after adding

3. **Clear browser cache:**
   - Old OAuth tokens might be cached
   - Try incognito mode

4. **Restart your app:**
   - After environment variable changes
   - `npm run dev` (local)
   - Redeploy (production)

### Getting "redirect_uri_mismatch" error?

This means Supabase doesn't recognize the redirect URL:
1. Double-check Supabase redirect URLs list
2. Make sure you saved changes
3. Try again in incognito mode

## 📝 Environment Variables Checklist

### In .env.local:
```env
NEXT_PUBLIC_SITE_URL=https://dooriq.ai  ✅ Just added
NEXT_PUBLIC_SUPABASE_URL=https://fzhtqmbaxznikmxdglyl.supabase.co  ✅
NEXT_PUBLIC_SUPABASE_ANON_KEY=...  ✅
```

### In Vercel:
```env
NEXT_PUBLIC_SITE_URL=https://dooriq.ai  ⚠️ Add this!
NEXT_PUBLIC_SUPABASE_URL=...  ✅
NEXT_PUBLIC_SUPABASE_ANON_KEY=...  ✅
```

### In Supabase:
```
Site URL: https://dooriq.ai  ⚠️ Update this!
Redirect URLs: https://dooriq.ai/**  ⚠️ Add this!
```

## 🚀 After Setup

Once configured correctly:
- ✅ Login at dooriq.ai → stays at dooriq.ai
- ✅ Signup at dooriq.ai → stays at dooriq.ai
- ✅ All redirects use custom domain
- ✅ Vercel URL auto-redirects to dooriq.ai

---

**Action Items:**
1. Update Supabase Site URL to `https://dooriq.ai`
2. Add redirect URLs in Supabase
3. Test login in incognito window
4. Enjoy your custom domain! 🎯

