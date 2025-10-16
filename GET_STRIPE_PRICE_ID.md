# 🔑 Get Your Stripe Price ID

## Step 1: Go to Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/products
2. Find your "Individual Plan" product (the one for $20/month)
3. Click on it

## Step 2: Copy the Price ID

On the product page, you'll see the price details:
- Look for "API ID" or "Price ID"
- It starts with `price_` (e.g., `price_1AbCdEfGhIjKlMn`)
- **Copy this ID**

## Step 3: Add to .env.local

Open your `.env.local` file and add:

```bash
NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY=price_YOUR_ID_HERE
```

Replace `price_YOUR_ID_HERE` with the actual Price ID you copied.

## Step 4: Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## Why This Fixes It

- Payment Links have **fixed** redirect URLs (set in Stripe Dashboard)
- Checkout Sessions have **dynamic** redirect URLs (set in code)
- For local development, Checkout Sessions work better!

## Alternative: Update Payment Link Return URL

If you prefer to keep using the payment link:
1. Go to: https://dashboard.stripe.com/test/payment-links
2. Find your Individual plan payment link
3. Click "Edit"
4. Set "After payment" URL to: `http://localhost:3000/pricing?success=true`
5. Save

But using the Price ID is better for development! ✅
