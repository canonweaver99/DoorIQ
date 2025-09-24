# DoorIQ - AI-Powered Sales Training Platform

<div align="center">
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
</div>

## 🎯 Overview

DoorIQ is a comprehensive sales training platform that helps door-to-door pest control sales representatives master their pitch through realistic AI-powered conversations. Practice with Amanda Rodriguez, a skeptical suburban mom voiced by ElevenLabs AI, and receive real-time feedback to improve your sales performance.

## ✨ Key Features

### 🎙️ Voice-to-Voice Training
- Natural conversations with ElevenLabs AI agent (Amanda)
- Real-time speech recognition and response
- Realistic interruptions and objections
- Embedded agent interface with microphone support

### 📊 Live Performance Metrics
- Sentiment tracking (hostile → neutral → interested)
- Objection counting and analysis
- Key moment detection (price, safety, close attempts)
- Real-time conversation timer

### 📈 Comprehensive Analytics
- Detailed post-session performance breakdown
- Score breakdown: Rapport, Objection Handling, Safety, Close Effectiveness
- Improvement tracking over time
- Specific timing feedback

### 🏆 Gamification
- Achievement badges:
  - First Success - Got Amanda to say yes
  - Speed Runner - Closed in under 3 minutes
  - Trust Builder - No interruptions full session
  - Safety Star - Addressed all safety concerns
- Team leaderboards
- Daily challenges
- Practice streak tracking

### 👥 Team Management
- Admin dashboard for managers
- Team performance analytics
- Individual progress tracking
- Export capabilities for reporting

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/dooriq.git
cd dooriq

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
# (Run the SQL from lib/supabase/schema.sql in your Supabase dashboard)

# Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start training!

## 📖 Documentation

- [Setup Guide](./SETUP_GUIDE.md) - Detailed installation and configuration
- [API Documentation](./Documentation.md) - Technical implementation details
- [Environment Setup](./ENV_SETUP.md) - Environment variable configuration

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5, React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Voice AI**: ElevenLabs Conversational AI (embedded agent)
- **Authentication**: Supabase Auth
- **Charts**: Recharts
- **Icons**: Lucide React
- **Deployment**: Vercel

## 👤 Meet Amanda Rodriguez

Your AI training partner:
- 38-year-old suburban mom
- Lives in a nice neighborhood
- Has 2 kids, 1 dog, and 2 cats
- Skeptical of door-to-door sales
- Had bad experiences before
- Price-conscious but values quality
- Will interrupt if you're vague or take too long

**ElevenLabs Agent**: https://elevenlabs.io/app/agents/agent_7001k5jqfjmtejvs77jvhjf254tz

## 📱 Application Flow

1. **Landing Page** (`/`) - Learn about DoorIQ and sign up
2. **Authentication** (`/auth/login`, `/auth/signup`) - Create account or sign in
3. **Pre-Session** (`/trainer/pre-session`) - Review coaching tips
4. **Training Session** (`/trainer`) - Practice with Amanda
5. **Analytics** (`/trainer/analytics/[id]`) - Review your performance
6. **History** (`/trainer/history`) - Track all sessions
7. **Leaderboard** (`/trainer/leaderboard`) - Compete with team
8. **Admin** (`/admin`) - Manage team (managers only)

## 🎮 How to Use

1. **Sign Up**: Create your account with name and Rep ID
2. **Review Tips**: Read coaching tips before each session
3. **Start Session**: Click "Start Training Session"
4. **Practice**: Speak naturally with Amanda through the embedded agent
5. **Monitor Metrics**: Watch real-time sentiment and key moments
6. **End Session**: Click "End Session" when done
7. **Review Analytics**: See detailed breakdown and feedback
8. **Track Progress**: Monitor improvement over time

## 📊 Scoring System

- **Overall Score** (0-100): Composite performance metric
- **Rapport Score**: Quality of relationship building
- **Objection Handling**: How well objections are addressed
- **Safety Score**: Addressing pet/child safety concerns
- **Close Effectiveness**: Success in attempting to close

## 🏗️ Project Structure

```
/app
  /auth              # Login and signup pages
  /trainer           # Main training interface
    /pre-session     # Coaching tips
    /analytics       # Post-session analysis
    /history         # Session history
    /leaderboard     # Team rankings
  /admin             # Team management dashboard

/components
  /layout            # Navigation and layout components
  /trainer           # Training-specific components

/lib
  /supabase          # Database client and types
  /trainer           # Training logic and types
```

## 🚀 Deployment

Deploy to Vercel:

```bash
npm run build
vercel
```

Add these environment variables to your Vercel project:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (optional)
- `ELEVEN_LABS_API_KEY` (optional)

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- ElevenLabs for providing the conversational AI technology
- Supabase for the backend infrastructure
- The sales training community for valuable feedback

---

<div align="center">
  <p>Built with ❤️ for sales professionals everywhere</p>
</div>