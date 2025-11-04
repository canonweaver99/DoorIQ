# Stripe Billing Portal URL Clarification

## About the Billing Portal Link

If you see a link like: `https://billing.stripe.com/p/login/28E7sDeNc1QSdD7g8T2go00`

This is **NOT** the customer portal configuration link you need. This appears to be a login/access link, possibly related to your payment link configuration.

## How Your App Uses the Billing Portal

Your app **does NOT use direct links** to the billing portal. Instead, it works like this:

1. User clicks **"Manage Subscription"** button on `/billing` page
2. Your app calls `/api/stripe/create-portal-session`
3. This API creates a **portal session** using Stripe's API:
   ```typescript
   stripe.billingPortal.sessions.create({
     customer: customerId,
     return_url: `${origin}/billing`
   })
   ```
4. Stripe returns a **temporary session URL** that redirects the user
5. User is redirected to the Stripe Customer Portal
6. After managing subscription, user is returned to `/billing`

## What You Need to Configure

You need to configure the **Customer Portal settings** in Stripe Dashboard, not use a direct link:

1. Go to: **Stripe Dashboard (Live Mode)** → **Settings** → **Billing** → **Customer portal**
2. Click **"Activate test link"** (this activates the default configuration)
3. Configure:
   - Business information
   - Customer options (update payment, cancel, etc.)
   - Cancellation settings
4. Save

## Why This Matters

The portal session URL is **dynamically generated** for each customer. You can't hardcode a portal URL - it must be created via the API with the customer's ID.

## Testing the Portal

To test if the portal is configured correctly:

1. Make sure you have a customer with a subscription
2. Go to `/billing` in your app
3. Click **"Manage Subscription"** button
4. You should be redirected to Stripe's Customer Portal
5. If you see an error, check the portal configuration in Stripe Dashboard

## Common Issues

- **"Billing portal is not configured"**: Go to Stripe Dashboard and activate/configure the portal
- **"No customer found"**: User needs to complete a purchase first to get a `stripe_customer_id`
- **Portal link doesn't work**: Portal sessions are temporary and customer-specific - don't try to use direct links

---

**Bottom line:** Configure the portal settings in Stripe Dashboard, but access it programmatically through your app's API, not via direct links.

