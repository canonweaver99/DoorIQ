# Switching to Production Mode

## ⚠️ Current Status

You are currently using **TEST mode** Stripe keys:
- `STRIPE_SECRET_KEY=sk_test_...`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`

## 🚨 Important: Test Subscription Issue

A test subscription was created earlier for `test12345@dooriq.ai`:
- **Test Customer**: `cus_To055fHSvHR8n1`
- **Test Subscription**: `sub_1SqO5i1WkNBozaYxNsQIjq4M`

**This test subscription will NOT work in production!** You'll need to:
1. Delete the test subscription (or it will be ignored in production)
2. Have the user go through checkout again with production keys
3. Or manually create a production subscription

## 🔧 Steps to Switch to Production

### 1. Get Production Keys from Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Switch to Live Mode** (toggle in top right)
3. Go to **Developers** → **API keys**
4. Copy:
   - **Secret key** (starts with `sk_live_`)
   - **Publishable key** (starts with `pk_live_`)

### 2. Update Environment Variables

#### For Local Development (.env.local)

Update your `.env.local` file:

```bash
# Replace test keys with production keys
STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET
```

#### For Production (Vercel)

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update:
   - `STRIPE_SECRET_KEY` → Production key (`sk_live_...`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → Production key (`pk_live_...`)
   - `STRIPE_WEBHOOK_SECRET` → Production webhook secret
3. **Redeploy** your application

### 3. Configure Production Webhook

1. Go to Stripe Dashboard (Live Mode)
2. Navigate to **Developers** → **Webhooks**
3. Verify endpoint: `https://dooriq.ai/api/stripe/webhook`
4. Copy the **Signing secret** (starts with `whsec_`)
5. Update `STRIPE_WEBHOOK_SECRET` in your environment variables

### 4. Production Price IDs

The production price IDs are already configured in `lib/stripe/config.ts`:
- **Starter/Individual**: `price_1SpC081fQ6MPQdN0Oi42IDV0` ($49/month)
- **Team**: `price_1SW66b1fQ6MPQdN0SJ1r5Kbj` ($39/rep/month)
- **Enterprise**: `price_1SW66b1fQ6MPQdN0SJ1r5Kbj` ($29/rep/month)

### 5. Handle Test Subscription

The test subscription created for `test12345@dooriq.ai` needs to be handled:

**Option A: Delete and Recreate (Recommended)**
```bash
# Delete test subscription (run in test mode)
node scripts/delete-test-subscription.js test12345@dooriq.ai

# Then have user go through checkout again with production keys
```

**Option B: Create Production Subscription**
```bash
# After switching to production keys, run:
node scripts/create-manual-trial.js test12345@dooriq.ai
```

## ✅ Verification Checklist

After switching to production:

- [ ] Environment variables updated with `sk_live_` and `pk_live_` keys
- [ ] Webhook endpoint configured in Stripe Dashboard (Live Mode)
- [ ] Webhook secret matches production webhook
- [ ] Application redeployed (if using Vercel)
- [ ] Test subscription handled (deleted or recreated)
- [ ] Test a real checkout flow with production keys
- [ ] Verify webhook events are received and processed

## 🧪 Testing Production Setup

1. Use a real credit card (small test amount)
2. Complete checkout on production site
3. Verify:
   - ✅ Payment processes successfully
   - ✅ Webhook receives `checkout.session.completed` event
   - ✅ User account created/updated in database
   - ✅ Subscription status set to "trialing"
   - ✅ Trial end date set correctly

## 📞 Need Help?

If you encounter issues:
1. Check Stripe Dashboard → Webhooks → Recent events
2. Check application logs for webhook processing errors
3. Verify environment variables are set correctly
4. Ensure webhook endpoint URL matches your production domain

