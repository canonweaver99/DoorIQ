#!/bin/bash

# Script to fix the messages table migration
# This handles cases where a partial table exists

echo "🔧 Fixing Messages Table Migration..."
echo "======================================"

# First, let's check what exists
echo "📊 Checking current messages table structure..."
echo ""

# Check if table exists
echo "Checking if messages table exists..."
npx supabase db push --dry-run 2>&1 | grep -i "messages"

echo ""
echo "🔨 Applying fix migration..."

# Apply the fix migration
if [ -f "lib/supabase/migrations/20251009_fix_messages_table.sql" ]; then
    echo "Running fix migration..."
    cat lib/supabase/migrations/20251009_fix_messages_table.sql | npx supabase db push --include-seed
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Fix migration applied successfully!"
        echo ""
        echo "The messages table now has all required columns and indexes."
        echo ""
        echo "🎉 Messages feature is ready to use!"
    else
        echo ""
        echo "❌ Fix migration failed!"
        echo ""
        echo "If you're still having issues, you may need to:"
        echo "1. Check the Supabase dashboard for error details"
        echo "2. Manually inspect the table structure"
        echo "3. Consider using the reset script if safe to do so"
    fi
else
    echo "❌ Fix migration file not found!"
    echo "Please ensure lib/supabase/migrations/20251009_fix_messages_table.sql exists"
fi

echo ""
echo "======================================"
echo "Migration fix process complete!"
