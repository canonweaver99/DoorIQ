# Email Notifications Plan - DoorIQ

## Current Status ✅
- Resend is already integrated
- Team invite emails working
- Basic email templates exist
- API endpoints: `/api/email/send` and `/api/email/send-invite`

## Notification Types to Implement

### 1. 🎯 Session Completion Notifications
**When:** After a training session is graded
**To:** Sales rep who completed the session
**Content:**
- Overall score
- Best moment highlight
- Top improvement area
- CTA: View full analytics

**Trigger:** After grading completes in `/api/grade/session`

### 2. 📊 Weekly Performance Summary
**When:** Every Monday morning
**To:** All active users
**Content:**
- Sessions completed this week
- Average score trend
- Virtual earnings total
- Best performing category
- CTA: Start new session

**Trigger:** Cron job or scheduled task

### 3. 🏆 Achievement Unlocked
**When:** User hits milestone (first session, 10 sessions, score > 90%, etc.)
**To:** User who achieved it
**Content:**
- Achievement badge/icon
- What they accomplished
- Next milestone preview
- CTA: Share achievement

**Trigger:** Real-time after session grading

### 4. 👔 Manager Notifications

#### a) New Team Member Session
**When:** Rep completes a session
**To:** Their manager
**Content:**
- Rep name
- Session score
- Key highlights
- CTA: View detailed analytics

#### b) Low Score Alert
**When:** Rep scores < 60%
**To:** Their manager
**Content:**
- Rep name
- Score and problem areas
- Coaching recommendations
- CTA: Send feedback message

#### c) Weekly Team Report
**When:** Every Monday
**To:** Managers
**Content:**
- Team average score
- Top performer
- Most improved
- Needs attention list
- CTA: View team dashboard

### 5. 💬 Message Notifications
**When:** Manager sends message to rep
**To:** The rep
**Content:**
- Message preview
- Sender name
- Session context (if applicable)
- CTA: View message

**Already exists in:** `/api/team/rep/[repId]/route.ts`

### 6. 🎓 Training Recommendations
**When:** User hasn't practiced in 3+ days
**To:** Inactive user
**Content:**
- "We miss you!" message
- Their current stats
- Suggested agent to practice with
- CTA: Start session

## Implementation Priority

### Phase 1: Essential (Do First) ⭐⭐⭐
1. **Session Completion Notification** - Immediate feedback
2. **Manager New Session Alert** - Keep managers in the loop
3. **Message Notifications** - Communication is key

### Phase 2: Engagement (Do Second) ⭐⭐
4. **Achievement Unlocked** - Gamification
5. **Low Score Manager Alert** - Coaching opportunities
6. **Weekly Performance Summary** - Retention

### Phase 3: Advanced (Do Later) ⭐
7. **Training Recommendations** - Re-engagement
8. **Weekly Team Report** - Manager insights

## Technical Implementation

### Step 1: Create Notification Preferences Table
```sql
CREATE TABLE notification_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Email preferences
  email_session_complete BOOLEAN DEFAULT true,
  email_weekly_summary BOOLEAN DEFAULT true,
  email_achievements BOOLEAN DEFAULT true,
  email_messages BOOLEAN DEFAULT true,
  email_training_reminders BOOLEAN DEFAULT true,
  
  -- Manager-specific
  email_team_sessions BOOLEAN DEFAULT true,
  email_low_scores BOOLEAN DEFAULT true,
  email_weekly_team_report BOOLEAN DEFAULT true,
  
  -- Frequency
  digest_frequency TEXT DEFAULT 'immediate', -- immediate, daily, weekly
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);
```

### Step 2: Create Email Templates
File: `lib/email/templates.ts`
```typescript
export const emailTemplates = {
  sessionComplete: (data) => ({ subject, html }),
  weeklyDigest: (data) => ({ subject, html }),
  achievement: (data) => ({ subject, html }),
  managerSessionAlert: (data) => ({ subject, html }),
  lowScoreAlert: (data) => ({ subject, html }),
  message: (data) => ({ subject, html }),
}
```

### Step 3: Create Notification Service
File: `lib/notifications/service.ts`
```typescript
export async function sendNotification(type, userId, data) {
  // Check user preferences
  // Get user email
  // Select template
  // Send via Resend
  // Log notification
}
```

### Step 4: Add Notification Triggers

#### In `/api/grade/session/route.ts`:
```typescript
// After grading completes
await sendNotification('sessionComplete', session.user_id, {
  score: calculatedOverall,
  highlights: ...,
  improvements: ...
})

// Check for achievements
if (calculatedOverall >= 90) {
  await sendNotification('achievement', session.user_id, {
    type: 'high_score',
    score: calculatedOverall
  })
}

// Notify manager
const manager = await getRepManager(session.user_id)
if (manager) {
  await sendNotification('managerSessionAlert', manager.id, {
    repName: ...,
    score: calculatedOverall,
    sessionId: session.id
  })
}
```

### Step 5: User Preferences UI
Page: `app/settings/page.tsx`
```tsx
<NotificationSettings 
  preferences={userPreferences}
  onUpdate={handleUpdate}
/>
```

## Environment Variables Needed

Already set up:
```env
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=notifications@dooriq.com
```

Additional (optional):
```env
RESEND_REPLY_TO=support@dooriq.com
NOTIFICATION_BATCH_SIZE=50  # For digest emails
```

## Resend Domain Setup

1. **Add Domain in Resend Dashboard:**
   - Go to https://resend.com/domains
   - Add your domain (e.g., dooriq.com)
   - Add DNS records (SPF, DKIM, DMARC)

2. **Verify Domain:**
   - Wait for DNS propagation
   - Verify in Resend dashboard

3. **Update From Email:**
   ```env
   RESEND_FROM_EMAIL=notifications@dooriq.com
   ```

## Email Design Standards

### Branding:
- Purple gradient header (#a855f7 to #ec4899)
- Clean white content area
- Professional sans-serif fonts
- Clear CTAs with purple buttons

### Mobile Responsive:
- Max width 600px
- Scalable text
- Touch-friendly buttons
- Works in all email clients

### Accessibility:
- Alt text for images
- High contrast text
- Clear hierarchy
- Plain text fallback

## Testing Strategy

1. **Local Testing:**
   ```bash
   # Use Resend test mode
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer YOUR_KEY" \
     -d '{...}'
   ```

2. **Staging:**
   - Test all notification types
   - Verify preferences work
   - Check unsubscribe links

3. **Production:**
   - Start with opt-in only
   - Monitor bounce rates
   - Track open/click rates

## Compliance

- ✅ Include unsubscribe link in every email
- ✅ Respect user preferences
- ✅ CAN-SPAM compliant footer
- ✅ GDPR-compliant (preference management)
- ✅ Don't send to bounced emails

## Next Steps

1. Create notification_preferences table
2. Build email templates library
3. Implement notification service
4. Add triggers to grading endpoint
5. Build user preferences UI
6. Test with real sessions
7. Monitor and iterate

Ready to start implementation! 🚀

