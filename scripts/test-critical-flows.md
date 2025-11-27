# Critical Flows Testing Guide

## Overview
This document outlines the critical user flows that should be tested before production deployment.

## Test Scenarios

### 1. MP3 Upload & Grading Flow
**Path**: `/dashboard` → Upload Tab → Upload MP3 → View Analytics

**Steps**:
1. Navigate to dashboard
2. Click "Upload" tab
3. Select an MP3 file (or drag & drop)
4. Click "Upload & Analyze"
5. Wait for transcription and grading to complete
6. Verify redirect to analytics page
7. Check that scores are displayed correctly

**Expected Results**:
- ✅ File uploads successfully
- ✅ Transcription completes (check transcript appears)
- ✅ Grading completes (scores appear)
- ✅ Session appears in dashboard history
- ✅ Analytics page shows all sections (scores, feedback, objections, etc.)

**Common Issues**:
- File size > 100MB should show error
- Invalid file types should be rejected
- Network errors should show user-friendly message

---

### 2. Live Session Flow
**Path**: `/trainer` → Select Agent → Start Session → End Session → View Analytics

**Steps**:
1. Navigate to trainer page
2. Select an agent (e.g., "Average Austin")
3. Click "Start Training Session"
4. Have a conversation (speak naturally)
5. Click "End Session" when done
6. Wait for grading to complete
7. Verify redirect to analytics page

**Expected Results**:
- ✅ Session starts successfully
- ✅ Microphone permission requested
- ✅ Conversation flows naturally
- ✅ Real-time metrics update (sentiment, objections, etc.)
- ✅ Session ends cleanly
- ✅ Grading completes (15-30 seconds)
- ✅ Analytics page shows complete results

**Common Issues**:
- Microphone permission denied → should show error
- Network disconnection → should handle gracefully
- Session timeout → should auto-end after inactivity

---

### 3. Dashboard Overview Flow
**Path**: `/dashboard` → Overview Tab

**Steps**:
1. Navigate to dashboard
2. Verify all tabs load correctly
3. Check stats cards display correct data
4. Verify charts render (performance, earnings)
5. Check recent sessions list
6. Verify notifications display

**Expected Results**:
- ✅ All tabs load without errors
- ✅ Stats show correct numbers (sessions, rank, earnings)
- ✅ Charts display data correctly
- ✅ Recent sessions link to analytics
- ✅ Performance metrics cards show scores

**Common Issues**:
- Empty state should show helpful message
- Loading states should display
- Errors should be caught and displayed

---

### 4. Settings & Billing Flow
**Path**: `/settings` → Update Preferences → `/billing` → Manage Subscription

**Steps**:
1. Navigate to settings page
2. Update profile information
3. Save preferences
4. Navigate to billing page
5. Click "Manage Subscription"
6. Verify Stripe portal opens

**Expected Results**:
- ✅ Settings save successfully
- ✅ Changes persist after refresh
- ✅ Billing page shows subscription status
- ✅ Stripe portal opens in new tab
- ✅ Portal allows payment method update
- ✅ Portal allows cancellation

**Common Issues**:
- Invalid email format → should show validation error
- Stripe portal fails → should show error message
- Subscription status incorrect → check webhook logs

---

### 5. Invite System Flow
**Path**: Manager → Create Invite → Email Sent → User Accepts → Team Assignment

**Steps**:
1. As manager, navigate to team settings
2. Create invite for new user
3. Verify email is sent
4. Click invite link (or copy token)
5. Sign up/login with invite token
6. Verify team assignment works
7. Check referral code propagates

**Expected Results**:
- ✅ Invite created successfully
- ✅ Email sent with invite link
- ✅ Invite link validates correctly
- ✅ User can sign up with invite
- ✅ Team assignment works automatically
- ✅ Referral code is set correctly

**Common Issues**:
- Invalid email → should show error
- Expired invite → should show error
- Already used invite → should show error
- Team assignment fails → check database logs

---

### 6. Cal.com Integration Flow
**Path**: `/contact-sales` → Fill Form → Schedule Demo

**Steps**:
1. Navigate to contact sales page
2. Fill out form (name, email, company, etc.)
3. Complete all steps
4. On step 4, verify Cal.com embed loads
5. Select available time slot
6. Complete booking

**Expected Results**:
- ✅ Form validates inputs correctly
- ✅ Steps progress smoothly
- ✅ Cal.com embed loads on step 4
- ✅ Calendar displays available times
- ✅ Booking completes successfully
- ✅ Confirmation email sent

**Common Issues**:
- Cal.com embed fails to load → check script loading
- No available times → should show message
- Booking fails → check Cal.com API

---

## Automated Testing Scripts

### Test Upload Flow
```bash
# Test MP3 upload endpoint
curl -X POST http://localhost:3000/api/upload/audio \
  -F "file=@test-audio.mp3" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Grading Endpoint
```bash
# Test grading orchestration
curl -X POST http://localhost:3000/api/grade/orchestrate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"sessionId": "SESSION_ID"}'
```

### Test Session Endpoint
```bash
# Test session retrieval
curl http://localhost:3000/api/session?id=SESSION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Manual Testing Checklist

- [ ] Upload MP3 file and verify grading
- [ ] Complete live session and verify grading
- [ ] Check dashboard loads all tabs
- [ ] Update settings and verify persistence
- [ ] Test billing portal access
- [ ] Create invite and verify email
- [ ] Accept invite and verify team assignment
- [ ] Complete contact sales form
- [ ] Verify Cal.com embed loads
- [ ] Test on mobile device
- [ ] Test with slow network connection
- [ ] Test error scenarios (invalid inputs, network failures)

---

## Performance Testing

### Page Load Times
- Dashboard: Should load in < 2s
- Trainer page: Should load in < 3s
- Analytics page: Should load in < 2s

### API Response Times
- Session retrieval: < 500ms
- Grading orchestration: < 30s total
- Upload endpoint: < 5s for 10MB file

---

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Notes

- All tests should be run in production-like environment
- Use real Stripe test mode for billing tests
- Verify webhook events are received correctly
- Check error logs after each test
- Monitor performance metrics during tests

