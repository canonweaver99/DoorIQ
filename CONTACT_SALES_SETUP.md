# Contact Sales Form - Complete Setup Guide

## Overview
A professional, multi-step contact sales form with Cal.com integration for scheduling demos directly within the form flow.

## ✅ What's Been Implemented

### 1. Multi-Step Contact Form
**Location**: `/components/forms/ContactSalesForm.tsx`

**Features**:
- 5-step progressive form with smooth animations
- Real-time validation with helpful error messages
- Phone number auto-formatting
- Character counter for text areas
- Success state with confetti celebration
- Mobile responsive design
- Dark theme matching pricing page aesthetic

**Form Steps**:
1. **Basic Information**: Name, email, phone, job title
2. **Company Details**: Company name, industry, number of sales reps
3. **Needs Assessment**: Use case, referral source, additional comments
4. **Contact Preferences**: Preferred contact method, best time, timezone
5. **Schedule Demo**: Integrated Cal.com booking widget

### 2. API Endpoint
**Location**: `/app/api/contact-sales/route.ts`

**Functionality**:
- Validates all required fields
- Saves leads to `sales_leads` database table
- Sends notification to sales team (**sales@dooriq.ai**)
- Sends confirmation email to lead
- Error handling and proper HTTP responses

### 3. Database Schema
**Location**: `/lib/supabase/migrations/20231116_create_sales_leads_table.sql`

**Tables**:
- `sales_leads` - Stores all contact form submissions

**Fields**:
- Contact info (name, email, phone, job title)
- Company details (name, industry, number of reps)
- Preferences (contact method, best time, timezone)
- Status tracking (new, contacted, qualified, converted, lost)
- Timestamps (created_at, updated_at, contacted_at)
- Internal notes field

**Security**:
- Row Level Security (RLS) enabled
- Only admins and managers can view leads
- Proper indexes for performance

### 4. Admin Dashboard
**Locations**:
- `/app/admin/sales-leads/page.tsx` - List view
- `/app/admin/sales-leads/[id]/page.tsx` - Detail view

**Features**:
- **List View**:
  - Stats dashboard (total leads, new this week, qualified, total reps)
  - Filter by status (new, contacted, qualified, converted, lost)
  - Sort options (newest, oldest, company, reps)
  - Quick status updates
  - Click through to detail view
  
- **Detail View**:
  - Full contact information
  - Company details
  - Needs assessment
  - Quick action buttons (email, call, mark as qualified)
  - Internal notes with auto-save
  - Timeline of interactions

### 5. Cal.com Integration
**Package**: `@calcom/atoms` (installed)
**API Key**: `cal_live_128c81a85b5bb2c8cd71f31afe0ede55`

**Configuration**:
- Username: `dooriq`
- Event slug: `demo`
- View: Month view
- Success callback handler implemented

### 6. Email Configuration
**Provider**: Resend
**Sales Email**: sales@dooriq.ai

**Email Templates**:
1. **Sales Notification**: Sent to sales@dooriq.ai with all lead details
2. **Lead Confirmation**: Professional welcome email sent to prospect

## 🚀 Setup Instructions

### Step 1: Run Database Migration
Execute the SQL migration to create the `sales_leads` table:

```bash
# Copy the contents of lib/supabase/migrations/20231116_create_sales_leads_table.sql
# and run it in your Supabase SQL editor
```

### Step 2: Verify Environment Variables
Ensure these are set in your `.env.local`:

```bash
# Resend (for email notifications)
RESEND_API_KEY=your_resend_api_key

# App URL (for email links)
NEXT_PUBLIC_APP_URL=https://dooriq.ai

# Cal.com (optional - for additional configuration)
NEXT_PUBLIC_CALCOM_API_KEY=cal_live_128c81a85b5bb2c8cd71f31afe0ede55
```

### Step 3: Configure Cal.com
1. Log into Cal.com with your `dooriq` account
2. Create or verify event with slug `demo`
3. Set event duration (recommended: 30 minutes)
4. Configure your availability
5. Test the booking link: `cal.com/dooriq/demo`

### Step 4: Verify Resend Setup
1. Ensure `sales@dooriq.ai` is verified in Resend
2. Test email sending capability
3. Check spam folders if emails don't arrive

### Step 5: Test the Flow
1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:3002/contact-sales`
3. Fill out all form steps
4. Test Cal.com booking widget
5. Submit form and verify emails are sent
6. Check `/admin/sales-leads` for the new lead

## 📍 User Journey

### From Pricing Page
1. User views pricing page at `/pricing`
2. Clicks "Contact Sales" on Team plan
3. Redirected to `/contact-sales`
4. Completes 5-step form
5. Optionally schedules demo via Cal.com
6. Submits form
7. Receives confirmation email
8. Sales team receives notification

### Admin Journey
1. Admin navigates to `/admin/sales-leads`
2. Views dashboard with stats and filters
3. Clicks on a lead to view details
4. Updates status as: new → contacted → qualified → converted
5. Adds internal notes for team collaboration
6. Uses quick actions to email or call prospect

## 🎨 Design Features

### Visual Elements
- Purple gradient borders matching pricing page
- Dark theme with slate/purple color scheme
- Smooth step transitions with animations
- Progress indicator at top of form
- Loading states for async operations
- Success confetti celebration
- Responsive grid layouts

### UX Enhancements
- Progressive disclosure (one step at a time)
- Inline validation with helpful error messages
- Auto-formatting (phone numbers)
- Character limits with counters
- Keyboard navigation support
- Accessible form labels (ARIA)
- Mobile-first responsive design

## 🔒 Security & Data Protection

### Form Security
- Client-side validation
- Server-side validation
- Email format validation
- SQL injection protection via Supabase
- Rate limiting (via Vercel/hosting)

### Database Security
- Row Level Security (RLS) policies
- Only authenticated admins/managers can view leads
- Encrypted at rest (via Supabase)
- Audit trail with timestamps

### Email Security
- Authenticated sending via Resend
- No PII in subject lines
- Professional templates with no tracking pixels

## 📊 Analytics & Tracking

### Metrics to Monitor
- Form completion rate by step
- Drop-off points in form flow
- Time to complete form
- Cal.com booking conversion rate
- Lead status progression
- Time to first contact
- Lead source effectiveness

### Recommended Tools
- Vercel Analytics (built-in)
- Supabase Analytics (database queries)
- Cal.com Analytics (booking metrics)
- Custom events in ContactSalesForm component

## 🛠️ Customization Guide

### Adding Form Fields
Edit `/components/forms/ContactSalesForm.tsx`:
1. Add field to `FormData` interface
2. Add to `formData` initial state
3. Create input in appropriate step
4. Add validation in `validateStep()`
5. Update API route to handle new field

### Modifying Email Templates
Edit `/app/api/contact-sales/route.ts`:
- Modify `salesNotificationHtml` for sales team email
- Modify `confirmationHtml` for lead confirmation email

### Changing Cal.com Settings
Edit `/components/forms/ContactSalesForm.tsx`:
- Update `eventSlug` to match your Cal.com event
- Change `view` prop (MONTH_VIEW, WEEK_VIEW, COLUMN_VIEW)
- Customize `onCreateBookingSuccess` callback

### Styling Adjustments
- All colors use Tailwind classes
- Purple theme: `bg-primary`, `text-primary`, `border-primary`
- Matches `globals.css` color variables
- Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`

## 🐛 Troubleshooting

### Form Not Submitting
- Check browser console for errors
- Verify all required fields are filled
- Check network tab for API errors
- Ensure Supabase connection is working

### Cal.com Widget Not Loading
- Verify `@calcom/atoms` is installed
- Check Cal.com username and event slug
- Ensure dynamic import is working
- Check for CSP or CORS issues

### Emails Not Sending
- Verify Resend API key is set
- Check that sales@dooriq.ai is verified
- Look for errors in server logs
- Test with Resend dashboard

### Database Errors
- Run the migration SQL in Supabase
- Check RLS policies are correct
- Verify user has proper permissions
- Check for typos in table/column names

## 📝 Next Steps

### Recommended Enhancements
1. **Add reCAPTCHA** - Prevent spam submissions
2. **Email Templates** - Create branded HTML templates
3. **Analytics Integration** - Track form conversions
4. **A/B Testing** - Test different form variations
5. **Lead Scoring** - Auto-qualify leads based on criteria
6. **CRM Integration** - Sync to Salesforce/HubSpot
7. **SMS Notifications** - Alert sales team via SMS
8. **Calendar Sync** - Add to team's shared calendar

### Maintenance Tasks
- Monitor form submission success rate
- Review and respond to leads within 24 hours
- Update Cal.com availability regularly
- Test form flow monthly
- Review email deliverability
- Optimize for mobile conversions

## 📚 Related Documentation
- [CALCOM_SETUP.md](./CALCOM_SETUP.md) - Cal.com integration details
- [RESEND_SETUP_GUIDE.md](./RESEND_SETUP_GUIDE.md) - Email configuration
- [Supabase Migrations](./lib/supabase/migrations/) - Database schema

## 🎯 Success Metrics

### KPIs to Track
- Lead volume per week
- Conversion rate (lead → qualified)
- Demo show rate
- Sales cycle length
- Lead source ROI
- Response time to new leads

### Goals
- Respond to all leads within 24 hours
- Achieve 80%+ form completion rate
- 50%+ demo booking rate
- 30%+ qualified lead rate

---

**Status**: ✅ Complete and Ready for Production

**Last Updated**: January 2025
**Maintained By**: DoorIQ Development Team

