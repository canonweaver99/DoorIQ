# DoorIQ Mobile App

Expo React Native mobile application for DoorIQ sales training platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env` file in the `mobile/` directory:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

3. Start the development server:
```bash
npm start
```

4. Run on iOS:
```bash
npm run ios
```

## Project Structure

- `app/` - Expo Router screens
- `components/` - Reusable components
- `lib/` - Utilities and API clients
- `contexts/` - React contexts (Auth, etc.)

## Features

- Authentication (Email/Password, Google OAuth)
- Dashboard with session statistics
- Training sessions with ElevenLabs AI agents
- Session history and analytics

## Notes

- The ElevenLabs integration uses WebSocket for real-time voice conversations
- Audio recording requires microphone permissions
- Session data is stored in Supabase

