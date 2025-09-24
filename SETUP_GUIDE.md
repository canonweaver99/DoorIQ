# DoorIQ Sales Training Platform - Setup Guide

## Overview
DoorIQ is a professional sales training application that uses an ElevenLabs voice agent (Amanda) to help door-to-door pest control sales representatives practice their pitch in realistic scenarios.

## Features
- **Real-time Voice Conversations**: Practice with Amanda, an AI-powered skeptical suburban mom
- **Live Performance Metrics**: Track sentiment, objections, and key moments during conversations
- **Comprehensive Analytics**: Get detailed feedback on your performance after each session
- **Gamification**: Earn badges, climb leaderboards, and maintain practice streaks
- **Team Management**: Admin dashboard for managers to track team performance

## Prerequisites
- Node.js 18+ and npm
- Supabase account
- ElevenLabs API key (optional, for TTS)
- OpenAI API key (optional, for advanced analytics)

## Setup Instructions

### 1. Clone and Install Dependencies
```bash
git clone [your-repo-url]
cd DoorIQ
npm install
```

### 2. Environment Variables
Copy the example environment file and fill in your credentials:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI (optional, for analytics)
OPENAI_API_KEY=your_openai_api_key

# ElevenLabs (optional)
ELEVEN_LABS_API_KEY=your_elevenlabs_api_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup
1. Create a new Supabase project at https://supabase.com
2. Go to the SQL Editor in your Supabase dashboard
3. Run the schema from `lib/supabase/schema.sql`
4. Enable Email Auth in Authentication settings

### 4. ElevenLabs Agent Setup
The application embeds the ElevenLabs agent via iframe. The agent URL is:
```
https://elevenlabs.io/app/agents/agent_7001k5jqfjmtejvs77jvhjf254tz
```

No additional setup required for the embedded agent.

### 5. Run the Application
```bash
npm run dev
```

Visit http://localhost:3000 to see the application.

## Application Structure

### Pages
- `/` - Landing page
- `/auth/login` - User login
- `/auth/signup` - User registration
- `/trainer` - Main training interface with ElevenLabs agent
- `/trainer/pre-session` - Pre-session coaching tips
- `/trainer/analytics/[sessionId]` - Post-session analytics
- `/trainer/history` - Session history and recordings
- `/trainer/leaderboard` - Team leaderboard and achievements
- `/admin` - Admin dashboard (for managers/admins only)

### Key Components
- `components/trainer/MetricCard.tsx` - Real-time metric display
- `components/trainer/KeyMomentFlag.tsx` - Key moment indicators
- `components/layout/AuthenticatedLayout.tsx` - Main app navigation

### Database Tables
- `users` - Sales rep profiles
- `teams` - Team organization
- `training_sessions` - Practice session data
- `session_events` - Real-time session events
- `achievements` - Gamification badges
- `user_achievements` - Earned achievements
- `daily_challenges` - Daily practice challenges
- `coaching_tips` - Pre-session tips

## User Roles
- **rep** - Standard sales representative
- **manager** - Can view team analytics
- **admin** - Full system access

## Features in Detail

### Training Session Flow
1. User logs in and views coaching tips
2. Starts session with ElevenLabs Amanda agent
3. Real-time metrics track performance
4. Session ends and analytics are generated
5. User reviews detailed feedback and scores

### Scoring System
- **Overall Score** (0-100): Composite performance metric
- **Rapport Score**: Quality of relationship building
- **Objection Handling**: How well objections are addressed
- **Safety Score**: Addressing safety concerns
- **Close Effectiveness**: Success in attempting to close

### Gamification Elements
- Achievement badges for milestones
- Daily challenges for skill improvement
- Team leaderboard for competition
- Streak tracking for consistency

## Deployment

### Vercel Deployment
```bash
npm run build
vercel
```

### Environment Variables in Production
Add the same environment variables from `.env.local` to your Vercel project settings.

## Troubleshooting

### Common Issues
1. **Supabase connection errors**: Check your environment variables
2. **Audio not working**: Ensure microphone permissions are granted
3. **ElevenLabs agent not loading**: Check iframe permissions in browser

### Support
For issues or questions, please contact the development team.

## Future Enhancements
- Session recording and playback
- Multiple scenario types
- Custom agent personalities
- Advanced AI-powered coaching
- Mobile app version
