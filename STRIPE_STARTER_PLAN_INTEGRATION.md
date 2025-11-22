# Stripe Starter Plan Integration

## Overview
The Stripe starter plan has been integrated into the DoorIQ pricing page.

## Configuration

### Starter Plan Details
- **Price ID**: `price_1SW61m1fQ6MPQdN0K9cEgwzk`
- **Payment Link**: `https://buy.stripe.com/8x228j5cC2UWaqVe0L2go01`

### Files Modified

1. **`lib/stripe/config.ts`** (NEW)
   - Centralized Stripe configuration file
   - Contains price IDs and payment links for all plans
   - Easy to extend for future plans (team, enterprise)

2. **`app/pricing/page.tsx`**
   - Updated CTA button for starter plan to redirect to Stripe payment link
   - Starter plan now bypasses Cal.com calendar and goes directly to checkout
   - Other plans (team, enterprise) still use Cal.com for demos

## How It Works

1. User clicks "Start Free Trial" on the Starter plan card
2. User is redirected to: `https://buy.stripe.com/8x228j5cC2UWaqVe0L2go01`
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
1. Go to `/pricing` page
2. Click "Start Free Trial" on Starter plan
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
    priceId: 'price_...',
    paymentLink: 'https://buy.stripe.com/...',
  },
  enterprise: {
    priceId: 'price_...',
    paymentLink: 'https://buy.stripe.com/...',
  },
}
```

Then update the pricing page CTA logic to handle these plans similarly.

