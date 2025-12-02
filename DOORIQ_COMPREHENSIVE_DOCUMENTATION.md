# DoorIQ - Comprehensive Documentation

**Last Updated:** November 2025  
**Version:** 0.1.0

---

## Table of Contents

1. [What is DoorIQ?](#what-is-dooriq)
2. [Core Features](#core-features)
3. [Feature Status](#feature-status)
4. [Pricing Model](#pricing-model)
5. [Technology Stack](#technology-stack)
6. [Architecture Overview](#architecture-overview)
7. [Known Issues & Limitations](#known-issues--limitations)
8. [Future Roadmap](#future-roadmap)

---

## What is DoorIQ?

**DoorIQ** is an AI-powered sales training platform designed specifically for door-to-door pest control sales representatives. The platform enables sales reps to practice their pitch through realistic voice-to-voice conversations with AI-powered customer personas, receive real-time feedback, and track their performance over time.

### Core Value Proposition

- **Realistic Practice**: Train with AI homeowners that challenge, interrupt, and push back just like real customers
- **Instant Feedback**: Get detailed analytics and scoring after each practice session
- **Confidence Building**: Master objection handling before facing real doors
- **Team Management**: Managers can track team performance and identify coaching opportunities
- **Scalable Training**: Train unlimited reps without pulling top performers off doors

### Target Audience

- **Primary**: Door-to-door pest control sales representatives
- **Secondary**: Sales managers and team leaders
- **Tertiary**: Sales training organizations

---

## Core Features

### 🎙️ Voice-to-Voice Training

**Status:** ✅ Fully Functional

- **12 Unique AI Training Agents**: Each agent represents a different customer persona with unique objections and personality traits
- **Real-time Voice Conversations**: Natural, flowing conversations using ElevenLabs Conversational AI
- **Hybrid AI Architecture**: 
  - OpenAI Realtime API handles speech recognition, conversation flow, and turn-taking
  - ElevenLabs provides high-quality voice synthesis for agent responses
- **Embedded Agent Interface**: Seamless iframe integration with microphone support
- **Realistic Interruptions**: Agents interrupt when reps are vague or take too long

**Available Agents:**
1. **Austin** (Moderate) - Skeptical but fair homeowner
2. **No Problem Nancy** (Easy) - Warm and agreeable
3. **Already Got It Alan** (Hard) - Loyal to current provider
4. **Not Interested Nick** (Very Hard) - Dismissive and busy
5. **DIY Dave** (Hard) - Handy and self-reliant
6. **Too Expensive Tim** (Hard) - Price-sensitive
7. **Spouse Check Susan** (Moderate) - Collaborative decision-maker
8. **Busy Beth** (Moderate) - Rushed and multitasking
9. **Renter Randy** (Hard) - Uncertain about authority
10. **Skeptical Sam** (Hard) - Suspicious and needs evidence
11. **Just Treated Jerry** (Moderate) - Organized and plans ahead
12. **Think About It Tina** (Hard) - Analytical and overthinks decisions

### 📊 Live Performance Metrics

**Status:** ✅ Fully Functional

- **Real-time Sentiment Tracking**: Monitors customer sentiment progression (hostile → neutral → interested)
- **Objection Counting**: Tracks number and types of objections raised
- **Key Moment Detection**: Identifies important moments:
  - Price discussions
  - Safety concerns (pets/children)
  - Close attempts
  - Pattern interrupts
- **Conversation Timer**: Real-time session duration tracking
- **Live Transcript**: Real-time conversation transcription displayed during session

### 📈 Comprehensive Analytics & Scoring

**Status:** ✅ Fully Functional (with some limitations)

- **Post-Session Performance Breakdown**: Detailed analysis after each session
- **Score Components**:
  - **Overall Score** (0-100): Composite performance metric
  - **Rapport Score**: Quality of relationship building
  - **Objection Handling**: Effectiveness in addressing objections
  - **Safety Score**: How well pet/child safety concerns were addressed
  - **Close Effectiveness**: Success in attempting to close the sale
- **Line-by-Line Grading**: 
  - **Status:** ⚠️ Currently Disabled for Performance
  - Each rep message rated for effectiveness (excellent/good/poor)
  - Alternative line suggestions for improvement
  - Auto-expands transcript for poorly-rated lines
- **Timeline Key Moments**: Visual timeline with hover cards showing important conversation moments
- **Improvement Tracking**: Monitor performance trends over time
- **Specific Timing Feedback**: Analysis of pacing and timing

### 🏆 Gamification

**Status:** ✅ Fully Functional

- **Achievement Badges**:
  - First Success - Got agent to say yes
  - Speed Runner - Closed in under 3 minutes
  - Trust Builder - No interruptions full session
  - Safety Star - Addressed all safety concerns
- **Team Leaderboards**: Compete with teammates
- **Daily Challenges**: Regular practice goals
- **Practice Streak Tracking**: Maintain consistent practice habits
- **Daily Rewards**: System for daily engagement (status needs verification)

### 👥 Team Management & Admin Features

**Status:** ✅ Fully Functional

- **Manager Dashboard**: Comprehensive admin interface for team oversight
- **Team Performance Analytics**: Aggregate team statistics and trends
- **Individual Progress Tracking**: Detailed analytics for each rep
- **Team Leaderboards**: Compare performance across team members
- **Export Capabilities**: Generate reports for management review
- **Organization Management**: Multi-organization support with seat management
- **Team Invitations**: Invite system for adding team members
- **Role-Based Access**: Manager vs. Rep role differentiation

### 📱 Dashboard & User Interface

**Status:** ✅ Fully Functional

- **Multi-Tab Dashboard**:
  - **Overview**: Stats, recent sessions, insights
  - **Performance**: Analytics and charts
  - **Learning**: Playbooks and instructional content
  - **Upload**: File upload for pitch recordings
  - **Team**: Team stats and management
- **Session History**: View all past practice sessions
- **Analytics Pages**: Detailed session-by-session breakdown
- **Responsive Design**: Works on desktop and mobile devices

### 🎓 Learning & Knowledge Base

**Status:** ✅ Partially Functional

- **Instructional Videos**: Learning content for sales training
- **Custom Sales Playbook**: 
  - Available for Team and Enterprise tiers
  - Managers can upload custom training materials
- **Knowledge Base**: Upload and manage training documents
- **Video Watching Tracking**: Tracks which videos users have watched

### 💳 Subscription & Billing System

**Status:** ✅ Fully Functional

- **14-Day Free Trial**: Automatically applied to all subscriptions
- **Stripe Integration**: Complete payment processing
- **Feature Gating**: Server-side and client-side feature access control
- **Session Limits**: 
  - Free tier: 10 sessions/month
  - Paid tiers: Unlimited sessions
- **Billing Portal**: Customer self-service portal for subscription management
- **Email Notifications**: Automated emails for subscription events
- **Multiple Billing Intervals**: Monthly and annual options

### 📧 Email System

**Status:** ✅ Fully Functional

- **Welcome Emails**: Onboarding for new users
- **Subscription Emails**: 7 types of automated subscription emails
- **Team Invitations**: Email-based team member invitations
- **Password Reset**: Email-based password recovery
- **Verification Emails**: Email verification for new accounts

### 📤 File Upload & Transcription

**Status:** ✅ Fully Functional

- **Audio Upload**: Upload MP3 recordings of pitch sessions
- **Transcription**: Automatic transcription of uploaded audio
- **Grading**: Uploaded sessions use same grading system as live sessions
- **Video Upload**: Support for instructional video uploads (manager feature)

### 🔐 Authentication & Security

**Status:** ✅ Fully Functional

- **Supabase Auth**: Email/password authentication
- **Row-Level Security (RLS)**: Database-level access control
- **Session Management**: Secure session handling
- **Password Reset**: Secure password recovery flow
- **Email Verification**: Account verification system

---

## Feature Status

### ✅ Fully Working Features

1. **Voice-to-Voice Training** - All 12 agents functional
2. **Live Performance Metrics** - Real-time tracking working
3. **Session Analytics** - Post-session grading and scoring
4. **Team Management** - Admin dashboard and team features
5. **Subscription System** - Stripe integration complete
6. **Authentication** - User signup, login, password reset
7. **Dashboard** - All tabs functional
8. **File Upload** - Audio transcription and grading
9. **Email System** - All email types working
10. **Leaderboards** - Team competition features
11. **Session History** - View past sessions
12. **Billing Portal** - Customer self-service

### ⚠️ Partially Working / Limited Features

1. **Line-by-Line Grading**
   - **Status**: Disabled for performance optimization
   - **Reason**: Slows down grading process
   - **Workaround**: Overall scoring still works, just no individual line ratings
   - **Future**: Will be re-enabled after performance optimization

2. **Streaming Grading Display**
   - **Status**: Temporarily disabled
   - **Reason**: SSE connection issues
   - **Workaround**: Falls back to polling method (works reliably)
   - **Future**: Will debug and re-enable streaming

3. **Video Recording**
   - **Status**: Archived/Temporarily disabled
   - **Reason**: Not currently prioritized
   - **Note**: Code exists but not actively used

4. **Daily Rewards**
   - **Status**: Needs verification
   - **Note**: System exists but usage unclear

5. **Middleware Authentication**
   - **Status**: Temporarily disabled
   - **Reason**: Allow all routes to pass through
   - **Note**: Auth still works at component level

### ❌ Not Working / Broken Features

1. **None Currently Identified** - All critical features are functional

### 🔧 Features Needing Attention

1. **Performance Optimization**
   - Some routes have lower performance scores (71-84)
   - LCP (Largest Contentful Paint) needs improvement
   - CLS (Cumulative Layout Shift) needs reduction

2. **Streaming Grading**
   - Endpoint exists but connection needs debugging
   - Component exists but not being used

3. **Line-by-Line Ratings**
   - Feature complete but disabled for speed
   - Needs performance optimization to re-enable

---

## Pricing Model

### Pricing Tiers

DoorIQ uses a **per-rep, per-month** pricing model with three tiers based on team size:

#### 1. **STARTER Plan**
- **Price**: $99/month per rep
- **Team Size**: 1-20 reps
- **Features**:
  - Unlimited practice sessions
  - All 12 AI training agents
  - Team leaderboard
  - Basic analytics & reporting
  - Manager dashboard
  - **Basic sales playbook** (Learning page)

#### 2. **TEAM Plan** ⭐ Most Popular
- **Price**: $69/month per rep
- **Team Size**: 21-100 reps
- **Features**:
  - Everything in Starter
  - Advanced analytics & reporting
  - Team performance insights
  - Custom practice scenarios
  - **Custom Sales Playbook** (Learning page)
  - Example: 50 reps = $3,450/month ($115/day total, ~$2.30/day per rep)

#### 3. **ENTERPRISE Plan**
- **Price**: $49/month per rep
- **Team Size**: 100-500+ reps
- **Features**:
  - Everything in Team
  - Custom AI personas (clone top performer's voice/style)
  - White-label option
  - Dedicated account team
  - Volume discounts
  - Example: 100 reps = $4,900/month ($163/day total, ~$1.63/day per rep)

### Billing Options

- **Monthly Billing**: Standard monthly pricing
- **Annual Billing**: 15% discount (2 months free)
  - Equivalent to paying for 10 months, getting 12 months

### Free Trial

- **14-Day Free Trial**: Automatically applied to all subscriptions
- **No Credit Card Required**: For initial signup
- **Full Feature Access**: During trial period (based on plan tier)
- **Email Notifications**: 
  - Trial started
  - Trial ending soon (3 days before)
  - Trial converted to paid

### Free Tier (Limited)

- **3 Basic Agents**: Austin, Karen, Sarah
- **10 Sessions/Month**: Limited practice sessions
- **Basic Analytics**: Standard performance metrics
- **Email Support**: Standard support level

### ROI Calculator

The platform includes an ROI calculator showing:
- **Extra Revenue**: Based on 1 extra deal per rep per month
- **DoorIQ Cost**: Monthly subscription cost
- **Net Profit**: Revenue minus cost
- **ROI Multiplier**: Return on investment percentage

**Example Calculation:**
- 10 reps × $300 deal value = $3,000 extra revenue/month
- DoorIQ cost: $990/month (Starter tier)
- Net profit: $2,010/month
- ROI: 203% (3.0x multiplier)

### Payment Processing

- **Stripe Integration**: Full Stripe payment processing
- **Secure Checkout**: Stripe Checkout for subscriptions
- **Customer Portal**: Self-service billing management
- **Webhook System**: Real-time subscription status updates
- **Invoice Management**: Download and view invoices

---

## Technology Stack

### Frontend

- **Framework**: Next.js 15.5 (React 19)
- **Language**: TypeScript 5.0
- **Styling**: 
  - Tailwind CSS 3.4
  - Framer Motion 12.23 (animations)
- **UI Components**: 
  - Radix UI (headless components)
  - Shadcn UI components
  - Custom components
- **Icons**: Lucide React
- **Charts**: Recharts 3.2
- **3D Graphics**: Three.js, React Three Fiber

### Backend

- **Runtime**: Node.js 18+
- **API Framework**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage

### AI & Voice

- **Voice AI**: 
  - ElevenLabs Conversational AI (embedded agents)
  - ElevenLabs TTS API (voice synthesis)
- **Speech Recognition**: OpenAI Realtime API
- **Conversation Flow**: OpenAI Realtime API
- **Analytics Grading**: OpenAI GPT-4o
- **Transcription**: OpenAI Whisper (via API)

### Third-Party Services

- **Payment Processing**: Stripe
- **Email**: Resend
- **Calendar**: Cal.com (for demos)
- **Analytics**: Vercel Analytics
- **Performance**: Vercel Speed Insights
- **Deployment**: Vercel

### Development Tools

- **Package Manager**: npm
- **Build Tool**: Next.js built-in
- **Type Checking**: TypeScript
- **Linting**: ESLint
- **Code Formatting**: Prettier (implied)

### Mobile

- **React Native**: Mobile app in `mobile/` directory
- **Status**: Separate workspace, development ongoing

---

## Architecture Overview

### Application Structure

```
/app
  /api              # API routes (Next.js API routes)
  /auth             # Authentication pages
  /dashboard        # Main user dashboard
  /trainer          # Training session interface
  /analytics        # Session analytics pages
  /admin            # Admin/manager dashboard
  /settings         # User settings
  /pricing          # Pricing page
  /team             # Team management
  /learning         # Learning content

/components
  /trainer          # Training session components
  /analytics        # Analytics display components
  /dashboard        # Dashboard components
  /admin            # Admin components
  /ui               # Reusable UI components
  /subscription     # Subscription-related components

/lib
  /supabase         # Database client and types
  /trainer          # Training logic and types
  /subscription     # Subscription utilities
  /stripe           # Stripe integration
  /email            # Email utilities

/hooks
  /useSubscription  # Subscription hooks
  /useLiveSessionAnalysis  # Real-time analysis
  /useVoiceAnalysis # Voice analysis
```

### Data Flow

1. **User Signs Up** → Supabase Auth → User profile created
2. **Starts Session** → Session limit checked → Session created in DB
3. **Voice Conversation** → ElevenLabs agent → OpenAI Realtime → Transcript stored
4. **Session Ends** → Transcript sent to grading API → GPT-4o analyzes → Scores stored
5. **Analytics Display** → Scores retrieved → Charts and feedback displayed

### Database Schema (Key Tables)

- **users**: User profiles and authentication
- **live_sessions**: Training session records
- **session_transcripts**: Conversation transcripts
- **analytics**: Session scores and metrics
- **line_ratings**: Individual line effectiveness ratings (currently disabled)
- **organizations**: Company/team organizations
- **subscriptions**: Stripe subscription data
- **feature_flags**: Feature access control
- **user_session_limits**: Free tier session limits

### API Architecture

- **REST API**: Next.js API routes
- **Server-Side Rendering**: Next.js SSR for SEO
- **Client-Side Rendering**: React components for interactivity
- **Real-Time**: Polling for session updates (streaming disabled)

---

## Known Issues & Limitations

### Performance Issues

1. **Grading Speed**
   - **Issue**: Line-by-line grading slows down process
   - **Status**: Disabled for performance
   - **Impact**: Users don't get individual line ratings
   - **Workaround**: Overall scores still provided

2. **Page Performance Scores**
   - **Issue**: Some routes score 71-84 (needs improvement)
   - **Affected Routes**:
     - `/trainer`: 81
     - `/trainer/select-homeowner`: 71
     - `/analytics/[sessionId]`: 82
     - `/dashboard`: 84
     - `/pricing`: 80
   - **Metrics Needing Improvement**:
     - LCP: 2.9s (target: <2.5s)
     - CLS: 0.33 (target: <0.1)
     - TTFB: 1.04s (target: <0.8s)

### Feature Limitations

1. **Streaming Grading**
   - **Issue**: Server-Sent Events (SSE) connection not working
   - **Status**: Temporarily disabled
   - **Workaround**: Polling method works reliably
   - **Impact**: Slightly slower feedback display

2. **Video Recording**
   - **Issue**: Feature archived/not actively used
   - **Status**: Code exists but disabled
   - **Impact**: No video recording during sessions

3. **Middleware Auth**
   - **Issue**: Temporarily disabled (allows all routes)
   - **Status**: Auth still works at component level
   - **Impact**: Less efficient route protection

### Data Quality Issues

1. **Filler Word Detection**
   - **Issue**: "like" was incorrectly flagged in normal usage
   - **Status**: ✅ Fixed - Now only counts at sentence start
   - **Example**: "service like this" = not filler, "Like, I was thinking" = filler

2. **Timeline Moments**
   - **Issue**: Need verification that moments are session-specific
   - **Status**: Logging added to verify uniqueness
   - **Impact**: May show similar moments across sessions

### Known Bugs

1. **None Currently Documented** - All critical bugs have been addressed

### Technical Debt

1. **Duplicate Migrations**
   - Two `029_` migrations exist
   - Needs cleanup

2. **Legacy Tables**
   - `training_sessions` table may be legacy (vs `live_sessions`)
   - Needs verification and cleanup

3. **Source Maps**
   - Production source maps disabled
   - May impact debugging

---

## Future Roadmap

### Short-Term (Next 1-3 Months)

1. **Performance Optimization**
   - Improve page performance scores
   - Optimize LCP, CLS, TTFB metrics
   - Re-enable line-by-line grading with optimizations

2. **Streaming Grading**
   - Debug SSE connection issues
   - Re-enable real-time streaming display

3. **Feature Enhancements**
   - Improve timeline moment uniqueness
   - Enhance filler word detection accuracy

### Medium-Term (3-6 Months)

1. **Mobile App**
   - Complete React Native mobile app
   - Full feature parity with web

2. **Advanced Analytics**
   - More detailed performance insights
   - Predictive analytics
   - Coaching recommendations

3. **Custom AI Personas**
   - Enable cloning top performer voices/styles
   - Custom scenario creation

### Long-Term (6+ Months)

1. **White-Label Options**
   - Enterprise white-labeling
   - Custom branding

2. **Integration Enhancements**
   - CRM integrations
   - Calendar integrations
   - Slack/Teams notifications

3. **Advanced Features**
   - Multi-language support
   - Industry-specific personas
   - Advanced reporting and exports

---

## Additional Resources

### Documentation Files

- `README.md` - Basic project overview
- `SETUP_GUIDE.md` - Installation and setup instructions
- `AGENT_TESTING_GUIDE.md` - Guide for testing AI agents
- `STRIPE_SYSTEM_SUMMARY.md` - Subscription system details
- `FIXES_APPLIED.md` - Recent bug fixes and improvements
- `PRODUCTION_LAUNCH_CHECKLIST.md` - Pre-launch verification

### Key Configuration

- **Environment Variables**: See `.env.example` (if exists)
- **Database Migrations**: `lib/supabase/` directory
- **Stripe Configuration**: `lib/stripe/config.ts`
- **Agent Configuration**: `components/trainer/personas.ts`

---

## Support & Contact

For technical issues or feature requests:
- Check existing documentation files
- Review known issues section
- Contact development team

---

**Document Version**: 1.0  
**Last Updated**: November 2025
**Maintained By**: DoorIQ Development Team

