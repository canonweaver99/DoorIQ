# Stripe Billing Portal Setup Guide

## Overview
The Stripe Customer Portal allows users to manage their subscriptions, update payment methods, and view billing history. This guide explains how to configure it.

## Error Message
If you see: "No configuration provided and your test mode default configuration has not been created"

This means the Stripe Billing Portal needs to be configured in your Stripe Dashboard.

## Setup Steps

### 1. Configure Test Mode Portal

1. Go to [Stripe Dashboard - Billing Portal Settings (Test Mode)](https://dashboard.stripe.com/test/settings/billing/portal)
2. Click **"Activate test link"** if not already activated
3. Configure the following settings:

#### Business Information
- **Business Name**: Your company name (e.g., "DoorIQ")
- **Support Email**: Your support email address
- **Support Phone** (optional): Your support phone number

#### Customer Options
Enable the features customers can use:
- ✅ **Update payment method** - Allow customers to update their card
- ✅ **Cancel subscription** - Allow customers to cancel (with optional cancellation survey)
- ✅ **Update billing address** - Allow customers to update their address
- ✅ **View invoices** - Allow customers to view and download invoices
- ✅ **Pause subscription** (optional) - Allow customers to temporarily pause

#### Cancellation Settings
- **Cancellation behavior**: Choose what happens when customers cancel
  - Immediate cancellation
  - Cancel at end of billing period
  - Custom cancellation flow
- **Cancellation survey** (optional): Add questions to understand why customers cancel

#### Branding (Optional)
- Upload your logo
- Customize colors to match your brand

### 2. Save Configuration

1. Click **"Save"** at the bottom of the page
2. This creates the default test mode configuration

### 3. Configure Live Mode Portal (Production)

When ready for production:

1. Switch to **Live Mode** in Stripe Dashboard
2. Go to [Stripe Dashboard - Billing Portal Settings (Live Mode)](https://dashboard.stripe.com/settings/billing/portal)
3. Click **"Activate test link"** (for live mode - Stripe uses "test link" terminology for the default configuration)
4. Repeat the same configuration steps as test mode
5. Save the configuration

**Note:** The billing portal is accessed programmatically via your app's "Manage Subscription" button. Users don't need a direct link - the portal session is created automatically when they click the button.

### 4. Verify Configuration

After saving, test the portal:

1. Ensure you have a test customer with a subscription
2. Go to `/billing` in your app
3. Click "Manage Subscription"
4. You should be redirected to the Stripe Customer Portal

## Troubleshooting

### Error: "No customer found"
- Ensure the user has a `stripe_customer_id` in the database
- This ID is created when a user completes checkout

### Error: "Billing portal is not configured"
- Follow steps 1-2 above to configure the portal
- Make sure you're in the correct mode (test vs. live)

### Portal Not Loading
- Check that your Stripe API keys are correct
- Verify the customer ID exists in Stripe
- Check browser console for additional errors

## Code Integration

The portal is accessed via:
- **Route**: `/api/stripe/create-portal-session`
- **Component**: `app/billing/page.tsx` - "Manage Subscription" button
- **Error Handling**: Improved in `app/api/stripe/create-portal-session/route.ts`

## Additional Resources

- [Stripe Billing Portal Documentation](https://stripe.com/docs/customer-management/portal)
- [Stripe Dashboard - Billing Portal](https://dashboard.stripe.com/test/settings/billing/portal)

