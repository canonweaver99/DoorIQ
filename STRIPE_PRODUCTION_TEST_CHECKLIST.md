# Stripe Production Test Checklist

## Pre-Testing Setup

### Environment Variables
- [ ] `STRIPE_SECRET_KEY` - Set to production key (`sk_live_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` - Set to production webhook secret (`whsec_...`)
- [ ] `RESEND_API_KEY` - Configured for sending password setup emails
- [ ] `RESEND_FROM_EMAIL` - Set to `DoorIQ <notifications@dooriq.ai>`
- [ ] `NEXT_PUBLIC_SITE_URL` - Set to production URL (`https://dooriq.ai`)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Set to production Supabase URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Set to production service role key

### Stripe Dashboard Configuration
- [ ] Webhook endpoint configured: `https://dooriq.ai/api/stripe/webhook`
- [ ] Webhook events enabled:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- [ ] Test mode disabled (using live mode)
- [ ] Price IDs verified in `lib/stripe/config.ts` match Stripe dashboard

## Test Scenarios

### 1. Guest Checkout Flow (New User)
**Goal**: Test complete flow for a user who doesn't have an account yet

**Steps**:
1. Go to `/checkout` page
2. Fill out form:
   - Company Name: "Test Company"
   - Your Name: "Test User"
   - Work Email: `test+guest@example.com` (use unique email)
   - Phone: (optional)
   - Number of Reps: 5 (for Starter plan)
   - Plan: Starter
   - Billing: Monthly
3. Click "Continue to Payment"
4. Complete Stripe checkout with test card: `4242 4242 4242 4242`
5. Verify redirect to `/checkout/success`
6. Check email inbox for password setup email
7. Click password setup link
8. Set password
9. Log in with new credentials
10. Verify user can access dashboard

**Expected Results**:
- ✅ Checkout session created successfully
- ✅ Payment processed
- ✅ Webhook receives `checkout.session.completed`
- ✅ User account created in Supabase Auth
- ✅ User profile created in `users` table
- ✅ Organization created in `organizations` table
- ✅ User linked to organization as manager
- ✅ Subscription status set to "trialing"
- ✅ Password setup email sent
- ✅ User can log in after setting password
- ✅ User has access to their organization dashboard

### 2. Existing User Checkout Flow
**Goal**: Test flow when user email already exists

**Steps**:
1. Create a test user account first (via signup or admin)
2. Go to `/checkout` page
3. Use the same email as existing user
4. Complete checkout flow
5. Verify webhook handles existing user correctly

**Expected Results**:
- ✅ Webhook finds existing user by email
- ✅ Links existing user to new organization
- ✅ Updates user role to manager
- ✅ Creates organization
- ✅ Sends password setup email (if user hasn't set password)

### 3. Subscription Lifecycle Events
**Goal**: Test webhook handling of subscription events

**Test Cases**:
- [ ] `customer.subscription.created` - Sets trial status correctly
- [ ] `customer.subscription.updated` - Updates seat count, billing interval
- [ ] `invoice.payment_succeeded` - Updates subscription status to active
- [ ] `invoice.payment_failed` - Sets status to past_due
- [ ] `customer.subscription.deleted` - Handles cancellation

### 4. Error Handling
**Goal**: Verify graceful error handling

**Test Cases**:
- [ ] Missing metadata in checkout session
- [ ] Stripe API errors
- [ ] Supabase database errors
- [ ] Email sending failures (should not fail webhook)
- [ ] Duplicate organization creation attempts
- [ ] Invalid price IDs

### 5. Edge Cases
**Goal**: Test edge cases and boundary conditions

**Test Cases**:
- [ ] Minimum seat count (1 rep)
- [ ] Maximum seat count (500 reps)
- [ ] Plan tier boundaries (Starter: 1-20, Team: 21-100, Enterprise: 101-500)
- [ ] Annual vs Monthly billing
- [ ] Promo codes/coupons
- [ ] Multiple checkouts with same email
- [ ] Webhook retries (Stripe retries failed webhooks)

## Post-Payment Verification

### Database Checks
After successful checkout, verify in Supabase:

```sql
-- Check organization was created
SELECT * FROM organizations WHERE stripe_customer_id = 'cus_...';

-- Check user was created/linked
SELECT * FROM users WHERE email = 'test@example.com';

-- Check subscription status
SELECT subscription_status, trial_ends_at FROM users WHERE organization_id = '...';

-- Check seat limits
SELECT seat_limit, seats_used FROM organizations WHERE id = '...';
```

### Stripe Dashboard Checks
- [ ] Customer created with correct email
- [ ] Subscription created with correct plan
- [ ] Subscription status is "trialing"
- [ ] Trial period is 14 days
- [ ] Quantity matches number of reps
- [ ] Metadata includes all required fields

### Email Verification
- [ ] Password setup email received
- [ ] Email contains correct reset link
- [ ] Link redirects to `/auth/reset-password?setup=true`
- [ ] Email branding matches DoorIQ style

## Production Launch Checklist

### Before Launch
- [ ] All test scenarios pass
- [ ] Webhook endpoint is publicly accessible
- [ ] SSL certificate valid
- [ ] Error logging configured (Sentry, etc.)
- [ ] Monitoring alerts set up
- [ ] Support email configured (`support@dooriq.ai`)

### Launch Day
- [ ] Monitor webhook logs for first few transactions
- [ ] Verify emails are being sent
- [ ] Check Stripe dashboard for successful payments
- [ ] Monitor Supabase for user/organization creation
- [ ] Test customer support flow

### Post-Launch Monitoring
- [ ] Set up alerts for webhook failures
- [ ] Monitor payment success rate
- [ ] Track user activation rate (password setup completion)
- [ ] Monitor email delivery rates
- [ ] Review error logs daily for first week

## Common Issues & Solutions

### Issue: Webhook not receiving events
**Solution**: 
- Verify webhook URL is correct in Stripe dashboard
- Check webhook secret matches environment variable
- Verify SSL certificate is valid
- Check server logs for incoming requests

### Issue: User not created after checkout
**Solution**:
- Check webhook logs for errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check if email already exists (webhook should handle this)
- Verify metadata includes `user_email` and `user_name`

### Issue: Password setup email not sent
**Solution**:
- Verify `RESEND_API_KEY` is configured
- Check webhook logs for email sending errors
- Verify email address is valid
- Check Resend dashboard for delivery status

### Issue: Organization not created
**Solution**:
- Check webhook logs for database errors
- Verify `organization_name` in metadata
- Check for duplicate organization names
- Verify Supabase RLS policies allow creation

## Testing Commands

### Test Webhook Locally (using Stripe CLI)
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Trigger Test Events
```bash
# Test checkout completion
stripe trigger checkout.session.completed

# Test subscription created
stripe trigger customer.subscription.created
```

### Verify Webhook Secret
```bash
# Get webhook signing secret from Stripe CLI output
# Or from Stripe Dashboard > Webhooks > Your endpoint > Signing secret
```

## Support Contacts

- **Stripe Support**: https://support.stripe.com
- **Supabase Support**: https://supabase.com/support
- **Resend Support**: https://resend.com/support
- **Internal Support**: support@dooriq.ai

