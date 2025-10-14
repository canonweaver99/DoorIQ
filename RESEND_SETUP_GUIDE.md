# Resend Email Notifications Setup Guide

## ✅ What's Been Implemented

### Email Notifications:
1. **Session Complete** - Sent after every training session is graded
2. **Achievement Unlocked** - Sent when user hits milestones
3. **Manager Alerts** - Sent to managers when their reps complete sessions

### Features:
- ✅ Beautiful HTML email templates with DoorIQ branding
- ✅ Responsive design (works on all devices)
- ✅ Non-blocking (doesn't slow down grading)
- ✅ Automatic achievement detection
- ✅ Manager notifications
- ✅ Graceful failure handling

## 🚀 Setup Instructions

### Step 1: Get Resend API Key

1. Go to [resend.com](https://resend.com)
2. Sign up or log in
3. Navigate to **API Keys**
4. Click **Create API Key**
5. Copy the key (starts with `re_...`)

### Step 2: Add Environment Variables

Add to `.env.local`:
```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=notifications@dooriq.com
```

> **Note:** You can use any from email in development. For production, you'll need to verify your domain.

### Step 3: Verify Domain (Production Only)

For production emails, verify your domain:

1. Go to [resend.com/domains](https://resend.com/domains)
2. Click **Add Domain**
3. Enter your domain (e.g., `dooriq.com`)
4. Add the DNS records they provide:
   - **SPF Record** (TXT)
   - **DKIM Records** (TXT)
   - **DMARC Record** (TXT) - optional but recommended

5. Wait for DNS propagation (can take up to 48 hours)
6. Click **Verify** in Resend dashboard

### Step 4: Update From Email

Once domain is verified, update `.env.local`:
```env
RESEND_FROM_EMAIL=notifications@yourverifieddomain.com
```

### Step 5: Test It Out!

1. Start your dev server: `npm run dev`
2. Complete a training session
3. Check your email inbox!

You should receive:
- Session complete email with your score
- Achievement email (if it's your first session)

## 📧 Email Types

### 1. Session Complete Email
**Sent:** After grading completes  
**To:** User who completed session  
**Contains:**
- Overall score and grade
- Best moment from the conversation
- Top improvement opportunity
- Virtual earnings (if sale closed)
- Link to full analytics

### 2. Achievement Email
**Sent:** When milestone is reached  
**To:** User who achieved it  
**Milestones:**
- First session completed (🎯)
- 10 sessions completed (🔥)
- 50 sessions completed (🏆)
- Score ≥ 95% (⭐)
- First sale closed (💰)

### 3. Manager Session Alert
**Sent:** When team member completes session  
**To:** Their manager  
**Contains:**
- Rep's name and score
- Key highlights
- Areas needing work
- Link to session analytics

## 🎨 Email Design

All emails follow DoorIQ branding:
- Purple gradient header (#a855f7 to #ec4899)
- Clean white content area
- Professional typography
- Mobile-responsive
- Clear call-to-action buttons

## 🔧 Customization

### Modify Templates

Edit `lib/email/templates.ts` to customize:
- Email copy
- Colors and styling
- Layout
- Call-to-action buttons

### Add New Notification Types

1. Add template function to `lib/email/templates.ts`
2. Add type to `NotificationOptions` in `lib/notifications/service.ts`
3. Add case to `getTemplate()` and `getPreferenceKey()`
4. Add trigger in your code

Example:
```typescript
await sendNotification({
  type: 'myNewType',
  userId: 'user-id',
  data: { ... }
})
```

## 📊 Monitoring

### Check Email Status

View sent emails in Resend dashboard:
- Delivery status
- Open rates
- Click rates
- Bounces

### Logs

Check server logs for:
```
✅ Sent sessionComplete email to user@example.com (ID: xxx)
⚠️ Failed to send notifications (non-blocking): ...
⏭️ Skipping notification - Resend not configured
```

## 🚫 Troubleshooting

### Emails not sending?

1. **Check API key:**
   ```bash
   echo $RESEND_API_KEY
   ```

2. **Check logs:**
   Look for "Resend not configured" or error messages

3. **Verify from email:**
   - Development: Any email works
   - Production: Must be from verified domain

### Emails going to spam?

1. Verify your domain (see Step 3)
2. Add DMARC policy
3. Start with low volume
4. Monitor bounce rates in Resend dashboard

### Manager notifications not working?

Check:
1. Rep is assigned to a team
2. Team has a manager
3. Manager role is set correctly in `team_members` table

## 🔜 Coming Soon

Optional features to add:

- [ ] Weekly digest emails
- [ ] Re-engagement emails (3+ days inactive)
- [ ] Weekly team report for managers
- [ ] User notification preferences UI
- [ ] Low score alerts for managers
- [ ] Message notifications

See `EMAIL_NOTIFICATIONS_PLAN.md` for full roadmap.

## 📝 Testing

### Send Test Email

Use the API endpoint:
```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your@email.com",
    "subject": "Test Email",
    "body": "This is a test",
    "type": "notification"
  }'
```

### Test in Development

1. Complete a session
2. Wait for grading to finish
3. Check console for: `✅ Sent sessionComplete email...`
4. Check your inbox

## 🎯 Next Steps

1. ✅ Set up Resend account
2. ✅ Add API key to `.env.local`
3. ✅ Test with a training session
4. 🔜 Verify domain for production
5. 🔜 Monitor email delivery
6. 🔜 Add notification preferences UI

---

**Questions?** Check the Resend docs: https://resend.com/docs

