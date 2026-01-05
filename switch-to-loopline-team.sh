#!/bin/bash

# Script to switch DoorIQ project to Loopline LLC team on Vercel
# Run this after authenticating with Vercel CLI

echo "🔗 Linking DoorIQ project to Loopline LLC team..."

# First, check if user is logged in
if ! npx vercel whoami &>/dev/null; then
  echo "❌ Not logged in to Vercel. Please run: npx vercel login"
  exit 1
fi

# Get current user/team info
echo "Current account:"
npx vercel whoami

# Link project to Loopline LLC team
echo ""
echo "Linking project to Loopline LLC team..."
npx vercel link --yes --scope loopline-llc

echo ""
echo "✅ Project linked! Next steps:"
echo "1. Push your changes: git push origin main"
echo "2. Deployments will now go to Loopline LLC team"
echo "3. Check your project at: https://vercel.com/loopline-llc/door-iq"

