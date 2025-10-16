# 🎉 DoorIQ 7-Day Free Trial & Subscription System

This document provides a complete setup guide for the Stripe-powered subscription system with 7-day free trials, notifications, and feature gating.

## 📋 Table of Contents
1. [Environment Variables Setup](#environment-variables-setup)
2. [Stripe Dashboard Configuration](#stripe-dashboard-configuration)
3. [Database Migrations](#database-migrations)
4. [Webhook Configuration](#webhook-configuration)
5. [Testing the System](#testing-the-system)
6. [Features Implemented](#features-implemented)
7. [Usage Examples](#usage-examples)

---

## 🔐 Environment Variables Setup

Add the following to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Stripe Webhook Secret (you'll get this after setting up webhooks - see section below)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App URL (use your production URL when deploying)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend Email API Key (optional, for email notifications)
RESEND_API_KEY=re_your_resend_api_key_here
```

---

## 🏪 Stripe Dashboard Configuration

### Step 1: Create Products and Prices

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Click "Add Product"
3. Create the following products:

#### Individual Monthly Plan
- **Name**: DoorIQ Individual Monthly
- **Description**: Full access to all DoorIQ features
- **Pricing Model**: Recurring
- **Price**: $20.00 USD
- **Billing Period**: Monthly
- **Free Trial**: 7 days
- Copy the **Price ID** (starts with `price_`) and add to `.env.local`:
  ```bash
  NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY=price_xxxxxxxxxxxxx
  ```

#### Individual Yearly Plan
- **Name**: DoorIQ Individual Yearly
- **Description**: Full access to all DoorIQ features (Save 20%)
- **Pricing Model**: Recurring
- **Price**: $192.00 USD (equivalent to $16/month)
- **Billing Period**: Yearly
- **Free Trial**: 7 days
- Copy the **Price ID** and add to `.env.local`:
  ```bash
  NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_YEARLY=price_xxxxxxxxxxxxx
  ```

### Step 2: Configure Billing Portal

1. Go to [Customer Portal Settings](https://dashboard.stripe.com/test/settings/billing/portal)
2. Enable the following features:
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to cancel subscriptions
   - ✅ Allow customers to update subscriptions
   - ✅ Show invoice history
3. Set cancellation behavior:
   - Choose "Cancel at end of billing period"
4. Save changes

---

## 🗄️ Database Migrations

Run the database migrations to set up subscription tracking:

```bash
# Run migration 046 (if not already run)
# This adds basic subscription fields

# Run migration 047 (new)
# This adds enhanced subscription tracking, feature flags, and session limits
```

The migrations create:
- **Subscription tracking fields** on the `users` table
- **`subscription_events`** table for event logging and notifications
- **`feature_flags`** table for granular feature control
- **`user_session_limits`** table for free tier session tracking
- **PostgreSQL functions** for feature access checking

To run the migrations, execute them in your Supabase SQL Editor or use your migration tool.

---

## 🔔 Webhook Configuration

### Local Development (Using Stripe CLI)

1. Install Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   # or download from https://stripe.com/docs/stripe-cli
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to http://localhost:3000/api/stripe/webhook
   ```

4. Copy the webhook signing secret (starts with `whsec_`) and add to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### Production Deployment

1. Go to [Webhooks](https://dashboard.stripe.com/test/webhooks) in Stripe Dashboard
2. Click "Add Endpoint"
3. Set endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
4. Select the following events to listen to:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `customer.subscription.trial_will_end`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
5. Copy the webhook signing secret and add to your production environment variables

---

## 🧪 Testing the System

### Test Cards

Use Stripe's test cards for testing:

| Card Number | Scenario |
|------------|----------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0341 | Fails and requires authentication |
| 4000 0000 0000 9995 | Payment fails |

### Testing Flow

1. **Sign up for a new account**
2. **Go to `/pricing`** and click "Start Free Trial"
3. **Enter test card** information
4. **Complete checkout** - you'll be redirected back with a 7-day trial active
5. **Verify subscription status** at `/billing`
6. **Test session limits** - free users get 10 sessions/month, premium get unlimited
7. **Test feature access** - some features should be locked for free users

### Simulating Events

Use Stripe CLI to trigger test events:

```bash
# Simulate trial ending soon (3 days before end)
stripe trigger customer.subscription.trial_will_end

# Simulate successful payment
stripe trigger invoice.payment_succeeded

# Simulate failed payment
stripe trigger invoice.payment_failed
```

---

## ✨ Features Implemented

### 1. **7-Day Free Trial**
- Automatically applied to all new subscriptions
- No charges during trial period
- Full access to all premium features
- Email notifications for trial start and ending

### 2. **Subscription Management**
- Create checkout sessions with trial
- Customer portal for managing subscriptions
- Webhooks for real-time subscription updates
- Automatic status syncing with database

### 3. **Feature Gating System**
- **Server-side**: `checkFeatureAccess()` function
- **Client-side**: `useFeatureAccess()` hook
- **Database-driven**: Feature flags stored in database
- **Granular control**: Different features for different tiers

### 4. **Session Limits**
- Free tier: 10 practice sessions per month
- Premium tier: Unlimited sessions
- Auto-reset monthly
- Real-time tracking

### 5. **Email Notifications**
- ✅ Trial started
- ✅ Trial ending soon (3 days before)
- ✅ Trial converted to paid
- ✅ Payment succeeded
- ✅ Payment failed
- ✅ Subscription canceled
- ✅ Cancellation scheduled

### 6. **UI Components**
- `<PaywallModal />` - Upgrade prompt with pricing
- `<TrialBanner />` - Shows trial countdown
- `<SessionLimitBanner />` - Warns about session limits
- `<FeatureLock />` - Locks premium features
- `<SubscriptionStatusCard />` - Dashboard subscription widget

### 7. **Subscription Status Tracking**
- Active subscriptions
- Trial periods
- Past due payments
- Canceled subscriptions
- Feature access history

---

## 💻 Usage Examples

### Protect a Feature with Paywall

```tsx
'use client'

import { useState } from 'react'
import { useFeatureAccess } from '@/hooks/useSubscription'
import { PaywallModal, FeatureLock } from '@/components/subscription'
import { FEATURES } from '@/lib/subscription/feature-access'

export default function AdvancedAnalytics() {
  const { hasAccess, loading } = useFeatureAccess(FEATURES.ADVANCED_ANALYTICS)
  const [showPaywall, setShowPaywall] = useState(false)

  if (loading) return <div>Loading...</div>

  return (
    <>
      <FeatureLock 
        isLocked={!hasAccess}
        onClick={() => setShowPaywall(true)}
      >
        {/* Your premium feature content */}
        <div>Advanced Analytics Dashboard</div>
      </FeatureLock>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        reason="feature_locked"
        featureName="Advanced Analytics"
      />
    </>
  )
}
```

### Check Session Limits

```tsx
'use client'

import { useSessionLimit } from '@/hooks/useSubscription'
import { SessionLimitBanner } from '@/components/subscription'

export default function TrainerPage() {
  const sessionLimit = useSessionLimit()

  const handleStartSession = async () => {
    if (!sessionLimit.canStartSession) {
      alert('Session limit reached. Please upgrade!')
      return
    }

    // Increment session count
    await fetch('/api/session/increment', { method: 'POST' })
    await sessionLimit.refresh()

    // Start your session...
  }

  return (
    <div>
      <SessionLimitBanner
        sessionsRemaining={sessionLimit.sessionsRemaining}
        sessionsLimit={sessionLimit.sessionsLimit}
        sessionsUsed={sessionLimit.sessionsUsed}
      />
      
      <button onClick={handleStartSession}>
        Start Practice Session
      </button>
    </div>
  )
}
```

### Server-Side Feature Check

```tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkFeatureAccess, FEATURES } from '@/lib/subscription/feature-access'

export default async function ProtectedPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return <div>Please log in</div>
  }

  const hasAccess = await checkFeatureAccess(user.id, FEATURES.EXPORT_REPORTS)

  if (!hasAccess) {
    return <div>Upgrade to access this feature</div>
  }

  return <div>Your premium feature content</div>
}
```

### Show Trial Banner

```tsx
'use client'

import { useSubscription } from '@/hooks/useSubscription'
import { TrialBanner } from '@/components/subscription'

export default function Dashboard() {
  const subscription = useSubscription()

  return (
    <div>
      {subscription.isTrialing && subscription.trialEndsAt && (
        <TrialBanner
          daysRemaining={subscription.daysRemainingInTrial || 0}
          trialEndsAt={subscription.trialEndsAt}
        />
      )}
      
      {/* Your dashboard content */}
    </div>
  )
}
```

---

## 🎯 Feature Flags Reference

The following features are configured in the database:

| Feature Key | Name | Free Tier | Trial | Paid |
|------------|------|-----------|-------|------|
| `all_agents` | All 12 AI Agents | ❌ | ✅ | ✅ |
| `unlimited_sessions` | Unlimited Sessions | ❌ | ✅ | ✅ |
| `advanced_analytics` | Advanced Analytics | ❌ | ✅ | ✅ |
| `call_recording` | Call Recording | ❌ | ✅ | ✅ |
| `export_reports` | Export Reports | ❌ | ✅ | ✅ |
| `custom_scenarios` | Custom Scenarios | ❌ | ✅ | ✅ |
| `team_features` | Team Features | ❌ | ❌ | ✅ |
| `priority_support` | Priority Support | ❌ | ✅ | ✅ |
| `basic_agents` | 3 Basic Agents | ✅ | ✅ | ✅ |
| `basic_sessions` | 10 Sessions/Month | ✅ | ✅ | ✅ |

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Update `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Create production Stripe products and prices
- [ ] Update environment variables with production Stripe keys
- [ ] Configure production webhook endpoint in Stripe Dashboard
- [ ] Set up Resend API key for email notifications
- [ ] Run database migrations on production database
- [ ] Test complete subscription flow in production
- [ ] Configure Stripe tax collection (if needed)
- [ ] Set up Stripe billing portal customization
- [ ] Test all email notifications are being sent
- [ ] Verify webhook events are being received

---

## 📞 Support

If you encounter any issues:

1. Check Stripe Dashboard logs for webhook errors
2. Check server logs for API errors
3. Verify environment variables are set correctly
4. Ensure database migrations have been run
5. Test with Stripe test cards first

---

## 🎊 You're All Set!

Your DoorIQ subscription system is now fully configured with:
- ✅ 7-day free trials
- ✅ Automatic billing
- ✅ Feature gating
- ✅ Session limits
- ✅ Email notifications
- ✅ Subscription management

Start testing and watch your revenue grow! 🚀

