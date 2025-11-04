# Production Launch Checklist

This checklist ensures all systems are ready for production launch.

## ✅ Completed Tasks

### 1. Stripe Live Mode Configuration
- [x] Payment link updated to live: `https://buy.stripe.com/28E7sDeNc1QSdD7g8T2go00`
- [x] Product ID verified: `prod_TMF8fyztCmkcyN`
- [x] **Stripe Live Keys Provided:**
  - ✅ `STRIPE_SECRET_KEY` → `sk_live_YOUR_STRIPE_SECRET_KEY`
  - ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_YOUR_STRIPE_PUBLISHABLE_KEY`
- [ ] **TODO: Add these keys to production environment variables (Vercel/hosting platform)**
- [x] **Webhook Secret Provided:**
  - ✅ `STRIPE_WEBHOOK_SECRET` → `whsec_4P7O2Ppsvt1HFkzQOnaT55GPdtKSOQk3`
- [ ] **TODO: Add webhook secret to production environment variables (Vercel/hosting platform)**
- [x] **Product IDs Identified:**
  - ✅ Monthly Product: `prod_TMF8fyztCmkcyN`
  - ✅ Yearly Product: `prod_TMGRM9BYQlb8nI`
- [x] **Price IDs Provided:**
  - ✅ Monthly Price: `price_1SPWeS1fQ6MPQdN07Vcg9JYI`
  - ✅ Yearly Price: `price_1SPXuN1fQ6MPQdN039yUK8du`
- [ ] **TODO: Add Price IDs to production environment variables (Vercel/hosting platform)**
- [ ] **TODO: Configure live webhook endpoint in Stripe Dashboard:**
  - Go to: Stripe Dashboard → Developers → Webhooks
  - Add endpoint: `https://yourdomain.com/api/stripe/webhook`
  - Select events:
    - `checkout.session.completed`
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `customer.subscription.trial_will_end`
    - `invoice.payment_succeeded`
    - `invoice.payment_failed`
  - Copy webhook secret to environment variables
- [ ] **TODO: Configure Stripe Billing Portal for live mode:**
  - Go to: Stripe Dashboard (Live Mode) → Settings → Billing → Customer portal
  - Activate link
  - Configure business information
  - Enable customer options (update payment, cancel, etc.)

### 2. Features & Credits on Purchase
- [x] Webhook handler verified: `/api/stripe/webhook/route.ts`
- [x] Credit granting function verified: `grant_subscription_credits` grants 50 monthly credits
- [x] Webhook events handled:
  - `checkout.session.completed` → Grants credits
  - `customer.subscription.created` → Grants credits
  - `customer.subscription.updated` → Updates credits if active
  - `invoice.payment_succeeded` → Updates subscription status
- [ ] **TODO: Test complete purchase flow:**
  1. Complete a test purchase with live Stripe
  2. Verify 50 credits are granted
  3. Verify subscription status updates
  4. Verify premium features unlock
  5. Check webhook logs in Stripe Dashboard

### 3. Supabase Security Audit
- [x] Security audit completed: See `PRODUCTION_SECURITY_AUDIT.md`
- [x] Service role keys: Only used server-side ✅
- [x] RLS policies: All tables have proper policies ✅
- [x] API authentication: All routes protected ✅
- [x] Storage policies: Properly configured ✅
- [ ] **TODO: Verify in production:**
  - RLS policies are active
  - Storage bucket policies are correct
  - No service role keys exposed

### 4. Dashboard Features Verification
- [x] Dashboard structure verified: `/app/dashboard/page.tsx`
- [x] Tabs exist: Overview, Performance, Learning, Upload, Team
- [ ] **TODO: Manual testing required:**
  - [ ] Overview tab: Stats, recent sessions, insights load correctly
  - [ ] Performance tab: Analytics and charts display correctly
  - [ ] Learning tab: Playbooks and content load
  - [ ] Upload tab: File upload flow works (tested separately)
  - [ ] Team tab: Team stats display correctly (if applicable)
  - [ ] Subscription-gated features respect access levels

### 5. MP3 Upload Grading System
- [x] Upload endpoint verified: `/api/upload/audio/route.ts`
- [x] Transcription endpoint verified: `/api/transcribe/route.ts`
- [x] Grading endpoint verified: `/api/grade/session/route.ts`
- [x] **VERIFIED: Uploaded sessions use same grading endpoint as live sessions**
  - Both call `/api/grade/session` with `sessionId`
  - Same grading schema and scoring logic
  - Uploaded sessions stored in `live_sessions` with `upload_type: 'file_upload'`
- [ ] **TODO: Test full upload flow:**
  1. Upload an MP3 file
  2. Verify transcription completes
  3. Verify grading completes
  4. Verify scores match live session format
  5. Verify session appears in dashboard

### 6. Settings & Subscription Management
- [x] Settings page exists: `/app/settings/page.tsx`
- [x] Billing page exists: `/app/billing/page.tsx`
- [x] Billing portal endpoint: `/api/stripe/create-portal-session/route.ts`
- [ ] **TODO: Test functionality:**
  - [ ] Settings page: User preferences save/load
  - [ ] Billing page: Subscription status displays correctly
  - [ ] "Manage Subscription" button opens Stripe portal
  - [ ] Subscription cancellation flow works
  - [ ] Payment method update works

### 7. Invite Links System
- [x] Create invite endpoint: `/api/invites/create/route.ts`
- [x] Accept invite endpoint: `/api/invites/accept/route.ts`
- [x] Validate invite endpoint: `/api/invites/validate/route.ts`
- [x] Invite page exists: `/app/invite/[token]/page.tsx`
- [x] OAuth callback handles invites: `/app/auth/callback/route.ts`
- [ ] **TODO: Test complete invite flow:**
  1. Manager creates invite
  2. Verify email is sent
  3. Click invite link
  4. Verify invite validates correctly
  5. Sign up/login with invite token
  6. Verify team assignment works
  7. Verify referral code propagates

### 8. Cal.com Integration
- [x] Cal.com script loading verified: `components/forms/ContactSalesForm.tsx`
- [x] Cal.com embed configured: `calLink: "canon-weaver-aa0twn/dooriq"`
- [x] Embed appears on step 4 (Schedule Demo)
- [ ] **TODO: Test Cal.com integration:**
  - [ ] Complete contact sales form
  - [ ] Verify Cal.com embed loads on step 4
  - [ ] Test calendar booking flow
  - [ ] Verify event creation works
  - [ ] Test on mobile device

## Environment Variables Required

Ensure these are set in production:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (LIVE MODE) - All keys provided, see STRIPE_LIVE_KEYS.md
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_4P7O2Ppsvt1HFkzQOnaT55GPdtKSOQk3
NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY=price_1SPWeS1fQ6MPQdN07Vcg9JYI
NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_YEARLY=price_1SPXuN1fQ6MPQdN039yUK8du

# OpenAI
OPENAI_API_KEY=sk-...

# ElevenLabs
ELEVEN_LABS_API_KEY=...

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=DoorIQ <noreply@dooriq.ai>

# App URLs
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# reCAPTCHA (optional)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
RECAPTCHA_SECRET_KEY=...
```

## Pre-Launch Testing

Before going live, test:

1. **Payment Flow:**
   - [ ] Test subscription purchase
   - [ ] Verify credits granted
   - [ ] Verify features unlock
   - [ ] Test subscription cancellation
   - [ ] Test payment method update

2. **Core Features:**
   - [ ] Create live session
   - [ ] Upload MP3 file
   - [ ] Verify both use same grading
   - [ ] Check dashboard displays correctly

3. **User Management:**
   - [ ] Test invite creation
   - [ ] Test invite acceptance
   - [ ] Test team assignment

4. **Contact Sales:**
   - [ ] Complete form
   - [ ] Verify Cal.com loads
   - [ ] Test booking flow

## Post-Launch Monitoring

After launch, monitor:

1. **Stripe Webhooks:**
   - Check webhook delivery in Stripe Dashboard
   - Monitor for failed webhooks
   - Verify all events are processed

2. **Error Tracking:**
   - Monitor API errors
   - Check for authentication failures
   - Watch for rate limiting issues

3. **Performance:**
   - Monitor API response times
   - Check database query performance
   - Monitor file upload success rates

4. **User Feedback:**
   - Watch for support requests
   - Monitor error logs
   - Track feature usage

## Critical Notes

1. **Stripe Keys:** Must switch from test to live mode before launch
2. **Webhook Secret:** Must be updated in production environment
3. **Billing Portal:** Must be configured in Stripe Dashboard (live mode)
4. **Environment Variables:** All must be set in production hosting platform
5. **Security:** Verify RLS policies are active in production Supabase

## Support Resources

- Stripe Dashboard: https://dashboard.stripe.com
- Supabase Dashboard: https://app.supabase.com
- Cal.com Dashboard: https://app.cal.com
- Vercel Dashboard: https://vercel.com/dashboard

