# How to Find Stripe Price IDs

## Important: Product IDs vs Price IDs

You've provided the **Product IDs**:
- Monthly: `prod_TMF8fyztCmkcyN`
- Yearly: `prod_TMGRM9BYQlb8nI

But we need the **Price IDs** (which start with `price_...`) for the environment variables.

## Steps to Find Price IDs

### Method 1: From Stripe Dashboard (Recommended)

1. **Go to Stripe Dashboard:**
   - Navigate to: **Products** (in left sidebar)

2. **Find Monthly Product:**
   - Click on product: `prod_TMF8fyztCmkcyN`
   - Look for the **"Pricing"** section or **"Pricing table"**
   - You should see a price listed (e.g., "$20/month")
   - Click on that price or look for a **Price ID** (starts with `price_...`)
   - **Copy the Price ID**

3. **Find Yearly Product:**
   - Click on product: `prod_TMGRM9BYQlb8nI`
   - Repeat the same process
   - **Copy the Price ID**

### Method 2: From Payment Link (If you have access)

If you can view the payment link configuration:
- The payment link `https://buy.stripe.com/28E7sDeNc1QSdD7g8T2go00` should show which price it's using
- Check the payment link settings in Stripe Dashboard

### Method 3: From API (If you have API access)

You can query the Stripe API to get prices for each product:

```bash
# Get prices for monthly product
curl https://api.stripe.com/v1/prices?product=prod_TMF8fyztCmkcyN \
  -u sk_live_YOUR_STRIPE_SECRET_KEY:

# Get prices for yearly product  
curl https://api.stripe.com/v1/prices?product=prod_TMGRM9BYQlb8nI \
  -u sk_live_YOUR_STRIPE_SECRET_KEY:
```

## What to Look For

- **Product ID:** Starts with `prod_...` (you have these ✅)
- **Price ID:** Starts with `price_...` (we need these ❌)

A product can have multiple prices (e.g., monthly recurring, yearly recurring, one-time).

## Example

If you see in the Stripe Dashboard:
- Product: `prod_TMF8fyztCmkcyN` (Monthly Plan)
  - Price: $20.00 / month
  - **Price ID:** `price_1ABC123xyz...` ← This is what we need!

## After Finding Price IDs

Once you have the Price IDs, add them to your environment variables:

```bash
NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_YEARLY=price_...
```

## Quick Check

If you're not sure which price ID to use:
- Monthly price should have `recurring.interval: "month"`
- Yearly price should have `recurring.interval: "year"`

