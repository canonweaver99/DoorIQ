# 🚀 Quick Start: Free Trial & Paywall

## ✅ Setup Complete!

Your DoorIQ app now has a complete free trial and paywall system running locally!

## 📋 What You Need to Do Next

### 1. Add Environment Variables

Create or update `.env.local` with your Stripe keys:

```bash
# Get these from: https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# Get your Price ID from: https://dashboard.stripe.com/test/products
NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY=price_your_id_here

# Your app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note:** Until you add the price ID, the app will use your payment link directly:
`https://buy.stripe.com/test_eVq5kw4h46yu7VB6RJes000`

### 2. Start Stripe Webhook Listener (Optional for Testing)

In a new terminal:
```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

Copy the webhook secret and add to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### 3. Restart Dev Server

```bash
npm run dev
```

## 🧪 Test the Features

### Test Scenario 1: Free User
1. Go to `http://localhost:3000`
2. Sign up for a new account
3. Go to `/trainer`
4. See **session limit banner** (10 sessions/month)
5. Start a practice session
6. After starting, session count increments
7. Try starting 11 sessions → **Paywall appears!**

### Test Scenario 2: Upgrade to Trial
1. On paywall, click "Start Free Trial"
2. Goes to `/pricing`
3. Click "Start Free Trial" on Individual plan ($20/month)
4. Redirects to Stripe checkout or payment link
5. Use test card: `4242 4242 4242 4242`
6. After checkout → **Trial Banner appears!**
7. Go to `/trainer` → **No more session limits!**
8. Start unlimited practice sessions

### Test Scenario 3: Trial Countdown
1. With active trial, navigate around the app
2. **Trial banner shows** at top with days remaining
3. If 3 or fewer days remaining → **Warning colors**
4. Can manage subscription at `/billing`

## 🎨 What's Been Built

### Components Created:
- ✅ **PaywallModal** - Beautiful upgrade prompts
- ✅ **TrialBanner** - Trial countdown with smart warnings
- ✅ **SessionLimitBanner** - Session usage warnings
- ✅ **FeatureLock** - Lock premium features
- ✅ **SubscriptionStatusCard** - Subscription widget

### Features Implemented:
- ✅ **Session Limits** - 10/month for free, unlimited for paid
- ✅ **Feature Gating** - Lock features based on subscription
- ✅ **7-Day Free Trial** - Automatic trial on signup
- ✅ **Real-time Updates** - Webhooks sync subscription status
- ✅ **Smart Banners** - Show relevant info based on user status

### API Routes:
- ✅ `/api/session/increment` - Track session usage
- ✅ `/api/stripe/create-checkout-session` - Start checkout
- ✅ `/api/stripe/webhook` - Handle Stripe events

## 📱 Where to See Changes

### Trainer Page (`/trainer`)
- Session limit banner for free users
- Trial banner for trial users
- Paywall modal when limit reached
- Session count increments on start

### Pricing Page (`/pricing`)
- Updated checkout flow
- Uses your payment link
- 7-day trial messaging
- Beautiful animations

### Dashboard (Future)
- Add `<SubscriptionStatusCard />` to show subscription status
- Add trial banners to any page

## 🐛 Common Issues

### "Payment link not working"
→ Make sure you're in Stripe test mode and the link is valid

### "Session count not incrementing"
→ Check that database migration 047 has been run

### "Webhooks not firing"
→ Run `stripe listen` command and add webhook secret to .env.local

### "Trial banner not showing"
→ Complete a checkout and wait for webhook to update subscription

## 📚 Documentation

See these files for more details:
- `FREE_TRIAL_SETUP_COMPLETE.md` - Complete feature documentation
- `STRIPE_LOCAL_SETUP.md` - Detailed Stripe configuration
- `STRIPE_FREE_TRIAL_SETUP.md` - Original setup guide

## 🎯 Next Steps

1. **Test locally** - Follow test scenarios above
2. **Add Stripe keys** - Get from Stripe Dashboard
3. **Set up webhooks** - Use Stripe CLI for local testing
4. **Customize features** - Edit feature flags in database
5. **Deploy** - Update environment variables for production

## 🎊 You're Ready!

The dev server is running at: **http://localhost:3000**

Start testing the free trial and paywall features!

