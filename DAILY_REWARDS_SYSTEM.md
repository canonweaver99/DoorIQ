# Daily Rewards System

## Overview
The daily rewards system encourages daily engagement by rewarding users with $25 in virtual currency every day they log in. Streak bonuses provide additional incentives for consecutive logins.

## Features

### 💰 Daily Reward
- **Base Reward:** $25 virtual currency
- **Claim Once Per Day:** Users can claim once every 24 hours
- **Auto-Reset:** Availability resets at midnight UTC

### 🔥 Streak Bonuses
- **3-Day Streak:** +$10 bonus ($35 total)
- **7-Day Streak:** +$50 bonus ($75 total)
- **Streak Tracking:** Current streak and longest streak recorded
- **Streak Reset:** Missing a day resets streak to 1

### 🎉 Visual Experience
- **Animated Banner:** Eye-catching daily reward notification on dashboard
- **Confetti Celebration:** Particle effects when claiming reward
- **Progress Tracking:** Shows current balance and streak count
- **Responsive Design:** Works on mobile and desktop

## Database Schema

### Table: `daily_rewards`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users table |
| `last_claim_date` | DATE | Last date reward was claimed |
| `current_streak` | INTEGER | Current consecutive login streak |
| `longest_streak` | INTEGER | Longest streak ever achieved |
| `total_rewards_claimed` | INTEGER | Total number of rewards claimed |
| `total_virtual_earnings` | DECIMAL | Total virtual currency earned from rewards |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### Users Table Addition

Added column: `virtual_earnings DECIMAL(10, 2)` - Tracks user's total virtual currency balance

## API Endpoints

### GET /api/rewards/daily

Check if user can claim daily reward and get current status.

**Response:**
```json
{
  "canClaim": true,
  "lastClaimDate": "2025-10-19",
  "currentStreak": 6,
  "longestStreak": 12,
  "totalRewardsClaimed": 45,
  "totalEarnings": 1500.00,
  "currentBalance": 3250.00
}
```

### POST /api/rewards/daily

Claim the daily reward.

**Response (Success):**
```json
{
  "success": true,
  "reward": 75.00,
  "streak": 7,
  "isStreakBonus": true,
  "message": "Week streak bonus! +$50",
  "newBalance": 3325.00
}
```

**Response (Already Claimed):**
```json
{
  "error": "Already claimed today"
}
```

## Database Functions

### can_claim_daily_reward(p_user_id UUID)

Checks if a user can claim their daily reward.

**Returns:** BOOLEAN
- `true` - User can claim
- `false` - Already claimed today

### claim_daily_reward(p_user_id UUID)

Processes the daily reward claim.

**Returns:**
- `success` - Whether claim succeeded
- `reward_amount` - Amount of virtual currency awarded
- `new_streak` - Updated streak count
- `is_streak_bonus` - Whether a streak bonus was applied
- `message` - Success message

**Logic:**
1. Checks if already claimed today
2. Calculates streak (continuous or reset)
3. Applies streak bonuses if applicable
4. Updates user's virtual earnings
5. Records claim in daily_rewards table

## React Hook: useDailyReward

Custom hook for managing daily rewards in components.

**Usage:**
```typescript
import { useDailyReward } from '@/hooks/useDailyReward'

function MyComponent() {
  const { 
    canClaim, 
    currentStreak, 
    currentBalance,
    loading,
    claiming,
    claimReward,
    refresh
  } = useDailyReward()
  
  const handleClaim = async () => {
    const result = await claimReward()
    if (result?.success) {
      console.log('Claimed!', result)
    }
  }
  
  return (
    // Your component
  )
}
```

**Hook Properties:**
- `canClaim` - Can user claim today?
- `currentStreak` - Current login streak
- `longestStreak` - Best streak achieved
- `totalRewardsClaimed` - Total claims
- `totalEarnings` - Total from daily rewards
- `currentBalance` - Current virtual currency
- `loading` - Initial data loading
- `claiming` - Claim in progress
- `claimReward()` - Function to claim reward
- `refresh()` - Refresh status

## Component: DailyRewardBanner

Displays daily reward notification on dashboard.

**Location:** `/components/dashboard/DailyRewardBanner.tsx`

**Features:**
- Only shows when reward can be claimed
- Animated gift icon with pulsing effect
- Shows current streak with flame icon
- Displays progress toward streak bonuses
- Current balance display
- Claim button with loading state
- Celebration modal with confetti
- Dismissible banner

**Auto-Dismiss:**
- User can manually dismiss
- Celebration auto-hides after 5 seconds
- Banner remembers dismissal (until page refresh)

## Reward Calculation Examples

### Example 1: First Time User
- **Day 1:** Login → Claim → +$25 (Streak: 1)
- **Balance:** $25

### Example 2: Consistent User
- **Day 1:** +$25 (Streak: 1)
- **Day 2:** +$25 (Streak: 2)
- **Day 3:** +$35 (Streak: 3) ← +$10 bonus
- **Day 4:** +$35 (Streak: 4)
- **Day 5:** +$35 (Streak: 5)
- **Day 6:** +$35 (Streak: 6)
- **Day 7:** +$75 (Streak: 7) ← +$50 bonus
- **Total:** $265 for the week

### Example 3: Broken Streak
- **Day 1-7:** Streak of 7, earned $265
- **Day 8:** Missed day 🔴
- **Day 9:** Login → +$25 (Streak: 1) ← Reset to 1
- **Day 10:** +$25 (Streak: 2)
- **Day 11:** +$35 (Streak: 3) ← Bonus resumes

## Integration Points

### Dashboard
- `/app/dashboard/page.tsx` - DailyRewardBanner component added after header

### Balance Display
- User balance shown in reward banner
- Balance updates in real-time after claim
- Can be displayed in other components using `virtual_earnings` from users table

### Future Enhancements
- Show virtual currency balance in header
- Create virtual shop to spend currency
- Add monthly streak bonuses
- Special event multipliers
- Share streak achievements
- Leaderboard for longest streaks

## Testing

### Test Scenarios

1. **First Claim**
   - New user logs in
   - Should see banner
   - Can claim $25
   - Streak = 1

2. **Consecutive Days**
   - Claim day 1, 2, 3
   - Day 3 should give $35
   - Streak = 3

3. **Week Streak**
   - Claim 7 consecutive days
   - Day 7 should give $75
   - Streak = 7

4. **Already Claimed**
   - Claim once
   - Try to claim again same day
   - Should show error

5. **Broken Streak**
   - Build a streak
   - Skip a day
   - Next claim should reset to streak 1

### Manual Testing Checklist
- [ ] Banner appears when claimable
- [ ] Banner shows correct streak count
- [ ] Claim button works
- [ ] Confetti animation plays
- [ ] Celebration modal displays correctly
- [ ] Balance updates correctly
- [ ] Streak bonuses calculate correctly
- [ ] Cannot claim twice in one day
- [ ] Banner can be dismissed
- [ ] Mobile responsive design works

## Database Migration

**File:** `lib/supabase/migrations/050_daily_rewards.sql`

To apply the migration in Supabase:
1. Go to SQL Editor in Supabase dashboard
2. Copy the migration file contents
3. Run the SQL
4. Verify tables and functions created

**OR** 

Use Supabase CLI:
```bash
supabase db push
```

## Security

- **Row Level Security (RLS):** Enabled on daily_rewards table
- **Policies:** Users can only view/update their own rewards
- **Function Security:** Uses SECURITY DEFINER with validation
- **API Protection:** Requires authentication to claim
- **Rate Limiting:** One claim per 24 hours enforced at database level

## Monitoring

### Useful Queries

**Check today's claims:**
```sql
SELECT COUNT(*) 
FROM daily_rewards 
WHERE last_claim_date = CURRENT_DATE;
```

**Find longest streaks:**
```sql
SELECT 
  u.email,
  u.full_name,
  dr.longest_streak,
  dr.total_virtual_earnings
FROM daily_rewards dr
JOIN users u ON dr.user_id = u.id
ORDER BY dr.longest_streak DESC
LIMIT 10;
```

**Total virtual currency distributed:**
```sql
SELECT SUM(total_virtual_earnings) 
FROM daily_rewards;
```

**Users with active streaks:**
```sql
SELECT 
  u.email,
  dr.current_streak,
  dr.last_claim_date
FROM daily_rewards dr
JOIN users u ON dr.user_id = u.id
WHERE dr.last_claim_date >= CURRENT_DATE - 1
  AND dr.current_streak >= 3
ORDER BY dr.current_streak DESC;
```

## Troubleshooting

### Issue: User can't claim but should be able
- Check `last_claim_date` in database
- Verify user is authenticated
- Check server timezone settings
- Ensure migration ran successfully

### Issue: Streak not counting correctly
- Review `claim_daily_reward` function logic
- Check date calculations
- Verify last_claim_date updates correctly

### Issue: Balance not updating
- Confirm `virtual_earnings` column exists in users table
- Check RLS policies on users table
- Verify UPDATE permissions

## Best Practices

1. **Daily Engagement:** Feature prominently on dashboard
2. **Clear Communication:** Show days until next bonus
3. **Celebration:** Make claiming feel rewarding
4. **Transparency:** Show streak progress clearly
5. **Forgiveness:** Consider grace periods for missed days
6. **Value:** Ensure virtual currency has meaningful uses

## Future Considerations

- **Grace Period:** Allow 1-day missed login without streak reset
- **Weekend Bonuses:** Higher rewards on weekends
- **Special Events:** Holiday multipliers
- **Achievements:** Badges for streak milestones
- **Social Features:** Share streaks with friends
- **Push Notifications:** Remind users to claim
- **Multi-tier Rewards:** Different rewards based on subscription level

