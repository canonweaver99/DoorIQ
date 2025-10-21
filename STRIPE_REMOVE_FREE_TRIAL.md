# Remove Free Trial from Stripe Checkout

## Issue
The Stripe checkout page shows "7-day free trial" language even though we've removed it from the app.

## Solution
The trial configuration is set in your Stripe Dashboard. Here's how to update it:

---

## Steps to Remove Free Trial

### Option 1: Update Existing Prices (Recommended)

1. **Go to Stripe Dashboard**
   - Navigate to: https://dashboard.stripe.com/products

2. **Find Your DoorIQ Products**
   - Look for your Individual Monthly and Individual Yearly products
   - Price IDs in your code:
     - Monthly: `price_1SIxYr1WkNBozaYxGzx9YffP`
     - Yearly: `price_1SIyLY1WkNBozaYxld3E6aWS`

3. **Edit Each Price**
   - Click on the product
   - Find the price in the pricing table
   - Click the "⋯" menu → **Edit price**

4. **Remove Trial Period**
   - Scroll to "Trial period"
   - Change from "7 days" to **"No trial"**
   - Click **Save**

5. **Update Checkout Settings**
   - Go to Settings → Billing → Subscriptions and emails
   - Under "Trial settings":
     - Disable "Allow trials on checkout"
     - Or ensure trial length is set to 0

---

### Option 2: Create New Prices Without Trial

If you can't edit the existing prices (already used):

1. **Create New Prices**
   - Go to Products → Select your DoorIQ product
   - Click **Add another price**
   - Set pricing ($20/month or $16/month for yearly)
   - **Important:** Under "Free trial" → Select **"No trial"**
   - Save the new price

2. **Update Your Code**
   Update `app/pricing/page.tsx`:
   ```typescript
   const STRIPE_PRICE_IDS = {
     individual_monthly: 'price_NEW_MONTHLY_ID_HERE',
     individual_yearly: 'price_NEW_YEARLY_ID_HERE'
   }
   ```

3. **Update Environment Variables**
   In `.env.local`:
   ```
   NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY=price_NEW_MONTHLY_ID_HERE
   NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_YEARLY=price_NEW_YEARLY_ID_HERE
   ```

---

### Option 3: Update Checkout Session API Call

Alternatively, you can override the trial in the checkout session creation:

Update `app/api/stripe/create-checkout-session/route.ts`:

```typescript
const session = await stripe.checkout.sessions.create({
  // ... existing params
  subscription_data: {
    trial_period_days: 0, // <-- Add this to disable trial
  },
})
```

---

## Verify the Change

### Test Checkout Flow
1. Log out of your app
2. Sign up with a new test email
3. Click "Purchase" on Individual plan
4. Check the Stripe checkout page
5. Should NOT show "7-day free trial"
6. Should show immediate charge

### What You Should See
- ✅ "Subscribe to Individual - $20/month"
- ✅ "Billed immediately"
- ❌ NO "7-day free trial" text

---

## Additional Stripe Customization

### Update Checkout Page Messages

In Stripe Dashboard:
1. Go to Settings → Branding
2. Update "Customer portal" settings
3. Customize messaging to match your no-trial model

### Email Templates

Update Stripe email templates to remove trial language:
1. Settings → Emails
2. Edit "Subscription confirmation" email
3. Remove any "trial" references
4. Customize to say "Welcome to DoorIQ Premium!"

---

## Important Notes

⚠️ **Existing Customers**
- If you change price settings, it won't affect existing subscriptions
- Only new signups will see the updated checkout

⚠️ **Test Mode vs Live Mode**
- Make sure to update prices in both Test and Live modes
- Your current price IDs appear to be from Test mode (start with `price_test_`)

⚠️ **Price IDs**
- Price IDs are immutable once created
- If you create new prices, update your code with the new IDs
- Keep old price IDs for existing customers

---

## Recommended Approach

**For fastest fix:** Use **Option 3** (update API call)
- No Stripe dashboard changes needed
- Works immediately
- Easy to toggle if needed later

**For cleanest solution:** Use **Option 1** (edit existing prices)
- Updates at the source
- Cleaner long-term
- Affects all future checkouts

**If prices are locked:** Use **Option 2** (create new prices)
- Most work but most flexible
- Gives you full control
- Can archive old trial-based prices

---

## After Making Changes

1. **Test in Test Mode** first
2. **Verify checkout page** shows no trial
3. **Complete a test purchase** to confirm
4. **Apply same changes to Live Mode** when ready
5. **Update production environment variables** if using Option 2

Let me know which option you'd like to use and I can help implement it!

