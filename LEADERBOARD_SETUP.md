# Leaderboard Setup & Real-Time Updates

## Overview

The DoorIQ leaderboard displays sales reps ranked by their virtual earnings, with **real-time updates** as users complete training sessions and earn money. The system uses Supabase Realtime to push updates to all connected clients automatically.

## How It Works

### 1. **Earning Virtual Money**
When a user completes a training session:
1. The session transcript is analyzed by OpenAI (GPT-4)
2. If the rep closed a sale (quoted price + got agreement), they earn virtual money
3. The grading API updates `live_sessions.virtual_earnings`
4. A database trigger automatically adds this to `users.virtual_earnings`

### 2. **Real-Time Leaderboard Updates**
The leaderboard page subscribes to changes in the `users` table:
- When any rep's earnings change, all connected clients receive a notification
- The leaderboard automatically refreshes without page reload
- Users see their rank update in real-time

### 3. **Additional Features**
- **Manual Refresh Button**: Force refresh the leaderboard data
- **Auto-Refresh on Focus**: Updates when user returns to the tab
- **Timeframe Filters**: View rankings by week, month, or all-time
- **Live Indicator**: Shows the leaderboard is connected and updating

## Setup Instructions

### Step 1: Run Database Migrations

Apply the required migrations in order:

```bash
# 1. Add virtual_earnings to live_sessions (if not already applied)
psql $DATABASE_URL -f lib/supabase/migrations/011_add_virtual_earnings_to_live_sessions.sql

# 2. Enable realtime for leaderboard
psql $DATABASE_URL -f lib/supabase/migrations/027_enable_realtime_for_leaderboard.sql
```

Or run them in the Supabase Dashboard SQL Editor.

### Step 2: Enable Realtime in Supabase Dashboard

**Important:** You must enable realtime replication for the `users` table:

1. Go to **Supabase Dashboard** → **Database** → **Replication**
2. Find the `supabase_realtime` publication
3. Click **Add Tables** and select `users`
4. Click **Save**

Alternatively, run this SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE users;
```

### Step 3: Verify Environment Variables

Ensure these are set in your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
```

### Step 4: Test the System

Run the test script to verify everything works:

```bash
node scripts/test-leaderboard-updates.js
```

This will:
- Create a test session with virtual earnings
- Verify the database trigger updates user totals
- Display the current leaderboard rankings

## Testing Real-Time Updates

### Manual Test (Best for verification)

1. **Open two browser windows:**
   - Window A: Leaderboard page (`/leaderboard`)
   - Window B: Trainer page (`/trainer`)

2. **In Window B:**
   - Start a training session
   - Have a conversation that closes a sale
   - Example: Quote "$99" and get homeowner to agree
   - End the session and wait for grading

3. **In Window A:**
   - Watch the leaderboard automatically update
   - The rep's earnings should increase without refreshing
   - The "Live" indicator stays green

### Automated Test

```bash
# Run the test script
node scripts/test-leaderboard-updates.js

# While it's running, keep the leaderboard page open
# You should see the rankings update in real-time
```

## Architecture

### Database Trigger Flow

```
live_sessions.virtual_earnings updated
         ↓
Trigger: update_user_earnings_from_live_sessions_trigger
         ↓
users.virtual_earnings updated
         ↓
Supabase Realtime broadcasts change
         ↓
Leaderboard page receives update
         ↓
Leaderboard refreshes data automatically
```

### Frontend Flow

```typescript
// Leaderboard subscribes to changes
supabase
  .channel('leaderboard-changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'users',
    filter: 'role=eq.rep'
  }, (payload) => {
    // Refresh leaderboard data
    fetchLeaderboard(true)
  })
  .subscribe()
```

## Features

### 🔄 Real-Time Updates
- Automatic refresh when any user's earnings change
- No page reload required
- All connected clients update simultaneously

### 🔴 Live Indicator
- Green pulsing dot shows realtime connection is active
- "Last updated" timestamp shows freshness of data

### 🔄 Manual Refresh
- Click the refresh icon to force update
- Button shows spinning animation while loading
- Useful if connection is lost or data seems stale

### 👁️ Auto-Refresh on Focus
- Automatically refreshes when you return to the tab
- Ensures data is always current when viewing

### ⏰ Timeframe Filters
- **This Week**: Rankings based on last 7 days of sessions
- **This Month**: Rankings based on last 30 days
- **All Time**: Total earnings across all sessions

### 🏆 Top 3 Podium
- Special visual display for top 3 performers
- Gold, silver, bronze styling
- Larger cards for emphasis

### 👤 User Highlighting
- Your own rank is highlighted in purple
- "(You)" indicator next to your name
- Easy to find yourself in the list

## Troubleshooting

### Leaderboard Not Updating in Real-Time

**Check 1: Realtime is Enabled**
```sql
-- Verify the users table is in the publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

**Check 2: Browser Console**
- Open DevTools → Console
- Look for messages like: `💰 User earnings updated:`
- If you don't see these, realtime isn't working

**Check 3: Database Trigger**
```sql
-- Verify the trigger exists
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'update_user_earnings_from_live_sessions_trigger';
```

**Fix:** Re-run migration 011 and 027:
```bash
psql $DATABASE_URL -f lib/supabase/migrations/011_add_virtual_earnings_to_live_sessions.sql
psql $DATABASE_URL -f lib/supabase/migrations/027_enable_realtime_for_leaderboard.sql
```

### Earnings Not Adding to User Total

**Check:** Verify the trigger is working:
```sql
-- Test the trigger manually
UPDATE live_sessions 
SET virtual_earnings = 50.00, ended_at = NOW() 
WHERE id = 'some-session-id';

-- Then check user earnings
SELECT full_name, virtual_earnings 
FROM users 
WHERE id = 'user-id-from-session';
```

If earnings didn't increase, the trigger isn't firing. Check:
1. Session has `ended_at` set (required for trigger)
2. Session has `virtual_earnings > 0`
3. Session is linked to a valid `user_id`

### Manual Refresh Button Not Working

**Check:** Browser console for errors
```javascript
// In DevTools Console, test manually:
await supabase
  .from('users')
  .select('*')
  .eq('role', 'rep')
  .order('virtual_earnings', { ascending: false })
```

If this fails, check:
1. Environment variables are set correctly
2. User has permission to read users table (RLS policy)
3. Network tab shows the request completing

## API Reference

### Database Functions

#### `update_user_virtual_earnings_from_live_sessions()`
Trigger function that runs when `live_sessions` is updated.

**Behavior:**
- Only runs when `virtual_earnings > 0` AND `ended_at IS NOT NULL`
- Adds session earnings to user's total
- Handles both INSERT and UPDATE operations
- Prevents negative balances with `GREATEST(0, ...)`

**Example:**
```sql
-- This will trigger the function and update user earnings
UPDATE live_sessions 
SET virtual_earnings = 99.00, ended_at = NOW() 
WHERE id = '...';
```

### Frontend Components

#### `LeaderboardPage`
Location: `/app/leaderboard/page.tsx`

**Key Features:**
- Real-time subscription to user changes
- Manual refresh button
- Auto-refresh on visibility change
- Timeframe filtering
- Responsive design

**State Variables:**
- `leaderboard`: Array of ranked users
- `loading`: Initial load state
- `refreshing`: Manual refresh state
- `timeframe`: Selected time period
- `lastUpdated`: Timestamp of last refresh

## Performance Considerations

### Realtime Connections
- Each browser tab creates one Realtime connection
- Supabase has a limit on concurrent connections (varies by plan)
- For large teams (100+ users), consider implementing connection pooling

### Query Optimization
- The leaderboard queries are indexed for performance
- Session stats are fetched in parallel for each user
- Consider caching for very large organizations (1000+ users)

### Trigger Performance
- The earnings trigger runs on every session update
- Uses efficient SQL operations (no loops or subqueries)
- Typical execution time: < 5ms

## Future Enhancements

Potential improvements to consider:

1. **Historical Rank Tracking**
   - Store daily snapshots of rankings
   - Show rank changes with up/down arrows
   - Display "Previous Rank" column

2. **Team-Based Leaderboards**
   - Filter by team when teams feature is added
   - Compare teams against each other
   - Team-wide earnings totals

3. **Achievement Badges**
   - Award badges for milestones (first $1000, etc.)
   - Display badges on leaderboard
   - Notification when earning badges

4. **Earnings History Chart**
   - Line chart showing earnings over time
   - Compare yourself to top performers
   - Daily/weekly/monthly views

5. **Push Notifications**
   - Notify users when they move up in rank
   - Alert when someone passes them
   - Daily ranking summary

## Related Documentation

- [Virtual Money Implementation](./VIRTUAL_MONEY_IMPLEMENTATION.md) - How earnings are calculated
- [Grading System](./GRADING_SYSTEM_V3.md) - How sessions are scored
- [Database Schema](./lib/supabase/schema.sql) - Full database structure
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime) - Official realtime guide

## Support

If you encounter issues:

1. Check the browser console for errors
2. Review the troubleshooting section above
3. Run the test script to verify setup
4. Check Supabase logs in the dashboard
5. Verify all migrations have been applied

For additional help, review the logs or contact the development team.
