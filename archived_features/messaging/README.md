# Messaging Feature Archive

This directory contains the archived messaging feature components and related files.

## Archived Files

### Pages
- `messages/page.tsx` - Rep messaging page (`/messages`)
- `manager-messages/page.tsx` - Manager messaging page (`/manager/messages`)

### Components
- `MessagingCenter.tsx` - Main messaging center component for managers
- `MessagesTab.tsx` - Messages tab component for dashboard

### Hooks
- `useUnreadMessages.ts` - Hook for tracking unread message counts

### Events
- `messageEvents.ts` - Event emitter for messaging events

### Scripts
- `create-team-alpha-sample-messages.js` - Script for creating sample messages

## Changes Made

1. Removed messaging tab from manager page (`app/manager/page.tsx`)
2. Removed MessagesTabContent from dashboard page (`app/dashboard/page.tsx`)
3. Removed messaging links from Header navigation (`components/navigation/Header.tsx`)
4. Removed useUnreadMessages hook usage from Header

## Database Migrations

The following database migrations related to messaging remain in the codebase for historical reference:
- `lib/supabase/migrations/20251009_create_messages_table.sql`
- `lib/supabase/migrations/20251009_add_message_text_column.sql`
- `lib/supabase/migrations/20251009_enable_realtime_messages.sql`
- `lib/supabase/migrations/20251009_fix_messages_table.sql`
- `lib/supabase/migrations/20251009_fix_message_column_name.sql`
- `lib/supabase/migrations/20251010_add_voice_attachments_pins.sql`
- `lib/supabase/migrations/20251010_create_group_chats.sql`
- `lib/supabase/migrations/20251015_add_avatar_to_conversations.sql`
- `lib/supabase/migrations/20251015_fix_messages_rls.sql`

These migrations are kept for database schema history but the feature is no longer active.

## Date Archived
December 2024

