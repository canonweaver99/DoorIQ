# 🏆 Leaderboard Quick Start

Get your leaderboard up and running in 5 minutes!

## Prerequisites

- Supabase project set up
- Environment variables configured
- At least one user with `role = 'rep'`

## Setup Steps

### 1. Apply Database Migrations (2 minutes)

Go to your Supabase Dashboard → SQL Editor and run:

```sql
-- Migration 1: Add virtual earnings trigger
-- Copy contents from: lib/supabase/migrations/011_add_virtual_earnings_to_live_sessions.sql

-- Migration 2: Enable realtime
-- Copy contents from: lib/supabase/migrations/027_enable_realtime_for_leaderboard.sql
```

### 2. Enable Realtime (1 minute)

In Supabase Dashboard:
1. Go to **Database** → **Replication**
2. Find `supabase_realtime` publication
3. Click **Add Tables**
4. Select `users` table
5. Click **Save**

Or run this SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE users;
```

### 3. Test It Works (2 minutes)

```bash
# Install dependencies (if needed)
npm install

# Run test script
node scripts/test-leaderboard-updates.js
```

Expected output:
```
✅ Found user: John Doe
✅ Created session
✅ Awarded $99.00 to session
✅ Earnings updated correctly!
📊 Top 5 Leaderboard:
   1. John Doe - $99.00 👈 (test user)
```

## Verify Real-Time Updates

### Option A: Two Browser Windows (Recommended)

1. **Window 1:** Open `/leaderboard`
2. **Window 2:** Open `/trainer`
3. Complete a session in Window 2 (close a sale)
4. Watch Window 1 update automatically! ⚡

### Option B: Run Test Script While Viewing

1. Open `/leaderboard` in browser
2. Run: `node scripts/test-leaderboard-updates.js`
3. Watch leaderboard update in real-time

## Features You Get

✅ **Real-time updates** - No refresh needed
✅ **Manual refresh button** - Force update anytime
✅ **Live indicator** - Shows connection status
✅ **Auto-refresh on focus** - Updates when you return to tab
✅ **Timeframe filters** - Week, Month, All-time
✅ **Top 3 podium** - Special display for winners
✅ **User highlighting** - Your rank highlighted in purple

## Common Issues

### "No rep users found"
**Fix:** Create a user with `role = 'rep'`:
```sql
INSERT INTO users (full_name, email, rep_id, role, virtual_earnings)
VALUES ('Test User', 'test@example.com', 'REP001', 'rep', 0);
```

### "Earnings not updating"
**Fix:** Check trigger exists:
```sql
SELECT tgname FROM pg_trigger 
WHERE tgname = 'update_user_earnings_from_live_sessions_trigger';
```
If empty, re-run migration 011.

### "Leaderboard not updating in real-time"
**Fix:** Verify realtime is enabled:
```sql
SELECT tablename FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'users';
```
Should return one row. If not, enable it in Step 2 above.

## Next Steps

- Complete real training sessions to earn money
- Compete with your team for top rankings
- Try different timeframe filters
- Monitor the live updates

## Need Help?

See the full documentation: [LEADERBOARD_SETUP.md](./LEADERBOARD_SETUP.md)

## Testing Script Commands

```bash
# Test leaderboard updates
node scripts/test-leaderboard-updates.js

# Check database health
node scripts/check-grading-health.js

# List recent sessions
node scripts/list-recent-sessions.js
```

---

**Ready?** Navigate to `/leaderboard` and see your rankings! 🚀
