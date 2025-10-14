# Test Email Notifications

## ✅ Setup Complete!

Your Resend API key is configured and ready to use.

## 🧪 How to Test

### Option 1: Complete a Training Session (Recommended)

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Go to the trainer page:**
   ```
   http://localhost:3000/trainer
   ```

3. **Select an AI agent and start a session**

4. **Complete the conversation** (at least 2-3 minutes)

5. **Check your email!** You should receive:
   - Session complete email with your score
   - Link to full analytics

### Option 2: Test Email API Directly

Send a test email using the API:

```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your@email.com",
    "subject": "Test from DoorIQ",
    "body": "If you receive this, email notifications are working!",
    "type": "notification"
  }'
```

## 📧 What Emails You'll Receive

### 1. Session Complete Email
**Trigger:** After every training session  
**Contains:**
- Your overall score and grade (A, B, C, D, F)
- Best moment from the conversation
- Top improvement opportunity
- Virtual earnings (if you closed a sale)
- Button to view full analytics

### 2. Manager Alert Email (if you have a manager)
**Trigger:** When you complete a session  
**Sent to:** Your manager  
**Contains:**
- Your name and score
- Key highlights
- Areas to work on
- Link to review your session

## 🔍 Troubleshooting

### Emails not arriving?

1. **Check spam folder** - First email from a new domain might go there

2. **Check server logs:**
   ```bash
   # Look for these messages in your terminal:
   ✅ Sent sessionComplete email to user@example.com
   ⚠️ Failed to send notifications: ...
   ```

3. **Verify Resend dashboard:**
   - Go to [resend.com/emails](https://resend.com/emails)
   - Check delivery status

4. **Check API key:**
   ```bash
   # Should print your Resend key
   grep RESEND_API_KEY .env.local
   ```

### Email goes to spam?

This is normal for the first few emails. To improve deliverability:

1. **Whitelist the sender:** Add `notifications@dooriq.com` to contacts
2. **Mark as "Not Spam"** if it goes there
3. **For production:** Verify your domain in Resend (see RESEND_SETUP_GUIDE.md)

### Manager emails not working?

Manager notifications only work if:
- You're part of a team
- Your team has a manager assigned
- Check `team_members` table in Supabase

## 🎯 Next Steps

Once you've confirmed emails are working:

1. ✅ Complete a test session
2. ✅ Verify email arrival
3. ✅ Check email rendering on mobile
4. 🔜 Customize email templates (optional)
5. 🔜 Verify domain for production (when ready)

## 📊 Monitor Email Performance

View your email stats in Resend:
- **Delivery rate:** % of emails successfully delivered
- **Open rate:** % of emails opened
- **Click rate:** % of users who clicked links
- **Bounces:** Failed deliveries

## 💡 Tips

- **Development:** Emails from `notifications@dooriq.com` work fine
- **Production:** Verify your own domain for better deliverability
- **Free tier:** 3,000 emails/month (plenty for testing)
- **Paid tier:** Start at $20/month for 50,000 emails

## ✉️ Email Template Locations

Want to customize the emails?

- **Templates:** `lib/email/templates.ts`
- **Service:** `lib/notifications/service.ts`
- **Triggers:** `app/api/grade/session/route.ts`

---

**Ready to test?** Complete a training session and check your inbox! 📬

