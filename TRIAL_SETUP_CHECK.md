# 7-Day Free Trial Setup Check

## ✅ Code is Ready

The code is properly configured for 7-day free trials:

1. **Checkout Flow** (`app/api/checkout/create-session/route.ts`):
   - ✅ Sets `trial_period_days: 7` for individual plans (1 rep)
   - ✅ Line 327: `...(repCount === 1 && !isFullDiscount ? { trial_period_days: 7 } : {})`

2. **Webhook Handler** (`app/api/stripe/webhook/route.ts`):
   - ✅ Retrieves subscription and trial end date
   - ✅ Sets `subscription_status: 'trialing'` 
   - ✅ Sets `trial_ends_at` in database
   - ✅ Sends welcome email and trial notification

## ⚠️ Current Status: TEST MODE

**You are currently in TEST mode** (`sk_test_...` keys)

This means:
- ❌ **Real signups won't work** - they need production keys
- ✅ Test signups will work with test cards
- ⚠️ Test subscriptions won't work in production

## 🔧 What Needs to Be Done for Production

### 1. Switch to Production Stripe Keys

Update Vercel environment variables:
- `STRIPE_SECRET_KEY` → `sk_live_...` (production key)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_...` (production key)
- `STRIPE_WEBHOOK_SECRET` → Production webhook secret

### 2. Configure Stripe Webhook (Production)

In Stripe Dashboard (Live Mode):
1. Go to **Developers** → **Webhooks**
2. Add endpoint: `https://dooriq.ai/api/stripe/webhook`
3. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
4. Copy the signing secret → Update `STRIPE_WEBHOOK_SECRET` in Vercel

### 3. Verify Price Supports Trials

The price ID (`price_1SpC081fQ6MPQdN0Oi42IDV0`) must:
- ✅ Belong to product `prod_TmlX1S82Ed4Gpe`
- ✅ Support trials (recurring subscription price)
- ✅ Be active in production

### 4. Test the Flow

After switching to production:
1. Have a friend sign up through checkout
2. Complete checkout with real card
3. Verify:
   - ✅ User account created
   - ✅ Subscription status = `trialing`
   - ✅ `trial_ends_at` is set (7 days from now)
   - ✅ Welcome email received
   - ✅ User can access all features

## 📋 Checklist

- [ ] Production Stripe keys added to Vercel
- [ ] Production webhook endpoint configured in Stripe
- [ ] Webhook secret updated in Vercel
- [ ] Price ID verified in production (`price_1SpC081fQ6MPQdN0Oi42IDV0`)
- [ ] Test signup with real card
- [ ] Verify trial is active in database
- [ ] Verify user can access features

## 🧪 Testing in Test Mode

If you want to test the flow now (in test mode):
1. Use test card: `4242 4242 4242 4242`
2. Any future expiry date
3. Any CVC
4. Complete checkout
5. Check database for `subscription_status: 'trialing'`

## ⚠️ Important Notes

- **Test subscriptions won't work in production** - they're separate systems
- **Webhook must be configured** - without it, trials won't be set up
- **Price must support trials** - verify in Stripe Dashboard
- **All prices must belong to** `prod_TmlX1S82Ed4Gpe`

## 🚀 Ready for Production?

Once you:
1. ✅ Switch to production Stripe keys
2. ✅ Configure production webhook
3. ✅ Verify price supports trials

Then **YES** - the 7-day free trial will work for new signups!

