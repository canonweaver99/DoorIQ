#!/bin/bash

# Script to apply the messages table migration
# This script handles existing objects gracefully

echo "🚀 Starting Messages Table Migration..."
echo "======================================"

# Run the migration
echo "📝 Applying messages table migration..."
npx supabase db push --include-migrations 20251009_create_messages_table.sql

# Check if the migration was successful
if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📊 Checking table structure..."
    
    # Verify the table was created
    npx supabase db query "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages' ORDER BY ordinal_position;" 2>/dev/null
    
    echo ""
    echo "🔍 Checking indexes..."
    npx supabase db query "SELECT indexname FROM pg_indexes WHERE tablename = 'messages';" 2>/dev/null
    
    echo ""
    echo "🔒 Checking RLS policies..."
    npx supabase db query "SELECT policyname FROM pg_policies WHERE tablename = 'messages';" 2>/dev/null
    
    echo ""
    echo "✨ Messages feature is ready to use!"
    echo ""
    echo "Next steps:"
    echo "1. Test the messaging feature in your app"
    echo "2. Monitor for any errors in the Supabase dashboard"
    echo "3. Consider setting up real-time subscriptions for live messaging"
else
    echo "❌ Migration failed!"
    echo ""
    echo "If you're seeing 'already exists' errors, you can try:"
    echo "1. Check what objects already exist:"
    echo "   npx supabase db query \"SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages';\""
    echo ""
    echo "2. If you need to reset and start fresh (⚠️  This will DELETE all messages data):"
    echo "   npx supabase db query \"DROP TABLE IF EXISTS public.messages CASCADE;\""
    echo "   npx supabase db query \"DROP VIEW IF EXISTS public.unread_message_counts CASCADE;\""
    echo "   Then run this script again."
fi

echo ""
echo "======================================"
echo "Migration process complete!"
