import { NextResponse } from 'next/server'

/**
 * LLMs.txt endpoint for AI optimization
 * 
 * This endpoint provides information about DoorIQ's platform, APIs, and capabilities
 * to help AI systems understand and interact with the platform effectively.
 * 
 * Reference: https://llmstxt.org/
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dooriq.com'
  
  const llmsTxt = `# DoorIQ - AI-Powered Sales Training Platform

## About DoorIQ

DoorIQ is an AI-powered sales training platform designed specifically for door-to-door pest control sales representatives. The platform enables sales reps to practice their pitch through realistic voice-to-voice conversations with AI-powered customer personas, receive real-time feedback, and track their performance over time.

### Core Value Proposition
- Realistic Practice: Train with AI homeowners that challenge, interrupt, and push back just like real customers
- Instant Feedback: Get detailed analytics and scoring after each practice session
- Confidence Building: Master objection handling before facing real doors
- Team Management: Managers can track team performance and identify coaching opportunities
- Scalable Training: Train unlimited reps without pulling top performers off doors

## Platform Features

### Voice-to-Voice Training
- 12 unique AI training agents with different customer personas
- Real-time voice conversations using ElevenLabs Conversational AI
- Hybrid AI architecture: OpenAI Realtime API + ElevenLabs
- Natural conversation flow with realistic interruptions and objections

### Performance Analytics
- Real-time sentiment tracking (hostile → neutral → interested)
- Objection counting and analysis
- Key moment detection (price mentions, safety concerns, close attempts)
- Post-session performance breakdown with detailed scoring

### Learning & Development
- Sales playbook modules
- Objection handling guides
- Instructional videos
- Progress tracking

### Team Management
- Manager dashboards
- Team performance analytics
- Individual progress tracking
- Leaderboards and gamification

## API Endpoints

### Authentication & User Management
- POST /api/auth/fast-signup - Quick user registration
- POST /api/auth/bulk-signup - Bulk user creation
- POST /api/auth/request-reset - Password reset request
- POST /api/auth/resend-verification - Resend verification email

### Training Sessions
- GET /api/session?id={sessionId} - Get session details
- POST /api/session - Create new training session
- PATCH /api/session - Update session data
- GET /api/session/transcript?id={sessionId} - Get session transcript
- GET /api/session/voice-analysis?id={sessionId} - Get voice analysis
- GET /api/session/feedback?id={sessionId} - Get session feedback
- POST /api/session/increment - Increment session count
- GET /api/session/check-limit - Check session limits

### AI Agents & Conversations
- GET /api/agents/count - Get agent count
- POST /api/eleven/conversation-token - Get ElevenLabs conversation token
- GET /api/eleven/conversations/{conversationId} - Get conversation details
- GET /api/eleven/conversations/{conversationId}/audio - Get conversation audio
- GET /api/eleven/conversations/{conversationId}/feedback - Get conversation feedback
- POST /api/eleven/tts - Text-to-speech conversion
- GET /api/eleven/signed-url - Get signed WebSocket URL

### Grading & Analytics
- POST /api/grading/process - Process session grading
- GET /api/grading/status - Get grading status
- GET /api/grading/queue - Get grading queue
- POST /api/grade/session - Grade a session
- POST /api/grade/simple - Simple grading
- GET /api/grade/health - Grading system health check
- POST /api/grade/retry - Retry failed grading
- GET /api/grade/stream - Stream grading results

### Learning Content
- GET /api/learning/modules - List all learning modules
- GET /api/learning/modules/{slug} - Get module by slug
- GET /api/learning/objections - List all objections
- GET /api/learning/objections/{slug} - Get objection by slug
- GET /api/learning/progress - Get user learning progress
- GET /api/learning/objection-progress - Get objection handling progress
- GET /api/learning/instructional-videos - Get instructional videos
- POST /api/learning/watched - Mark content as watched

### Dashboard & Analytics
- GET /api/dashboard/data - Get dashboard data
- GET /api/analytics/{sessionId} - Get session analytics
- GET /api/analytics/demo - Get demo analytics
- GET /api/analytics/v2/comparison/{sessionId} - Compare session analytics
- GET /api/insights/generate - Generate insights

### Team Management
- GET /api/team/reps - List team reps
- GET /api/team/members - List team members
- GET /api/team/members/{memberId} - Get member details
- GET /api/team/info - Get team information
- GET /api/team/stats - Get team statistics
- GET /api/team/analytics - Get team analytics
- GET /api/team/revenue - Get team revenue data
- GET /api/team/grading-config - Get grading configuration
- POST /api/team/update - Update team settings
- POST /api/team/signup - Team signup
- POST /api/team/signup-notification - Send signup notification

### Knowledge Base
- GET /api/team/knowledge - Get team knowledge base
- POST /api/team/knowledge/upload - Upload knowledge base content
- GET /api/team/learning-videos - Get team learning videos
- POST /api/team/learning-videos/upload - Upload learning video

### Billing & Subscriptions
- GET /api/billing/current-plan - Get current subscription plan
- POST /api/billing/upgrade-plan - Upgrade subscription
- POST /api/billing/downgrade-plan - Downgrade subscription
- POST /api/billing/cancel-subscription - Cancel subscription
- POST /api/billing/add-seats - Add team seats
- POST /api/billing/remove-seats - Remove team seats
- POST /api/billing/switch-billing-interval - Change billing interval
- GET /api/billing/invoices - List invoices
- GET /api/billing/invoices/{id}/download - Download invoice

### Organizations
- GET /api/organizations/current - Get current organization
- GET /api/organizations/{id}/members - Get organization members
- POST /api/organizations/{id}/activate-member - Activate member
- POST /api/organizations/{id}/deactivate-member - Deactivate member
- POST /api/organizations/{id}/update-seats - Update seat count

### Settings & Preferences
- GET /api/settings/preferences - Get user preferences
- POST /api/settings/preferences - Update preferences
- POST /api/settings/update-profile - Update user profile
- POST /api/settings/delete-account - Delete user account
- GET /api/settings/reports - Get available reports
- GET /api/settings/team/members - Get team members
- GET /api/settings/team/pending-invites - Get pending invites
- POST /api/settings/team/invite - Invite team member
- POST /api/settings/team/bulk-invite - Bulk invite team members
- GET /api/settings/organization/teams - Get organization teams
- GET /api/settings/organization/members/{id} - Get organization member

### Invites
- POST /api/invites/create - Create invite
- POST /api/invites/accept - Accept invite
- GET /api/invites/validate - Validate invite token

### Admin
- GET /api/admin/stats - Get admin statistics
- POST /api/admin/grant-credits - Grant user credits
- POST /api/admin/delete-user - Delete user
- GET /api/admin/errors - Get error logs
- POST /api/admin/invites/create - Create admin invite
- GET /api/admin/invites/list - List admin invites
- GET /api/admin/organizations - List organizations
- GET /api/admin/organizations/{id} - Get organization details
- GET /api/admin/organizations/{id}/members - Get org members
- POST /api/admin/organizations/{id}/seats - Update org seats

### Health & Monitoring
- GET /api/health - Basic health check
- GET /api/health/detailed - Detailed health check with system status

### Transcription
- POST /api/transcribe - Transcribe audio

### Coach & Suggestions
- POST /api/coach/suggest - Get coaching suggestions

### Homepage Features
- GET /api/homepage/stats - Get homepage statistics
- GET /api/homepage/gamification - Get gamification data
- GET /api/homepage/milestones - Get milestones
- GET /api/homepage/persona-stats - Get persona statistics
- GET /api/homepage/recommendations - Get recommendations
- GET /api/homepage/rotating-stats - Get rotating stats
- GET /api/homepage/social-proof - Get social proof data
- GET /api/homepage/streak - Get streak data
- GET /api/homepage/weekly-sessions - Get weekly sessions

### Other Endpoints
- POST /api/contact-sales - Contact sales team
- POST /api/demo-request - Request demo
- POST /api/features/request - Request feature
- POST /api/checkout/create-session - Create checkout session
- POST /api/stripe/create-portal-session - Create Stripe portal session
- POST /api/stripe/webhook - Stripe webhook handler
- POST /api/email/send - Send email
- POST /api/email/send-invite - Send invite email
- POST /api/email/subscription - Subscription email
- GET /api/manager/rep/{repId} - Get rep details for manager

## Data Models

### Training Session
- Session ID, user ID, agent ID
- Start/end timestamps
- Transcript, audio recording
- Performance metrics (sentiment, objections, key moments)
- Grading scores (rapport, objection handling, safety, close effectiveness)

### User
- User ID, email, name
- Role (rep, manager, admin)
- Organization ID, team ID
- Subscription plan, credits, session limits

### Learning Module
- Module ID, slug, title, description
- Content (markdown), videos
- Progress tracking, completion status

### Objection
- Objection ID, slug, title, description
- Handling techniques, examples
- Progress tracking

## Technology Stack

- Framework: Next.js 16 (App Router)
- Language: TypeScript
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth
- AI Services:
  - OpenAI (Realtime API, GPT models)
  - ElevenLabs (Conversational AI, TTS)
- Payments: Stripe
- Real-time: WebSockets, Socket.io
- Analytics: Custom analytics system

## Pricing Plans

1. **STARTER Plan**: $99/month per rep (1-20 reps)
2. **TEAM Plan**: $69/month per rep (21-100 reps)
3. **ENTERPRISE Plan**: $49/month per rep (100+ reps)

## Contact & Support

- Website: ${baseUrl}
- Health Check: ${baseUrl}/api/health
- Documentation: See README.md and DOORIQ_COMPREHENSIVE_DOCUMENTATION.md

## Usage Guidelines for AI Systems

1. **Authentication**: Most endpoints require authentication via Supabase Auth
2. **Rate Limiting**: Be respectful of API rate limits
3. **Session Management**: Sessions are tied to authenticated users
4. **Data Privacy**: User data is protected and should not be exposed
5. **Error Handling**: Check HTTP status codes and error messages
6. **Webhooks**: Use webhook endpoints for async operations (Stripe, ElevenLabs)

## Last Updated

${new Date().toISOString()}
`

  return new NextResponse(llmsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

