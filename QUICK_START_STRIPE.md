# ⚡ Quick Start: Stripe Free Trial System

## 🎯 5-Minute Setup

### 1. Add to `.env.local`
```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Create Stripe Products
1. Go to https://dashboard.stripe.com/test/products
2. Create product: **DoorIQ Individual Monthly** - $20/month, 7-day trial
3. Copy Price ID → Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY=price_xxxxx
   ```

### 3. Set Up Webhooks (Local)
```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```
Copy `whsec_xxxxx` to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 4. Run Database Migration
Execute `lib/supabase/migrations/047_enhance_subscription_tracking.sql` in Supabase

### 5. Test It!
1. Visit `http://localhost:3000/pricing`
2. Click "Start Free Trial"
3. Use test card: `4242 4242 4242 4242`
4. Check `/billing` for subscription status

---

## 🔥 Common Use Cases

### Lock a Premium Feature
```tsx
import { useFeatureAccess } from '@/hooks/useSubscription'
import { FEATURES } from '@/lib/subscription/feature-access'

const { hasAccess } = useFeatureAccess(FEATURES.ADVANCED_ANALYTICS)
if (!hasAccess) {
  // Show paywall or lock feature
}
```

### Check Session Limit Before Starting
```tsx
import { useSessionGuard } from '@/components/trainer/SessionGuard'

const { checkAndStartSession } = useSessionGuard()

async function handleStart() {
  const canStart = await checkAndStartSession()
  if (canStart) {
    // Start session
  }
  // Paywall shows automatically if can't start
}
```

### Show Subscription Status
```tsx
import SubscriptionStatusCard from '@/components/dashboard/SubscriptionStatusCard'

<SubscriptionStatusCard />
```

---

## 📦 What's Included

✅ 7-day free trial system
✅ Automatic billing after trial
✅ Feature gating (10 features)
✅ Session limits (10/month free, unlimited paid)
✅ Email notifications (7 types)
✅ Paywall modals
✅ Trial countdown banners
✅ Session limit warnings
✅ Subscription dashboard widgets
✅ Complete documentation

---

## 🎨 Available Features

```typescript
import { FEATURES } from '@/lib/subscription/feature-access'

FEATURES.ALL_AGENTS          // 12 AI agents
FEATURES.UNLIMITED_SESSIONS  // No session limits
FEATURES.ADVANCED_ANALYTICS  // Advanced insights
FEATURES.CALL_RECORDING      // Record calls
FEATURES.EXPORT_REPORTS      // CSV/PDF export
FEATURES.CUSTOM_SCENARIOS    // Custom training
FEATURES.TEAM_FEATURES       // Team management
FEATURES.PRIORITY_SUPPORT    // Priority help
```

---

## 🧪 Test Cards

| Card | Result |
|------|--------|
| 4242 4242 4242 4242 | Success ✅ |
| 4000 0000 0000 9995 | Decline ❌ |
| 4000 0000 0000 0341 | Requires auth 🔐 |

---

## 📚 Full Docs

- **Setup Guide**: `STRIPE_FREE_TRIAL_SETUP.md`
- **Implementation**: `IMPLEMENTATION_GUIDE.md`
- **Summary**: `STRIPE_SYSTEM_SUMMARY.md`

---

## 🚀 You're Ready!

Test the system locally, then deploy to production with your real Stripe keys.

**Questions?** Check the full documentation files.

