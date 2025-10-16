# 🚀 Local Free Trial & Paywall Setup Guide

## Step 1: Configure Environment Variables

Create or update your `.env.local` file with the following:

```bash
# Stripe Configuration (TEST MODE)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs
NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY=price_your_monthly_price_id_here
NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_YEARLY=price_your_yearly_price_id_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 2: Get Your Stripe Price ID from Payment Link

You provided: `https://buy.stripe.com/test_eVq5kw4h46yu7VB6RJes000`

To get the Price ID:
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Find your "Individual Plan" product
3. Copy the **Price ID** (starts with `price_`)
4. Add it to `NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY` in `.env.local`

## Step 3: Set Up Webhooks (for testing)

Run this in a separate terminal:
```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

This will give you a webhook secret starting with `whsec_` - add it to your `.env.local`

## Step 4: Run the Application

```bash
npm run dev
```

## Step 5: Test the Flow

1. Go to `http://localhost:3000/pricing`
2. Click "Start Free Trial" on the Individual plan
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Verify trial status on `/billing` or dashboard

## What's Been Set Up

✅ **Subscription tracking** - Database schema for subscriptions
✅ **7-day free trials** - Automatically applied on checkout
✅ **Feature gating** - Hook-based access control
✅ **Session limits** - 10/month for free, unlimited for paid
✅ **Paywall modals** - Upgrade prompts
✅ **Trial banners** - Countdown and notifications
✅ **Webhooks** - Real-time subscription updates

## Files Modified/Created

- `components/subscription/PaywallModal.tsx` - Upgrade prompt
- `components/subscription/TrialBanner.tsx` - Trial countdown
- `components/subscription/SessionLimitBanner.tsx` - Session warnings
- `app/pricing/page.tsx` - Updated with checkout flow
- Database migration already exists at `lib/supabase/migrations/047_enhance_subscription_tracking.sql`

