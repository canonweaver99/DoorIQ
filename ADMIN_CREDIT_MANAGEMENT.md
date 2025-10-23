# Admin Credit Management Guide

## Overview
Free users have a monthly limit of 5 practice call credits. As an admin, you can grant additional credits to users.

## How to Grant Credits

### Method 1: Using the API Endpoint

**Endpoint:** `POST /api/admin/grant-credits`

**Requirements:**
- You must be logged in as an admin user (role = 'admin' in the users table)
- The user must exist in the database

**Request Body:**
```json
{
  "userId": "uuid-of-the-user",
  "credits": 5
}
```

**Example using cURL:**
```bash
curl -X POST http://localhost:3001/api/admin/grant-credits \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "credits": 5
  }'
```

**Example Response:**
```json
{
  "success": true,
  "message": "Granted 5 credits. New limit: 15",
  "newLimit": 15
}
```

### Method 2: Direct Database Update (Advanced)

If you have direct access to the Supabase dashboard:

1. Go to the **Table Editor**
2. Navigate to the `user_session_limits` table
3. Find the user by `user_id`
4. Update the `sessions_limit` field to the desired number
5. Click **Save**

**Note:** The credits are **added** to the current limit, not replaced.

## Understanding the Credit System

### Free User Limits
- **Default Credits:** 10 per month
- **Resets:** Automatically on the 1st of each month
- **Tracking:** Credits are tracked in the `user_session_limits` table

### Table Schema: `user_session_limits`

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | Foreign key to users table |
| `sessions_this_month` | INTEGER | Number of sessions used this month |
| `sessions_limit` | INTEGER | Maximum sessions allowed (default: 10) |
| `last_reset_date` | DATE | Last time the counter was reset |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### How Credits Work

1. **Starting a Session:**
   - System checks if `sessions_this_month < sessions_limit`
   - If true, session is allowed and counter increments
   - If false, user sees "out of credits" message

2. **Monthly Reset:**
   - On first session of new month, `sessions_this_month` resets to 0
   - `last_reset_date` updates to current date
   - Credits refresh automatically

3. **Premium Users:**
   - Subscription status: `active` or `trialing`
   - Bypass the credit system entirely
   - Have unlimited sessions

## Granting Credits Examples

### Give 5 extra credits
```json
{
  "userId": "user-uuid-here",
  "credits": 5
}
```
Result: If user had 10 limit, now has 15

### Give 20 credits for special case
```json
{
  "userId": "user-uuid-here",
  "credits": 20
}
```
Result: If user had 10 limit, now has 30

### Grant one-time bonus
```json
{
  "userId": "user-uuid-here",
  "credits": 1
}
```
Result: Adds 1 to current limit

## Monitoring Credit Usage

### Check User's Current Status
```sql
SELECT 
  u.email,
  u.full_name,
  usl.sessions_this_month,
  usl.sessions_limit,
  (usl.sessions_limit - usl.sessions_this_month) AS credits_remaining,
  usl.last_reset_date
FROM users u
LEFT JOIN user_session_limits usl ON u.id = usl.user_id
WHERE u.id = 'user-uuid-here';
```

### Find Users Running Low on Credits
```sql
SELECT 
  u.email,
  u.full_name,
  usl.sessions_this_month,
  usl.sessions_limit,
  (usl.sessions_limit - usl.sessions_this_month) AS credits_remaining
FROM users u
INNER JOIN user_session_limits usl ON u.id = usl.user_id
WHERE usl.sessions_this_month >= usl.sessions_limit - 2
  AND u.subscription_status IS NULL OR u.subscription_status NOT IN ('active', 'trialing')
ORDER BY credits_remaining ASC;
```

## Security Notes

⚠️ **Important:**
- Only users with `role = 'admin'` can grant credits
- The API validates admin status before processing
- Credits cannot be negative
- All credit changes are logged in the database

## Troubleshooting

### Error: "Forbidden: Admin access required"
- Ensure your user account has `role = 'admin'` in the users table
- Check that you're logged in with the correct account

### Error: "Invalid request"
- Verify the `userId` is a valid UUID
- Ensure `credits` is a positive number
- Check JSON formatting

### User not showing in `user_session_limits` table
- Table row is created automatically on first session or credit grant
- If missing, the API will create it with default values

## Best Practices

1. **Document the reason** when granting credits (keep a log)
2. **Be consistent** with credit amounts for similar situations
3. **Monitor usage** to identify patterns and adjust defaults if needed
4. **Communicate clearly** with users about their credit balance
5. **Consider automation** for common credit-granting scenarios

## Support

For questions or issues with credit management:
1. Check the database directly in Supabase
2. Review server logs for API errors
3. Contact the development team if issues persist

