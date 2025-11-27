# Production Environment Variables

## ⚠️ CRITICAL: Add These to Your Production Hosting Platform

All Stripe keys are now provided. Add these environment variables to your production hosting platform (Vercel, etc.):

## Required Environment Variables

### Stripe (LIVE MODE - All Keys Provided)
```bash
STRIPE_SECRET_KEY=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
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51SIuec1fQ6MPQdN0z094jDIGDCu5Rjco9VxowXBCJDpF3FDsMb8wTwfufjdllXXA7qDrzEczS027f1btZ47UkY3c003tM10jcA
STRIPE_WEBHOOK_SECRET=whsec_4P7O2Ppsvt1HFkzQOnaT55GPdtKSOQk3
```

### Stripe Price IDs (All Provided)
```bash
# Product IDs (for reference):
# Monthly: prod_TMF8fyztCmkcyN
# Yearly: prod_TMGRM9BYQlb8nI
NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY=price_1SPWeS1fQ6MPQdN07Vcg9JYI
NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_YEARLY=price_1SPXuN1fQ6MPQdN039yUK8du
```

### Supabase
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### OpenAI
```bash
OPENAI_API_KEY=sk-...
```

### ElevenLabs
```bash
ELEVEN_LABS_API_KEY=...
ELEVENLABS_WEBHOOK_SECRET=wsec_cf8425322a2a66795313c066e23dcb2c4366c21496dad0f57eeecd2d9302205a
```

### Email (Resend)
```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=DoorIQ <noreply@dooriq.ai>
```

### App URLs
```bash
NEXT_PUBLIC_SITE_URL=https://dooriq.ai
NEXT_PUBLIC_APP_URL=https://dooriq.ai
```

### reCAPTCHA (Optional)
```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
RECAPTCHA_SECRET_KEY=...
```

## How to Add to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add each variable above
4. Select **Production** environment for all variables
5. **Redeploy** your application after adding variables

## Verification Checklist

After adding all variables:
- [ ] All Stripe keys added (secret, publishable, webhook)
- [ ] Price IDs extracted and added
- [ ] Supabase keys added
- [ ] OpenAI key added
- [ ] ElevenLabs API key added
- [ ] ElevenLabs webhook secret added
- [ ] Resend API key added
- [ ] App URLs set to production domain
- [ ] Application redeployed

## Status

✅ **Stripe Keys:** All provided and ready
✅ **Webhook:** Configured at `https://dooriq.ai/api/stripe/webhook` with 7 events
⏳ **Price IDs:** Need to extract from Stripe Dashboard
⏳ **Other Keys:** Need to add to production environment

