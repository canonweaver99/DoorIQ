# Stripe Webhook Events Configuration

## Required Events for Webhook

When configuring your Stripe webhook endpoint in the Stripe Dashboard, select these **7 events**:

### 1. Checkout Events
- ✅ **`checkout.session.completed`** 
  - Triggered when a customer completes checkout
  - Grants credits and updates subscription status

### 2. Subscription Events
- ✅ **`customer.subscription.created`**
  - Triggered when a new subscription is created
  - Grants 50 monthly credits and updates user status

- ✅ **`customer.subscription.updated`**
  - Triggered when subscription changes (status, plan, etc.)
  - Updates credits and subscription status
  - Handles trial ending and cancellation scheduling

- ✅ **`customer.subscription.deleted`**
  - Triggered when subscription is canceled
  - Updates user status to 'canceled'

- ✅ **`customer.subscription.trial_will_end`**
  - Triggered 3 days before trial ends
  - Sends notification email to user

### 3. Invoice Events
- ✅ **`invoice.payment_succeeded`**
  - Triggered when payment is successful
  - Updates subscription status and last payment date
  - Sends confirmation email (if not first invoice)

- ✅ **`invoice.payment_failed`**
  - Triggered when payment fails
  - Updates subscription status to 'past_due'
  - Sends failure notification email

## How to Configure in Stripe Dashboard

1. Go to: **Stripe Dashboard → Developers → Webhooks**
2. Click **"Add endpoint"** (or edit existing)
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. In the "Events" section, switch to **"Selected events"** tab
5. Search and select each of the 7 events listed above
6. Click **"Add endpoint"** (or **"Save"**)
7. Copy the **"Signing secret"** (starts with `whsec_...`)
8. Add the signing secret to your environment variables as `STRIPE_WEBHOOK_SECRET`

## Quick Search Guide

In the Stripe Dashboard event selector, search for:
- `checkout.session.completed` → Under "Checkout" section
- `customer.subscription` → Will show all subscription events
- `invoice.payment` → Will show payment success/failure events

## What Each Event Does

| Event | Purpose | When It Fires |
|-------|---------|---------------|
| `checkout.session.completed` | Grant credits after purchase | User completes checkout |
| `customer.subscription.created` | Initialize subscription | New subscription created |
| `customer.subscription.updated` | Update subscription changes | Plan changes, status updates |
| `customer.subscription.deleted` | Handle cancellation | Subscription canceled |
| `customer.subscription.trial_will_end` | Send trial warning | 3 days before trial ends |
| `invoice.payment_succeeded` | Confirm payment | Successful payment |
| `invoice.payment_failed` | Handle payment failure | Payment fails |

## Verification

After configuring, test by:
1. Making a test purchase
2. Checking webhook logs in Stripe Dashboard
3. Verifying credits are granted in your app
4. Checking subscription status updates

## Important Notes

- ⚠️ **Live Mode:** Make sure you're configuring this in **Live Mode** (not Test Mode)
- ⚠️ **HTTPS Required:** Webhook endpoint must use HTTPS
- ⚠️ **Secret Required:** Always use the webhook signing secret to verify events
- ⚠️ **Metadata Required:** Events rely on `supabase_user_id` in subscription metadata

