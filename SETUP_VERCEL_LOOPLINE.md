# Setting Up DoorIQ on Loopline LLC Vercel Team

The project has been transferred to the Loopline LLC team. Follow these steps to complete the setup:

## 1. Link Local Project to Vercel (Required for CLI deployments)

Run these commands to link your local project:

```bash
# Login to Vercel (will open browser)
npx vercel login

# Link project to Loopline LLC team
npx vercel link --yes --scope loopline-llc

# When prompted:
# - Set up and deploy? → No (we'll do this manually)
# - Which scope? → Select "Loopline LLC"
# - Link to existing project? → Yes
# - What's the name of your project? → door-iq
```

## 2. Verify Environment Variables

Make sure all environment variables are set in the Vercel dashboard:

1. Go to: https://vercel.com/loopline-llc/door-iq/settings/environment-variables
2. Verify these are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY`
   - `OPENAI_API_KEY`
   - `ELEVENLABS_API_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - Any other required env vars

## 3. Verify GitHub Integration

1. Go to: https://vercel.com/loopline-llc/door-iq/settings/git
2. Ensure GitHub repo `canonweaver99/DoorIQ` is connected
3. Auto-deployments should be enabled for `main` branch

## 4. Test Deployment

After linking, test a deployment:

```bash
# Deploy to preview
npx vercel

# Or deploy to production
npx vercel --prod
```

## 5. Update Deployment Settings (Optional)

1. Go to: https://vercel.com/loopline-llc/door-iq/settings/general
2. Check:
   - Framework Preset: Next.js
   - Build Command: `npm run build` (or leave default)
   - Output Directory: `.next` (or leave default)
   - Install Command: `npm install` (or leave default)

## Notes

- All future deployments will now go to the Loopline LLC team (Pro plan)
- The project URL should remain: `door-iq-xi.vercel.app` (or your custom domain)
- GitHub pushes to `main` will auto-deploy to production
- You can use `npx vercel` for manual preview deployments

