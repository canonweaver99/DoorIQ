# Vercel Environment Variables - Complete List

## 🔐 Required Environment Variables for Production

Add these to your Vercel project: **Settings → Environment Variables**

### 📍 How to Add in Vercel

1. Go to: `https://vercel.com/[your-team]/[your-project]/settings/environment-variables`
2. Click **"Add New"** for each variable
3. Set **Environment** to:
   - **Production** (for production deployments)
   - **Preview** (for preview deployments - optional)
   - **Development** (for local development - optional)
4. Click **Save**
5. **Redeploy** your application for changes to take effect

---

## ✅ Required Variables

### 1. Supabase (Database & Auth)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find:**
- Supabase Dashboard → Project Settings → API
- `NEXT_PUBLIC_SUPABASE_URL`: Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `anon` `public` key
- `SUPABASE_SERVICE_ROLE_KEY`: `service_role` `secret` key (⚠️ Keep secret!)

---

### 2. Stripe (Payments - LIVE MODE)

```bash
STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET
```

**Where to find:**
- Stripe Dashboard → **Switch to Live Mode** (toggle top right)
- Developers → API keys
  - `STRIPE_SECRET_KEY`: Secret key (starts with `sk_live_`)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Publishable key (starts with `pk_live_`)
- Developers → Webhooks → Your endpoint → Signing secret
  - `STRIPE_WEBHOOK_SECRET`: Webhook signing secret (starts with `whsec_`)

**⚠️ IMPORTANT:**
- Use **LIVE MODE** keys (not test keys)
- Webhook endpoint must be: `https://dooriq.ai/api/stripe/webhook`
- All prices must belong to product: `prod_TmlX1S82Ed4Gpe`

---

### 3. OpenAI (AI Grading)

```bash
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY
```

**Where to find:**
- OpenAI Platform → API Keys → Create new secret key
- Used for: Session grading and analysis

---

### 4. ElevenLabs (Voice AI)

```bash
ELEVEN_LABS_API_KEY=YOUR_ELEVENLABS_API_KEY
```

**Where to find:**
- ElevenLabs Dashboard → Profile → API Keys
- Used for: Conversational AI agents and voice synthesis

---

### 5. Email (Resend)

```bash
RESEND_API_KEY=re_YOUR_RESEND_API_KEY
RESEND_FROM_EMAIL=DoorIQ <noreply@dooriq.ai>
```

**Where to find:**
- Resend Dashboard → API Keys → Create API Key
- `RESEND_FROM_EMAIL`: Must be a verified domain in Resend
- Used for: Password reset, verification, notifications

---

### 6. Application URLs

```bash
NEXT_PUBLIC_SITE_URL=https://dooriq.ai
NEXT_PUBLIC_APP_URL=https://dooriq.ai
```

**Set to:**
- Your production domain (e.g., `https://dooriq.ai`)
- Used for: Redirects, email links, OAuth callbacks

---

## 🔒 Optional Variables

### 7. reCAPTCHA (Optional - for spam protection)

```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LcYOUR_SITE_KEY
RECAPTCHA_SECRET_KEY=6LcYOUR_SECRET_KEY
```

**Where to find:**
- Google reCAPTCHA Admin Console
- Only needed if using reCAPTCHA on forms

---

### 8. Cal.com (Optional - for demo scheduling)

```bash
NEXT_PUBLIC_CALCOM_EMBED_URL=https://cal.com/your-username
```

**Where to find:**
- Cal.com → Settings → Embed
- Only needed if using Cal.com integration

---

## 📋 Quick Copy-Paste Checklist

Copy this list and fill in your values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe (LIVE MODE)
STRIPE_SECRET_KEY=sk_live_
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_
STRIPE_WEBHOOK_SECRET=whsec_

# AI Services
OPENAI_API_KEY=
ELEVEN_LABS_API_KEY=

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=DoorIQ <noreply@dooriq.ai>

# URLs
NEXT_PUBLIC_SITE_URL=https://dooriq.ai
NEXT_PUBLIC_APP_URL=https://dooriq.ai

# Optional
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
NEXT_PUBLIC_CALCOM_EMBED_URL=
```

---

## ✅ Verification Steps

After adding all variables:

1. **Redeploy** your application
2. **Check deployment logs** for any missing variable errors
3. **Test critical flows:**
   - User signup/login
   - Stripe checkout
   - Email sending
   - AI session creation

---

## 🔍 Troubleshooting

### Variable Not Found Error

If you see errors like `process.env.XXX is undefined`:

1. Check variable name matches exactly (case-sensitive)
2. Ensure variable is set for **Production** environment
3. **Redeploy** after adding variables
4. Check Vercel deployment logs

### Stripe Webhook Not Working

1. Verify `STRIPE_WEBHOOK_SECRET` matches webhook endpoint secret
2. Check webhook endpoint URL in Stripe Dashboard
3. Verify webhook events are enabled:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### Email Not Sending

1. Verify `RESEND_API_KEY` is correct
2. Check `RESEND_FROM_EMAIL` domain is verified in Resend
3. Check Resend dashboard for delivery logs

---

## 📝 Notes

- **Never commit** these values to git
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Variables without `NEXT_PUBLIC_` are server-side only (more secure)
- Use different values for Production vs Preview environments if needed
- Rotate keys periodically for security

---

## 🚀 After Setup

Once all variables are set:

1. ✅ Redeploy application
2. ✅ Test checkout flow
3. ✅ Verify webhook events are received
4. ✅ Test email delivery
5. ✅ Monitor error logs

See `SWITCH_TO_PRODUCTION.md` for detailed Stripe setup instructions.

