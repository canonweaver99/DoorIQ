# Stripe Quick Test Guide

## Quick Test Flow (5 minutes)

### 1. Test Guest Checkout
1. Go to `http://localhost:3000/checkout` (or production URL)
2. Fill form:
   - Company: "Test Co"
   - Name: "Test User"
   - Email: `test+${Date.now()}@example.com` (unique email)
   - Reps: 5
   - Plan: Starter
   - Billing: Monthly
3. Click "Continue to Payment"
4. Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
5. Complete checkout
6. **Verify**:
   - ✅ Redirects to `/checkout/success`
   - ✅ Success page shows order details
   - ✅ Check email for password setup link
   - ✅ Click link and set password
   - ✅ Can log in with new credentials

### 2. Verify Webhook Processing
Check server logs for:
```
✅ Team plan checkout completed: Organization {id} created with {seats} seats
✅ Created new auth user: {userId}
✅ Password setup email sent to: {email}
```

### 3. Verify Database
Run in Supabase SQL editor:
```sql
-- Check latest organization
SELECT * FROM organizations 
ORDER BY created_at DESC 
LIMIT 1;

-- Check user was created
SELECT id, email, full_name, role, organization_id, subscription_status 
FROM users 
WHERE email = 'test+{timestamp}@example.com';

-- Verify subscription status
SELECT subscription_status, trial_ends_at 
FROM users 
WHERE organization_id = '{org_id}';
```

## Common Test Cards (Stripe Test Mode)

### Success Cards
- `4242 4242 4242 4242` - Standard Visa
- `5555 5555 5555 4444` - Standard Mastercard
- `3782 822463 10005` - American Express

### Decline Cards
- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 9995` - Insufficient funds

### 3D Secure
- `4000 0025 0000 3155` - Requires authentication

## Test Webhook Locally

### Using Stripe CLI
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# In another terminal, trigger test events
stripe trigger checkout.session.completed
```

### Get Webhook Secret
After running `stripe listen`, copy the webhook signing secret:
```
> Ready! Your webhook signing secret is whsec_xxxxx
```

Add to `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

## Production Testing Checklist

Before going live, test:
- [ ] Guest checkout creates user account
- [ ] Password setup email is sent
- [ ] User can log in after setting password
- [ ] Organization is created correctly
- [ ] Subscription status is "trialing"
- [ ] Trial period is 14 days
- [ ] Seat limits match rep count
- [ ] Webhook processes all events
- [ ] Error handling works gracefully
- [ ] Success page displays correctly

## Debugging Tips

### Webhook Not Firing?
1. Check Stripe Dashboard > Webhooks > Your endpoint
2. Verify endpoint URL is correct
3. Check webhook secret matches environment variable
4. Look for errors in Stripe Dashboard webhook logs

### User Not Created?
1. Check webhook logs for errors
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
3. Check if email already exists
4. Verify metadata includes `user_email` and `user_name`

### Email Not Sent?
1. Verify `RESEND_API_KEY` is configured
2. Check webhook logs for email errors
3. Verify email address is valid
4. Check Resend dashboard for delivery status

### Organization Not Created?
1. Check webhook logs for database errors
2. Verify `organization_name` in metadata
3. Check for duplicate organization names
4. Verify Supabase RLS policies

## Quick Commands

```bash
# Check environment variables
echo $STRIPE_SECRET_KEY | cut -c1-10
echo $STRIPE_WEBHOOK_SECRET | cut -c1-10
echo $RESEND_API_KEY | cut -c1-10

# View recent webhook logs
# (Check your deployment platform logs or Stripe Dashboard)

# Test API endpoint
curl -X POST http://localhost:3000/api/checkout/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test",
    "yourName": "Test User",
    "workEmail": "test@example.com",
    "numberOfReps": 5,
    "plan": "starter",
    "billingPeriod": "monthly"
  }'
```

## Support

- **Stripe Dashboard**: https://dashboard.stripe.com
- **Stripe Webhooks**: https://dashboard.stripe.com/webhooks
- **Supabase Dashboard**: https://app.supabase.com
- **Resend Dashboard**: https://resend.com/emails

