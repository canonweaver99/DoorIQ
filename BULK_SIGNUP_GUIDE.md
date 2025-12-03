# Bulk Signup Guide

## Overview
A bulk signup page has been created that allows multiple people to sign up without individual invite tokens. Perfect for sharing in group chats!

## How to Use

### 1. Share the Link
Share this link in your group chat:
```
https://yourdomain.com/bulk-signup
```

### 2. Users Fill Out Form
Each person fills out:
- Full Name
- Email
- Password (min 6 characters)
- Confirm Password

### 3. Account Creation
- Account is created immediately
- Email is auto-confirmed (no email verification needed)
- User is signed in automatically
- Redirects to `/home` page

## Features

✅ **No Email Verification Required** - Accounts are auto-confirmed for quick testing
✅ **Onboarding Disabled** - Users skip onboarding and go straight to `/home`
✅ **Unlimited Practice** - All users get unlimited practice sessions
✅ **Instant Access** - Users can start practicing immediately

## Technical Details

### Page Location
- **Frontend**: `/app/bulk-signup/page.tsx`
- **API Endpoint**: `/app/api/auth/bulk-signup/route.ts`

### What Happens When Users Sign Up

1. **Account Creation**:
   - Auth user created with `email_confirm: true`
   - User profile created in `users` table
   - `onboarding_completed: true` (skips onboarding)
   - `onboarding_dismissed: true` (hides onboarding banner)
   - `role: 'rep'` (standard user role)

2. **Unlimited Access**:
   - No credits or session limits
   - Unlimited practice sessions

3. **Auto Sign-In**:
   - User is automatically signed in after account creation
   - Redirects to `/home` page

## Onboarding Status

Users created via bulk signup have:
- `onboarding_completed: true` ✅
- `onboarding_dismissed: true` ✅

This means:
- ✅ No redirect to onboarding pages
- ✅ No onboarding banner shown
- ✅ Direct access to `/home` page
- ✅ Can start practicing immediately

## Testing

To test the bulk signup:

1. Visit `/bulk-signup`
2. Fill out the form
3. Submit
4. Should redirect to `/home` immediately
5. Should see dashboard (no onboarding)

## Notes

- Users can still access onboarding manually at `/dashboard/getting-started` if needed
- All users get unlimited practice sessions (no credits/limits)
- Accounts are immediately active (no email verification step)
- Perfect for quick testing with multiple users

