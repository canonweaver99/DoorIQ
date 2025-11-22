# Stripe Plans Integration

## Overview
Stripe payment links have been integrated into the DoorIQ pricing page for Starter and Team plans.

## Configuration

### Starter Plan Details
- **Price ID**: `price_1SW61m1fQ6MPQdN0K9cEgwzk`
- **Payment Link**: `https://buy.stripe.com/8x228j5cC2UWaqVe0L2go01`

### Team Plan Details
- **Price ID**: `price_1SW66b1fQ6MPQdN0SJ1r5Kbj`
- **Payment Link**: `https://buy.stripe.com/00w6oz9sSgLM42x2i32go02`

### Files Modified

1. **`lib/stripe/config.ts`** (NEW)
   - Centralized Stripe configuration file
   - Contains price IDs and payment links for all plans
   - Easy to extend for future plans (team, enterprise)

2. **`app/pricing/page.tsx`**
   - Updated CTA buttons for starter and team plans to redirect to Stripe payment links
   - Starter and Team plans now bypass Cal.com calendar and go directly to checkout
   - Enterprise plan still uses Cal.com for demos

## How It Works

### Starter Plan
1. User clicks "Start Free Trial" on the Starter plan card
2. User is redirected to: `https://buy.stripe.com/8x228j5cC2UWaqVe0L2go01`
3. User completes checkout on Stripe
4. Stripe webhook fires `checkout.session.completed` event
5. Webhook handler (`/api/stripe/webhook/route.ts`) processes the subscription

### Team Plan
1. User clicks "Start Free Trial" on the Team plan card
2. User is redirected to: `https://buy.stripe.com/00w6oz9sSgLM42x2i32go02`
3. User completes checkout on Stripe
4. Stripe webhook fires `checkout.session.completed` event
5. Webhook handler (`/api/stripe/webhook/route.ts`) processes the subscription

## Next Steps

### 1. Verify Webhook Configuration
Ensure your Stripe webhook is configured to handle the starter plan:
- Webhook endpoint: `/api/stripe/webhook`
- Required events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

### 2. Test the Flow
**Starter Plan:**
1. Go to `/pricing` page
2. Click "Start Free Trial" on Starter plan
3. Complete checkout with test card: `4242 4242 4242 4242`
4. Verify webhook receives events
5. Verify user subscription status updates in database

**Team Plan:**
1. Go to `/pricing` page
2. Click "Start Free Trial" on Team plan
3. Complete checkout with test card: `4242 4242 4242 4242`
4. Verify webhook receives events
5. Verify user subscription status updates in database

### 3. Optional: Add Price ID to Environment Variables
If you need to reference the price ID in other parts of the app, add to `.env.local`:

```bash
NEXT_PUBLIC_STRIPE_PRICE_STARTER=price_1SW61m1fQ6MPQdN0K9cEgwzk
```

Then import from config:
```typescript
import { STRIPE_CONFIG } from '@/lib/stripe/config'
const starterPriceId = STRIPE_CONFIG.starter.priceId
```

## Adding More Plans

To add Team or Enterprise plans, update `lib/stripe/config.ts`:

```typescript
export const STRIPE_CONFIG = {
  starter: {
    priceId: 'price_1SW61m1fQ6MPQdN0K9cEgwzk',
    paymentLink: 'https://buy.stripe.com/8x228j5cC2UWaqVe0L2go01',
  },
  team: {
    priceId: 'price_1SW66b1fQ6MPQdN0SJ1r5Kbj',
    paymentLink: 'https://buy.stripe.com/00w6oz9sSgLM42x2i32go02',
  },
  enterprise: {
    priceId: 'price_...',
    paymentLink: 'https://buy.stripe.com/...',
  },
}
```

Then update the pricing page CTA logic to handle the enterprise plan similarly.

