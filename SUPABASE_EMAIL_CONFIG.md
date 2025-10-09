# Supabase Email Confirmation Configuration

## Issue
Users click email confirmation link but end up logged out on home page.

## Root Cause
Supabase email confirmation redirect URL needs to be configured properly.

## Fix Steps

### 1. Configure Redirect URLs in Supabase

Go to your Supabase Dashboard:

1. **Navigate to:** Authentication → URL Configuration
2. **Add these URLs:**

**For Local Development:**
```
http://localhost:3000/auth/callback
```

**For Production (Vercel):**
```
https://door-iq.vercel.app/auth/callback
https://your-custom-domain.com/auth/callback
```

3. **Site URL:** Set to your production domain
   - Local: `http://localhost:3000`
   - Production: `https://door-iq.vercel.app`

4. **Click Save**

### 2. Configure Email Templates (Optional)

If you want to customize the confirmation email:

1. **Navigate to:** Authentication → Email Templates
2. **Select:** Confirm signup
3. **Update the confirmation link to:**
```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a>
```

### 3. Alternative: Disable Email Confirmation (Development Only)

For faster development testing:

1. **Navigate to:** Authentication → Providers → Email
2. **Uncheck:** "Confirm email"
3. **Click Save**

Now users will be automatically logged in after signup without email confirmation.

### 4. Verify Configuration

After configuring:

1. Create a new test account
2. Check the confirmation email
3. Click the confirmation link
4. You should be redirected to home page **while logged in**
5. Your name should appear in the header

## Debugging

If still not working, check Vercel deployment logs:

```bash
vercel logs
```

Look for these console messages:
- `🔗 Auth callback triggered:`
- `✅ User authenticated:`
- `✅ User profile created successfully`

## Environment Variables

Make sure these are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (should be your Vercel URL)

---

**Last Updated:** After implementing improved auth callback with logging

