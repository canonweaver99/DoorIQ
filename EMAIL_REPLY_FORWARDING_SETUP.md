# Email Reply Forwarding Setup

## ✅ Code Implementation Complete

All emails sent from DoorIQ now include a `reply_to` header pointing to `canonweaver@loopline.design`.

### What This Means

When users reply to any DoorIQ email (from `noreply@dooriq.ai`, `notifications@dooriq.ai`, `invites@dooriq.ai`, etc.), their reply will go directly to **canonweaver@loopline.design**.

### Updated Files

All email-sending code now includes `reply_to: 'canonweaver@loopline.design'`:

- ✅ `lib/email/send.ts` - Main email sending function
- ✅ `app/api/email/subscription/route.ts` - Subscription emails
- ✅ `app/api/email/send-invite/route.ts` - Invite emails
- ✅ `app/api/email/send/route.ts` - General notifications
- ✅ `lib/notifications/service.ts` - Notification service
- ✅ `app/api/auth/fast-signup/route.ts` - Signup confirmation
- ✅ `app/api/auth/resend-verification/route.ts` - Email verification

## How It Works

1. User receives email from DoorIQ (e.g., `notifications@dooriq.ai`)
2. User clicks "Reply" in their email client
3. Email client uses the `Reply-To` header
4. Reply goes to: `canonweaver@loopline.design`

## Testing

To test this works:

1. Send a test email from your app (trigger any email)
2. Reply to that email
3. Verify the reply goes to `canonweaver@loopline.design`

## Alternative: DNS-Level Forwarding (Optional)

If you want to also catch emails sent directly to `noreply@dooriq.ai` (not replies), you can set up DNS-level forwarding:

### Option 1: Via Your Domain Registrar
1. Go to your domain registrar (where `dooriq.ai` is registered)
2. Find email/mail settings
3. Set up forwarding for:
   - `noreply@dooriq.ai` → `canonweaver@loopline.design`
   - `notifications@dooriq.ai` → `canonweaver@loopline.design`
   - `invites@dooriq.ai` → `canonweaver@loopline.design`

### Option 2: Via Resend Inbound Email (If Available)
Some email providers offer inbound email forwarding. Check Resend's documentation for inbound email features.

## Important Notes

1. **Reply-To Header:** This is what we've implemented - it handles replies when users click "Reply"
2. **Direct Emails:** If someone sends an email directly to `noreply@dooriq.ai` (not a reply), that requires DNS-level forwarding
3. **Email Provider:** Make sure `canonweaver@loopline.design` can receive emails from your domain

## Current Status

✅ **Code Implementation:** Complete
✅ **Reply-To Header:** Added to all emails
⏳ **DNS Forwarding:** Optional (only needed if you want to catch direct emails)

---

**Result:** All replies to DoorIQ emails will now go to `canonweaver@loopline.design`! 🎉

