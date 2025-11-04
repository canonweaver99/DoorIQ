# Next Steps for Production Launch

## ✅ Completed: Stripe Configuration
All Stripe keys, webhooks, and price IDs are configured.

## 🎯 Priority Actions (Do These First)

### 1. Add Environment Variables to Production ⚠️ CRITICAL
**Add these 5 Stripe variables to your hosting platform (Vercel, etc.):**

```bash
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_4P7O2Ppsvt1HFkzQOnaT55GPdtKSOQk3
NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY=price_1SPWeS1fQ6MPQdN07Vcg9JYI
NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_YEARLY=price_1SPXuN1fQ6MPQdN039yUK8du
```

**How:** Vercel Dashboard → Project → Settings → Environment Variables → Add each variable → Redeploy

### 2. Configure Stripe Billing Portal ⚠️ IMPORTANT
**Without this, users can't manage subscriptions:**

1. Go to: **Stripe Dashboard (Live Mode)** → **Settings** → **Billing** → **Customer portal**
2. Click **"Activate test link"** (for live mode)
3. Configure:
   - Business name: DoorIQ
   - Support email: your support email
   - Customer options: ✅ Update payment method, ✅ Cancel subscription, ✅ View invoices
4. Click **"Save"**

### 3. Test Critical Flows 🔍

#### A. Payment Flow (MOST CRITICAL)
1. Go to `/pricing` page
2. Click "Purchase" on Individual plan
3. Complete checkout with a real card (or Stripe test card if you want)
4. **Verify:**
   - ✅ User is redirected back with success
   - ✅ 50 credits are granted (check dashboard)
   - ✅ Subscription status shows "active" or "trialing"
   - ✅ Premium features are unlocked
   - ✅ Check Stripe Dashboard → Webhooks → See if events were received

#### B. MP3 Upload & Grading
1. Go to `/trainer/upload` or dashboard upload tab
2. Upload an MP3 file
3. **Verify:**
   - ✅ Upload succeeds
   - ✅ Transcription completes
   - ✅ Grading completes
   - ✅ Scores appear (same format as live sessions)
   - ✅ Session appears in dashboard/analytics

#### C. Dashboard Features
1. Navigate through all dashboard tabs:
   - Overview: Stats load correctly
   - Performance: Charts display
   - Learning: Content loads
   - Upload: Upload works
   - Team: Team stats (if applicable)

#### D. Settings & Billing
1. Go to `/settings` - Verify preferences save
2. Go to `/billing` - Verify:
   - ✅ Subscription status displays
   - ✅ "Manage Subscription" button works
   - ✅ Opens Stripe customer portal

#### E. Invite System
1. As a manager/admin, create an invite
2. **Verify:**
   - ✅ Invite email is sent
   - ✅ Invite link works
   - ✅ User can accept invite
   - ✅ Team assignment works

#### F. Cal.com Integration
1. Go to `/contact-sales`
2. Complete the form
3. **Verify:**
   - ✅ Cal.com embed loads on step 4
   - ✅ Calendar booking works
   - ✅ Event is created

## 📋 Quick Testing Checklist

Run through these quickly before going live:

- [ ] Environment variables added to production
- [ ] Site deployed with new env vars
- [ ] Test purchase flow works
- [ ] Credits granted after purchase
- [ ] Upload MP3 and verify grading
- [ ] Dashboard tabs all work
- [ ] Billing portal opens correctly
- [ ] Invite system works
- [ ] Cal.com loads on contact sales form

## 🚀 When Ready to Launch

1. **Final Check:**
   - All environment variables set ✅
   - Stripe billing portal configured ✅
   - Tested critical flows ✅

2. **Deploy:**
   - Push to production
   - Monitor for errors

3. **Monitor:**
   - Check Stripe webhook logs
   - Monitor error logs
   - Watch for user feedback

## ⚠️ Critical Issues to Watch For

1. **Webhook Failures:** Check Stripe Dashboard → Webhooks → Event logs
2. **Credit Granting:** If credits don't grant, check webhook events
3. **Feature Unlocking:** Verify subscription_status updates correctly
4. **Upload Errors:** Check file size limits and API errors

## 📚 Reference Documents

- `PRODUCTION_LAUNCH_CHECKLIST.md` - Complete checklist
- `STRIPE_COMPLETE_CONFIG.md` - All Stripe config
- `PRODUCTION_SECURITY_AUDIT.md` - Security details
- `STRIPE_WEBHOOK_EVENTS.md` - Webhook events list

## 🆘 If Something Breaks

1. Check environment variables are set correctly
2. Check Stripe webhook logs
3. Check application error logs
4. Verify Supabase RLS policies are active
5. Test with Stripe test mode first if issues persist

---

**Status:** Ready to test and deploy! 🚀

