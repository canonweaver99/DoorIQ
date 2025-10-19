# Cal.com Integration Setup

## Overview
The Contact Sales form now includes an integrated Cal.com booking widget that allows prospects to schedule demos directly within the form.

## Configuration

### Cal.com Event Setup
The integration uses a simple iframe embed pointing to:
- **Username**: `dooriq`
- **Event Slug**: `demo`
- **Full Cal.com link**: `https://cal.com/dooriq/demo`

Make sure you have:
1. Created a Cal.com account with username `dooriq`
2. Created an event type with slug `demo`
3. Configured the event duration (recommended: 30 minutes)
4. Set your availability hours

## How It Works

### User Flow
1. User fills out basic information (Steps 1-3)
2. User specifies contact preferences (Step 4)
3. User can optionally schedule a demo directly (Step 5)
4. User books a time slot through the embedded Cal.com calendar
5. User submits the form with all their information

### Technical Implementation
- Uses iframe embed for maximum compatibility
- No additional dependencies required (removed @calcom/atoms)
- 600px height for optimal viewing
- Allows camera, microphone, and payment permissions
- White background for Cal.com's interface

## Customization

### Changing the Event
To use a different Cal.com event, update the iframe src in `/components/forms/ContactSalesForm.tsx`:

```typescript
<iframe
  src="https://cal.com/your-username/your-event-slug"  // Change this
  className="w-full h-[600px] border-0 rounded-xl"
  frameBorder="0"
  allow="camera; microphone; payment"
/>
```

### Customizing the Calendar View
You can add URL parameters to customize the Cal.com embed:

```typescript
// Example with specific date
src="https://cal.com/dooriq/demo?date=2024-01-15"

// Example with duration override
src="https://cal.com/dooriq/demo?duration=60"

// Example with layout preference
src="https://cal.com/dooriq/demo?layout=month_view"
```

## Sales Email Configuration
Sales notifications are sent to: **sales@dooriq.ai** via Resend

## Testing

### Local Testing
1. Make sure `npm run dev` is running
2. Navigate to `http://localhost:3002/contact-sales`
3. Fill out the form steps
4. Click "View Available Times" on Step 5
5. The Cal.com booking widget should load

### Production Setup
1. Verify your Cal.com account is properly configured
2. Test the booking flow end-to-end
3. Ensure email notifications are being sent to sales@dooriq.ai
4. Monitor the `/admin/sales-leads` page for new submissions

## Troubleshooting

### Cal.com iframe not loading
- Verify your Cal.com username and event slug are correct
- Test the direct link: `https://cal.com/dooriq/demo`
- Check browser console for any iframe-related errors
- Ensure your Cal.com event is public and not password-protected

### Iframe appears but shows "404" or error
- Log into Cal.com and verify the event exists
- Check that the event slug matches exactly (case-sensitive)
- Ensure the event is published and not in draft mode

### Bookings not appearing in Cal.com
- Log into your Cal.com dashboard
- Check the "Bookings" tab for scheduled meetings
- Verify the event is active and availability is set
- Check your Cal.com email for booking confirmations

### Email notifications not sending (DoorIQ side)
- Verify Resend is configured properly
- Check that `RESEND_API_KEY` is set in environment variables
- Ensure `sales@dooriq.ai` is verified in your Resend account
- Check server logs for email sending errors

## Support
For Cal.com specific issues, refer to:
- Cal.com Documentation: https://cal.com/docs
- Cal.com Embed Guide: https://cal.com/docs/integrations/embed

