#!/bin/bash
set -e

echo "Applying group chats migration..."

# Apply the migration
npx supabase db push lib/supabase/migrations/20251010_create_group_chats.sql

echo "✓ Group chats migration applied successfully!"
echo ""
echo "Next steps:"
echo "1. The groups and group_members tables have been created"
echo "2. The messages table has been updated to support group messages"
echo "3. RLS policies have been configured for group access control"
echo "4. Real-time has been enabled for groups and group_members"
