#!/bin/bash

# Script to completely reset the messages table
# ⚠️  WARNING: This will DELETE all messages data!

echo "⚠️  WARNING: This will DELETE all messages data!"
echo "==========================================="
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Operation cancelled."
    exit 0
fi

echo ""
echo "🧹 Cleaning up existing messages objects..."

# Drop existing objects
echo "Dropping messages table and related objects..."
npx supabase db query "DROP TABLE IF EXISTS public.messages CASCADE;"
npx supabase db query "DROP VIEW IF EXISTS public.unread_message_counts CASCADE;"
npx supabase db query "DROP FUNCTION IF EXISTS get_conversation_history(UUID, UUID) CASCADE;"
npx supabase db query "DROP FUNCTION IF EXISTS get_latest_conversations(UUID) CASCADE;"
npx supabase db query "DROP FUNCTION IF EXISTS update_user_last_seen() CASCADE;"

echo ""
echo "✅ Clean-up complete!"
echo ""
echo "You can now run the migration again:"
echo "./scripts/apply-messages-migration.sh"
