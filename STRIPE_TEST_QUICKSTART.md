# Stripe Test Environment - Quick Start

## ✅ Credentials Verified

- **Price ID**: `price_1SnNyq1WkNBozaYxhlXfEjg2` ✅ (Matches config)
- **Product ID**: `prod_TktmcXu5UY0IIz`
- **Public Key**: `pk_test_51SIuf41WkNBozaYx...`
- **Secret Key**: `sk_test_51SIuf41WkNBozaYx...`

## 🚀 Quick Setup (2 minutes)

### 1. Add Environment Variables

**Option A: Use the setup script**
```bash
bash SETUP_ENV_LOCAL.sh
```

**Option B: Manual setup**
Add to `.env.local`:
```bash
# Get these from Stripe Dashboard (Test Mode)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Get from Stripe CLI (see step 2)
```

### 2. Get Webhook Secret

**Terminal 1**: Start webhook listener
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook secret that appears (starts with `whsec_`), then update `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### 3. Start Dev Server

**Terminal 2**: Start your app
```bash
npm run dev
```

### 4. Test Checkout

1. Visit: `http://localhost:3000/checkout`
2. Fill out form:
   - Company: "Test Co"
   - Name: "Test User"
   - Email: `test@example.com`
   - Reps: 5
   - Plan: Starter
3. Click "Continue to Payment"
4. Use test card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - ZIP: `12345`
5. Complete payment

### 5. Verify

✅ Check Terminal 1 (Stripe CLI) - Should show webhook events  
✅ Check Terminal 2 (Server) - Should show webhook processing logs  
✅ Check email - Should receive password setup email  
✅ Check Supabase - User and organization should be created  

## 🧪 Test Cards

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Declined |
| `4000 0000 0000 9995` | ❌ Insufficient funds |

## 📋 Checklist

- [ ] Environment variables added to `.env.local`
- [ ] Webhook secret obtained from Stripe CLI
- [ ] `stripe listen` running in terminal
- [ ] Dev server running (`npm run dev`)
- [ ] Tested checkout flow
- [ ] Verified webhook events received
- [ ] Verified user account created
- [ ] Verified password setup email sent

## 🐛 Troubleshooting

**Webhook not working?**
- Make sure `stripe listen` is running
- Verify webhook secret matches `.env.local`
- Check server logs for errors

**Payment not processing?**
- Verify Stripe keys are correct
- Check browser console for errors
- Verify price ID matches config

**User not created?**
- Check webhook logs in terminal
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check server logs for database errors

## 📚 More Info

- Full setup guide: `STRIPE_SANDBOX_SETUP.md`
- Production test checklist: `STRIPE_PRODUCTION_TEST_CHECKLIST.md`
- Quick test guide: `STRIPE_QUICK_TEST_GUIDE.md`

---

**Ready to test!** 🚀

