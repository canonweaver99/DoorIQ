# Stripe Sandbox/Test Environment Setup

## ✅ Provided Credentials

- **Public Key (Test)**: `pk_test_...` (Get from Stripe Dashboard)
- **Secret Key (Test)**: `sk_test_...` (Get from Stripe Dashboard)
- **Product ID**: `prod_TktmcXu5UY0IIz`
- **Price ID**: `price_1SnNyq1WkNBozaYxhlXfEjg2` ✅ (Matches config)

## Environment Variables Setup

Add these to your `.env.local` file:

```bash
# Stripe Test Mode Keys (Replace with your actual keys from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE

# Webhook Secret (get from Stripe CLI - see below)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Other required variables
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Webhook Setup for Local Testing

### Option 1: Stripe CLI (Recommended for Local Testing)

1. **Install Stripe CLI** (if not already installed):
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copy the webhook secret** from the output:
   ```
   > Ready! Your webhook signing secret is whsec_xxxxx
   ```

5. **Add to `.env.local`**:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

### Option 2: Stripe Dashboard (For Production Testing)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL: `https://your-domain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the "Signing secret" (starts with `whsec_`)
6. Add to environment variables

## Verify Configuration

### 1. Check Config File
The price ID in `lib/stripe/config.ts` should match:
```typescript
priceId: 'price_1SnNyq1WkNBozaYxhlXfEjg2' ✅
```

### 2. Test Stripe Connection
Create a test endpoint or check logs:
```bash
curl http://localhost:3000/api/debug/stripe
```

Should return:
```json
{
  "ok": true,
  "stripe": {
    "hasSecret": true,
    "hasPublishable": true
  }
}
```

## Quick Test Flow

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Start Stripe webhook listener** (in another terminal):
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. **Test checkout**:
   - Go to `http://localhost:3000/checkout`
   - Fill out the form
   - Use test card: `4242 4242 4242 4242`
   - Complete payment

4. **Verify webhook**:
   - Check terminal running `stripe listen` for events
   - Check server logs for webhook processing
   - Verify user account created in Supabase

## Test Cards

Use these cards in Stripe test mode:

| Card Number | Scenario |
|------------|----------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0025 0000 3155` | Requires 3D Secure |

**Expiry**: Any future date (e.g., `12/25`)  
**CVC**: Any 3 digits (e.g., `123`)  
**ZIP**: Any 5 digits (e.g., `12345`)

## Troubleshooting

### Webhook Not Receiving Events?
- Verify `stripe listen` is running
- Check webhook secret matches `.env.local`
- Verify endpoint URL is correct
- Check server logs for errors

### Payment Not Processing?
- Verify Stripe keys are correct
- Check you're using test mode keys (not live)
- Verify price ID matches Stripe dashboard
- Check browser console for errors

### User Not Created?
- Check webhook logs in terminal
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check server logs for errors
- Verify webhook processed successfully

## Next Steps

1. ✅ Add environment variables to `.env.local`
2. ⏳ Get webhook secret from Stripe CLI
3. ⏳ Test checkout flow
4. ⏳ Verify webhook processing
5. ⏳ Test user account creation
6. ⏳ Test password setup email

---

**Status**: Ready to test! All credentials verified. Just need webhook secret from Stripe CLI.

