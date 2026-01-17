# Add These Keys to Vercel Environment Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these 3 variables (set Environment to **Production**):

## 1. Stripe Secret Key
```
STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY
```
(Get from Stripe Dashboard → Developers → API keys → Secret key)

## 2. Stripe Publishable Key
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY
```
(Get from Stripe Dashboard → Developers → API keys → Publishable key)

## 3. Stripe Webhook Secret
```
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET
```
(Get from Stripe Dashboard → Developers → Webhooks → Your endpoint → Signing secret)

## After Adding:

1. ✅ **Redeploy** your application
2. ✅ **Verify** webhook endpoint in Stripe Dashboard: `https://dooriq.ai/api/stripe/webhook`
3. ✅ **Test** a signup to confirm trial works

## ⚠️ Important:

- Set Environment to **Production** (not Preview/Development)
- Make sure webhook endpoint matches your domain
- Redeploy after adding variables

