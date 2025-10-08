#!/bin/bash

# Apply RLS Fix Migration Script
# This fixes the Row Level Security policies on the users table

echo "🔒 Applying RLS Fix Migration..."
echo "This will fix Row Level Security policies on the users table"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create a .env file with your DIRECT_SUPABASE_URL"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if DIRECT_SUPABASE_URL is set
if [ -z "$DIRECT_SUPABASE_URL" ]; then
    echo "❌ Error: DIRECT_SUPABASE_URL not found in .env"
    echo "Please add: DIRECT_SUPABASE_URL=postgresql://postgres:[password]@[host]:[port]/postgres"
    exit 1
fi

echo "🔍 Fixing RLS policies on users table..."
echo ""

# Apply the migration
psql "$DIRECT_SUPABASE_URL" -f lib/supabase/migrations/029_fix_users_table_rls.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "What's fixed:"
    echo "1. Users can now read their own data by ID"
    echo "2. Users can read their own data by email (Google login fallback)"
    echo "3. Managers can read all team member data"
    echo "4. RLS policies properly configured"
    echo ""
    echo "Next steps:"
    echo "1. Refresh your browser"
    echo "2. Sign out and sign in again"
    echo "3. Your earnings and manager role should now appear"
else
    echo ""
    echo "❌ Migration failed!"
    echo "Please check your database connection and try again."
    exit 1
fi

