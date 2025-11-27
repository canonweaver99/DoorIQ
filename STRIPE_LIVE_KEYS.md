# Stripe Live Keys Configuration

## ⚠️ SECURITY WARNING
**DO NOT COMMIT THIS FILE TO GIT!** This file contains sensitive API keys.

**IMPORTANT:** Add this file to `.gitignore`:
```bash
echo "STRIPE_LIVE_KEYS.md" >> .gitignore
```

These keys are provided for production deployment. Add them to your hosting platform's environment variables.

## Live Stripe Keys

### Secret Key (Server-side only)
```
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
```

**Set as:** `STRIPE_SECRET_KEY` in production environment

### Publishable Key (Client-side safe)
```
pk_live_51SIuec1fQ6MPQdN0z094jDIGDCu5Rjco9VxowXBCJDpF3FDsMb8wTwfufjdllXXA7qDrzEczS027f1btZ47UkY3c003tM10jcA
```

**Set as:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in production environment

### Webhook Secret (Server-side only)
```
whsec_4P7O2Ppsvt1HFkzQOnaT55GPdtKSOQk3
```

**Set as:** `STRIPE_WEBHOOK_SECRET` in production environment

## Next Steps

1. **Add to Production Environment:**
   - Go to your hosting platform (Vercel, etc.)
   - Navigate to Settings → Environment Variables
   - Add both keys above

2. **Webhook Secret (Already Configured):**
   - ✅ Webhook secret: `whsec_4P7O2Ppsvt1HFkzQOnaT55GPdtKSOQk3`
   - ✅ Webhook configured at: `https://dooriq.ai/api/stripe/webhook`
   - ✅ 7 events selected (see `STRIPE_WEBHOOK_EVENTS.md` for details)
   - **TODO:** Add `STRIPE_WEBHOOK_SECRET` to production environment variables

3. **Price IDs (All Provided):**
   - ✅ Monthly Product ID: `prod_TMF8fyztCmkcyN`
   - ✅ Monthly Price ID: `price_1SPWeS1fQ6MPQdN07Vcg9JYI`
   - ✅ Yearly Product ID: `prod_TMGRM9BYQlb8nI`
   - ✅ Yearly Price ID: `price_1SPXuN1fQ6MPQdN039yUK8du`
   - **TODO:** Add Price IDs to production environment variables:
     - `NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY=price_1SPWeS1fQ6MPQdN07Vcg9JYI`
     - `NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_YEARLY=price_1SPXuN1fQ6MPQdN039yUK8du`

## Payment Link
- Live Payment Link: `https://buy.stripe.com/28E7sDeNc1QSdD7g8T2go00`
- Product ID: `prod_TMF8fyztCmkcyN`

## Verification

After setting environment variables, verify:

1. Test checkout flow works
2. Check Stripe Dashboard for test transactions
3. Verify webhook events are received
4. Check that credits are granted after purchase

## Security Notes

- ✅ Secret key (`sk_live_...`) should NEVER be exposed client-side
- ✅ Only publishable key (`pk_live_...`) can be exposed via `NEXT_PUBLIC_*`
- ✅ Webhook secret should be server-side only
- ✅ All keys are currently in live mode (not test mode)

