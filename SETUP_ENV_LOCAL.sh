#!/bin/bash

# Quick setup script for Stripe sandbox environment variables
# Run: bash SETUP_ENV_LOCAL.sh

echo "🔧 Setting up Stripe Sandbox Environment Variables"
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists. Backing up to .env.local.backup"
    cp .env.local .env.local.backup
fi

# Add Stripe test keys
echo "" >> .env.local
echo "# Stripe Test Mode Keys (Sandbox)" >> .env.local
echo "STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE" >> .env.local
echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE" >> .env.local
echo "" >> .env.local
echo "# Webhook Secret - Get from: stripe listen --forward-to localhost:3000/api/stripe/webhook" >> .env.local
echo "STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE" >> .env.local
echo "" >> .env.local

echo "✅ Stripe keys added to .env.local"
echo ""
echo "📝 Next steps:"
echo "1. Get webhook secret by running: stripe listen --forward-to localhost:3000/api/stripe/webhook"
echo "2. Copy the 'whsec_xxxxx' value and update STRIPE_WEBHOOK_SECRET in .env.local"
echo "3. Make sure other required env vars are set (Supabase, Resend, etc.)"
echo ""
echo "🧪 Test the setup:"
echo "   npm run dev"
echo "   Then visit: http://localhost:3000/checkout"

