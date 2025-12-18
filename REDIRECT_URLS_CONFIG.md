# Redirect URLs Configuration Guide

## Supabase Dashboard Configuration

### Site URL
**Set to:** `https://dooriq.ai`

### Redirect URLs (Authentication > URL Configuration)

Add these URLs to the **Redirect URLs** list:

#### Production URLs
```
https://dooriq.ai/auth/callback
https://dooriq.ai/auth/callback/**
https://dooriq.ai/auth/reset-password
https://dooriq.ai/auth/confirmed
```

#### Vercel Preview URLs (if using preview deployments)
```
https://door-iq-*.vercel.app/auth/callback
https://door-iq-*.vercel.app/auth/callback/**
https://door-iq-canon-weavers-projects.vercel.app/auth/callback
https://door-iq-canon-weavers-projects.vercel.app/**
```

#### Supabase Callback (Required - Supabase uses this internally)
```
https://fzhtqmbaxznikmxdglyl.supabase.co/auth/v1/callback
```

#### Wildcard Pattern (Covers all subdomains and paths)
```
https://dooriq.ai/**
```

---

## Google Cloud Console Configuration

### OAuth 2.0 Client ID Settings

#### Authorized JavaScript origins
```
https://dooriq.ai
https://www.dooriq.ai
```

#### Authorized redirect URIs

**CRITICAL:** The main redirect URI that Google needs is Supabase's callback URL, not your app's callback URL directly.

```
https://fzhtqmbaxznikmxdglyl.supabase.co/auth/v1/callback
```

**Optional:** If you want to support direct redirects (not recommended), also add:
```
https://dooriq.ai/auth/callback
https://door-iq-canon-weavers-projects.vercel.app/auth/callback
```

---

## How OAuth Flow Works

1. **User clicks "Sign in with Google"** on `dooriq.ai`
2. **Your app** calls `supabase.auth.signInWithOAuth()` with `redirectTo: https://dooriq.ai/auth/callback`
3. **Supabase** redirects to Google OAuth with redirect URI: `https://fzhtqmbaxznikmxdglyl.supabase.co/auth/v1/callback`
4. **Google** authenticates user and redirects back to Supabase's callback URL
5. **Supabase** processes the OAuth response and redirects to your app: `https://dooriq.ai/auth/callback?code=...`
6. **Your callback route** (`app/auth/callback/route.ts`) exchanges the code for a session
7. **User is redirected** to `/home` (or the `next` parameter)

---

## Quick Checklist

### Supabase Dashboard
- [ ] Site URL = `https://dooriq.ai`
- [ ] Redirect URL: `https://dooriq.ai/auth/callback`
- [ ] Redirect URL: `https://dooriq.ai/auth/callback/**` (wildcard)
- [ ] Redirect URL: `https://fzhtqmbaxznikmxdglyl.supabase.co/auth/v1/callback`
- [ ] Redirect URL: `https://dooriq.ai/**` (wildcard for all paths)

### Google Cloud Console
- [ ] Authorized JavaScript origin: `https://dooriq.ai`
- [ ] Authorized redirect URI: `https://fzhtqmbaxznikmxdglyl.supabase.co/auth/v1/callback`

---

## Notes

- **Supabase's callback URL** (`*.supabase.co/auth/v1/callback`) is the one that Google OAuth actually redirects to
- **Your app's callback URL** (`dooriq.ai/auth/callback`) is where Supabase redirects AFTER processing OAuth
- The wildcard patterns (`**`) allow query parameters like `?next=/sessions` or `?checkout=true`
- Vercel preview URLs are optional but useful for testing preview deployments
