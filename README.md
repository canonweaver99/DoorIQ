# DoorIQ - AI-Powered Door-to-Door Sales Training Platform

DoorIQ is an innovative training platform that helps door-to-door sales professionals improve their skills through realistic AI-powered voice interactions.

## Features

- 🎙️ **Voice Interactions**: Practice with realistic AI-powered customer conversations
- 🎯 **Scenario Training**: Handle skeptical, busy, and friendly customer personalities
- 📊 **Performance Analytics**: Track your progress with detailed metrics and insights
- ⚡ **Instant Feedback**: Get AI-powered analysis and tips after each session
- 🚪 **Interactive Door**: Click to knock and start practicing immediately

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **UI Components**: Framer Motion for animations, Recharts for data visualization
- **Database**: MongoDB with Prisma ORM
- **AI Integration**: ElevenLabs API for voice generation and speech-to-text
- **Analysis**: Claude 3 API for conversation analysis
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database
- ElevenLabs API key
- Claude API key (optional for advanced analysis)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dooriq.git
cd dooriq
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
DATABASE_URL="your_mongodb_connection_string"
ELEVENLABS_API_KEY="your_elevenlabs_api_key"
CLAUDE_API_KEY="your_claude_api_key"
NEXTAUTH_SECRET="generate_random_string_here"
NEXTAUTH_URL="http://localhost:3000"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Home Page**: Start from the landing page to learn about DoorIQ
2. **Practice**: Click "Start Practicing" to begin a training session
3. **Knock on the Door**: Click the virtual door to initiate a conversation
4. **Speak Naturally**: Use your microphone to respond to the AI customer
5. **Get Feedback**: Receive instant analysis and tips after each session
6. **Track Progress**: View your performance metrics on the dashboard

## Project Structure

```
/app
  /api           # API routes for practice sessions and AI integration
  /(auth)        # Authentication pages
  /dashboard     # Performance analytics dashboard
  /practice      # Main practice interface
  layout.tsx     # Root layout
  page.tsx       # Landing page

/components      # Reusable React components
/lib            # Utility functions and API clients
/prisma         # Database schema and configuration
/public         # Static assets
```

## Features in Detail

### Practice Sessions
- Realistic door-knocking animation
- Multiple customer personalities (skeptical, friendly, busy professional)
- Real-time voice transcription
- Natural conversation flow with AI responses

### Performance Tracking
- Session history and scores
- Performance trends over time
- Scenario distribution analytics
- Strengths and improvement areas

### AI Integration
- ElevenLabs for natural voice synthesis
- Speech-to-text for user input
- Claude API for advanced conversation analysis (optional)
- Context-aware responses based on conversation history

## Deployment

The application is ready for deployment on Vercel:

```bash
npm run build
```

Configure your environment variables in your Vercel project settings.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For support, email support@dooriq.com or join our Discord community.

---

Built with ❤️ by the DoorIQ team