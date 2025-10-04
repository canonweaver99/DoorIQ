#!/bin/bash
# Script to apply virtual earnings migration to Supabase database

echo "🚀 Applying virtual earnings migration..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo ""
  echo "Please set it using:"
  echo "  export DATABASE_URL='your-postgres-connection-string'"
  echo ""
  echo "You can find your connection string in:"
  echo "  Supabase Dashboard > Project Settings > Database > Connection String (URI)"
  echo ""
  exit 1
fi

# Apply the migration
echo "📝 Executing migration 011_add_virtual_earnings_to_live_sessions.sql..."
psql "$DATABASE_URL" -f lib/supabase/migrations/011_add_virtual_earnings_to_live_sessions.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration applied successfully!"
  echo ""
  echo "Next steps:"
  echo "  1. Restart your Next.js dev server (if running)"
  echo "  2. Test by completing a practice session with a price quote"
  echo "  3. Check the leaderboard to see your virtual earnings"
  echo ""
else
  echo ""
  echo "❌ Migration failed!"
  echo "Please check the error message above and try again."
  echo ""
  exit 1
fi
