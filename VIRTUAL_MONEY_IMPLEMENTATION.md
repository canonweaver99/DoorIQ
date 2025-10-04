# Virtual Money Capture System Implementation

## Overview
This document outlines the implementation of the virtual money capture system that awards users virtual currency when they successfully close deals during practice sessions.

## Changes Made

### 1. Database Schema (Migration 011)
**File**: `lib/supabase/migrations/011_add_virtual_earnings_to_live_sessions.sql`

Added `virtual_earnings` column to the `live_sessions` table and created a database trigger to automatically update user totals:

- **Column**: `virtual_earnings DECIMAL(10, 2)` - Tracks earnings per session
- **Trigger**: `update_user_earnings_from_live_sessions_trigger` - Automatically adds session earnings to user's total when session ends
- **Index**: Added for performance optimization when querying leaderboard

The trigger ensures that:
- Only sessions with `ended_at` set will trigger earnings updates
- Earnings are cumulative (added to user's existing total)
- Updates handle both INSERT and UPDATE operations correctly
- Prevents negative balances

### 2. Database Types
**File**: `lib/supabase/database.types.ts`

Updated TypeScript types to include `virtual_earnings` in:
- `live_sessions.Row` - For reading session data
- `live_sessions.Insert` - For creating new sessions
- `live_sessions.Update` - For updating existing sessions

### 3. API Route Enhancement
**File**: `app/api/sessions/end/route.ts`

Modified the session end endpoint to return grading results:
- Now returns `{ ok: true, grading: gradingResults }` instead of just `{ ok: true }`
- This allows the frontend to immediately access `virtual_earnings` without a separate API call
- Maintains backward compatibility (existing code still works)

### 4. Grading System
**File**: `app/api/grade/session/route.ts` (already working)

The grading API uses OpenAI to:
1. Analyze the conversation transcript
2. Detect if a price was discussed
3. Determine if the customer agreed to close the deal
4. Calculate `virtual_earnings` based on the quoted price

If no deal was closed or no price quoted, `virtual_earnings` returns 0.

### 5. Trainer Page Flow
**File**: `app/trainer/page.tsx`

Updated the `endSession` callback to:
1. Call `/api/sessions/end` and wait for response
2. Extract `virtual_earnings` from grading results
3. If earnings > 0:
   - Show `MoneyNotification` component (green bubble with dollar amount)
   - Wait for notification animation to complete (~2.5 seconds)
   - Then show `CalculatingScore` component
4. If earnings = 0:
   - Go directly to `CalculatingScore` component
5. Finally redirect to analytics page

This creates a satisfying UX flow: 💰 → 📊 → 📈

### 6. Leaderboard
**File**: `app/leaderboard/page.tsx` (already working)

The leaderboard already queries `users.virtual_earnings` and displays users ranked by total earnings. With the new trigger, this will automatically update when sessions complete.

## How It Works End-to-End

1. **User completes a practice session** where they quote a price and get customer agreement
2. **Session ends**, transcript is saved to database
3. **Grading API analyzes** the conversation:
   - Looks for price mentions (e.g., "$299", "$49.99")
   - Checks if customer agreed (e.g., "okay", "sounds good", "let's do it")
   - If both conditions met, sets `virtual_earnings` to the quoted price
4. **Database trigger fires** when `virtual_earnings` and `ended_at` are both set:
   - Adds session earnings to user's total
   - Updates `users.virtual_earnings`
5. **Frontend shows celebration**:
   - Money notification displays the earned amount
   - After animation, shows calculating screen
   - Then redirects to full analytics
6. **Leaderboard updates automatically** with new total

## Database Migration

To apply the database changes, run:

```bash
# Connect to your Supabase database and execute:
psql $DATABASE_URL -f lib/supabase/migrations/011_add_virtual_earnings_to_live_sessions.sql
```

Or in the Supabase Dashboard SQL Editor, paste and run the contents of:
`lib/supabase/migrations/011_add_virtual_earnings_to_live_sessions.sql`

## Testing

To test the complete flow:

1. Start a practice session on `/trainer`
2. During the conversation, quote a specific price (e.g., "We can do the full treatment for $299")
3. Get the AI homeowner to agree (e.g., "Okay, that sounds good")
4. End the session
5. You should see:
   - Green money notification with the dollar amount
   - Then the calculating scores screen
   - Then the analytics page
6. Check the leaderboard - your virtual earnings should be updated

## Files Modified

- ✅ `lib/supabase/migrations/011_add_virtual_earnings_to_live_sessions.sql` (NEW)
- ✅ `lib/supabase/database.types.ts`
- ✅ `app/api/sessions/end/route.ts`
- ✅ `app/trainer/page.tsx`
- ℹ️ `app/api/grade/session/route.ts` (already had virtual_earnings logic)
- ℹ️ `components/trainer/MoneyNotification.tsx` (already existed)
- ℹ️ `app/leaderboard/page.tsx` (already queries virtual_earnings)

## Backwards Compatibility

All changes are backwards compatible:
- Existing sessions without `virtual_earnings` will have `NULL` or `0` (default)
- Old API calls still work (they just get extra data in responses)
- Database trigger only fires when both conditions are met

## Future Enhancements

Potential improvements:
- Add a "total earnings" badge to user profile
- Show earnings history/breakdown
- Add achievements/milestones for earnings thresholds
- Display earnings in session cards on the sessions list page
- Add earnings analytics (e.g., "You've earned $X this week")
