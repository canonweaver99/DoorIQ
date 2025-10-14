# DoorIQ Setup Instructions

## Quick Start Guide

### 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (Already configured)
OPENAI_API_KEY=your_openai_api_key

# ElevenLabs (Already configured)
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Resend (EMAIL NOTIFICATIONS) - NEW!
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=notifications@yourdomain.com

# Stripe (PAYMENTS & BILLING) - NEW!
STRIPE_SECRET_KEY=sk_test_your_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (create these in Stripe Dashboard) - NEW!
NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY=price_xxxxx
NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_YEARLY=price_xxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 2. Stripe Setup

### Step 1: Create Stripe Account
1. Go to https://stripe.com
2. Create account or sign in
3. Switch to **Test Mode** (toggle in top right)

### Step 2: Create Products
1. Go to **Products** in Stripe Dashboard
2. Click **+ Add product**

#### Create "Individual Monthly" Plan:
- Name: DoorIQ Individual Monthly
- Description: Monthly subscription to DoorIQ
- Pricing: $20/month
- Recurring billing
- Copy the **Price ID** (starts with `price_`)
- Paste into `NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY`

#### Create "Individual Yearly" Plan (Optional):
- Name: DoorIQ Individual Yearly  
- Description: Yearly subscription to DoorIQ
- Pricing: $192/year ($16/month billed annually)
- Recurring billing
- Copy the **Price ID**
- Paste into `NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_YEARLY`

### Step 3: Get API Keys
1. Go to **Developers** > **API Keys**
2. Copy **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Reveal and copy **Secret key** → `STRIPE_SECRET_KEY`

### Step 4: Set Up Webhook
1. Go to **Developers** > **Webhooks**
2. Click **+ Add endpoint**
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
   - For local testing: Use **Stripe CLI** or **ngrok**
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### Step 5: Test the Integration
```bash
# Install Stripe CLI for local testing
brew install stripe/stripe-brew/stripe  # Mac
# or download from https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local dev
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 3. Resend Setup (Email Notifications)

### Step 1: Create Resend Account
1. Go to https://resend.com
2. Sign up for free account

### Step 2: Add Domain
1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add DNS records to your domain provider:
   - SPF record
   - DKIM records
   - Return-Path record
5. Wait for verification (usually 5-15 minutes)

### Step 3: Get API Key
1. Go to **API Keys**
2. Click **Create API Key**
3. Name it "DoorIQ Production" or "DoorIQ Development"
4. Copy the key → `RESEND_API_KEY`

### Step 4: Set From Email
- Use format: `notifications@yourdomain.com`
- Or use: `noreply@yourdomain.com`
- Set in: `RESEND_FROM_EMAIL`

### Step 5: Test Email Sending
```bash
# Start your dev server
npm run dev

# In another terminal, test email endpoint
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your.email@example.com",
    "subject": "Test Email",
    "body": "<p>This is a test email from DoorIQ!</p>",
    "type": "notification"
  }'
```

---

## 4. Database Migration

Run the new migration to add subscription and referral fields:

```bash
# Option 1: Using Supabase CLI
supabase db push

# Option 2: Using psql directly
psql your_database_url < lib/supabase/migrations/046_add_subscription_fields.sql

# Option 3: In Supabase Dashboard
# Go to SQL Editor → New Query → Paste contents of migration file → Run
```

### Verify Migration:
```sql
-- Check if new columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN (
    'stripe_customer_id',
    'subscription_status', 
    'referral_code'
  );

-- Should return 3 rows
```

---

## 5. Testing Checklist

### ✅ Manager Panel
- [ ] Navigate to `/manager`
- [ ] Check team stats load
- [ ] Check revenue chart displays
- [ ] Check reps list loads
- [ ] Try clicking on a rep profile
- [ ] Test search and filters

### ✅ Stripe Integration
- [ ] Go to `/pricing`
- [ ] Click "Start Free Trial" on Individual plan
- [ ] Complete checkout with test card: `4242 4242 4242 4242`
- [ ] Verify redirected to `/billing?success=true`
- [ ] Check subscription shows as "Trialing"
- [ ] Go to `/billing`
- [ ] Click "Manage Subscription"
- [ ] Verify Stripe portal opens

### ✅ Email Notifications
- [ ] Create a team invite at `/team/invite`
- [ ] Check email was sent (check spam folder)
- [ ] Verify email has correct branding
- [ ] Click invite link in email
- [ ] Verify it loads invite acceptance page

### ✅ MP3 Upload
- [ ] Navigate to `/trainer/upload`
- [ ] Upload a test MP3 file
- [ ] Wait for transcription and grading
- [ ] Verify redirected to analytics page
- [ ] Check scores and feedback display

### ✅ Referral Program
- [ ] Go to `/referrals`
- [ ] Copy referral link
- [ ] Open link in incognito window
- [ ] Sign up using referral link
- [ ] Go back to `/referrals`
- [ ] Verify new referral shows in list

### ✅ AI Agents
- [ ] Go to `/trainer`
- [ ] Try starting conversation with each agent:
  - Austin
  - No Problem Nancy
  - Already Got It Alan
  - Not Interested Nick
  - DIY Dave
  - Too Expensive Tim
  - Spouse Check Susan
  - Busy Beth
  - Renter Randy
  - Skeptical Sam
  - Just Treated Jerry
  - Think About It Tina
- [ ] Verify each agent responds appropriately
- [ ] Check session records correctly

---

## 6. Common Issues & Solutions

### Issue: Stripe webhook not receiving events
**Solution:** 
- Use Stripe CLI for local development: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- For production, ensure webhook URL is publicly accessible
- Check webhook signing secret is correct

### Issue: Emails not sending
**Solutions:**
- Verify domain is verified in Resend dashboard
- Check DNS records are correctly configured
- Verify API key is correct
- Check email isn't in spam folder
- Look at Resend logs for errors

### Issue: Referral codes not generating
**Solution:**
- Run migration 046 which adds trigger
- Manually generate for existing users:
```sql
UPDATE users SET referral_code = generate_referral_code() WHERE referral_code IS NULL;
```

### Issue: MP3 upload fails
**Solutions:**
- Check file size < 100MB
- Verify file type is supported (MP3, WAV, WEBM, MP4, MOV)
- Check OpenAI API key is valid for Whisper API
- Check Supabase storage bucket 'audio-recordings' exists with correct RLS

### Issue: Agents not responding
**Solutions:**
- Verify ELEVENLABS_API_KEY is set
- Check agent IDs in `components/trainer/personas.ts` are correct
- Test agents in ElevenLabs dashboard first
- Check browser console for errors

---

## 7. Production Deployment

### Before Going Live:

1. **Switch Stripe to Live Mode**
   - Get live API keys
   - Create products in live mode
   - Update webhook endpoint
   - Update environment variables

2. **Verify Resend Domain**
   - Ensure domain is fully verified
   - Test email deliverability
   - Set up DMARC policy

3. **Update Environment Variables**
   - Set `NEXT_PUBLIC_APP_URL` to production URL
   - Update all API keys to production keys
   - Remove test mode keys

4. **Database**
   - Run migration on production database
   - Verify all tables and indexes exist
   - Test RLS policies

5. **Security**
   - Enable HTTPS
   - Set up proper CORS headers
   - Configure rate limiting
   - Review RLS policies

---

## 8. Maintenance

### Monthly Tasks:
- [ ] Review Stripe webhooks for failures
- [ ] Check email delivery rates in Resend
- [ ] Monitor API usage and costs
- [ ] Review user feedback on AI agents
- [ ] Check for any failed transactions

### Quarterly Tasks:
- [ ] Update dependencies
- [ ] Review and optimize database
- [ ] Test all user flows
- [ ] Update AI agent prompts if needed

---

## Need Help?

1. Check `IMPLEMENTATION_SUMMARY.md` for feature details
2. Review `AGENT_TESTING_GUIDE.md` for agent testing
3. Check Stripe/Resend documentation
4. Review application logs
5. Contact support if issues persist

---

**Last Updated:** October 14, 2025  
**Version:** 1.0.0  
**Status:** Ready for Testing

