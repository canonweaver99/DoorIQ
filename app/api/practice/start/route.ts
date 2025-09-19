import { NextRequest, NextResponse } from 'next/server';

// Different customer personas
const SCENARIOS = {
  skeptical_homeowner: {
    greeting: "Yes? What do you want? I'm in the middle of dinner.",
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Rachel voice - slightly annoyed
    personality: "skeptical, busy, values time, needs convincing"
  },
  friendly_curious: {
    greeting: "Oh hello there! How can I help you today?",
    voiceId: "pNInz6obpgDQGcFmaJgB", // Adam voice - friendly
    personality: "open, curious, willing to listen, asks questions"
  },
  busy_professional: {
    greeting: "I've got a meeting in 5 minutes. Make it quick.",
    voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel voice - rushed
    personality: "time-conscious, direct, wants value proposition fast"
  }
};

export async function POST(request: NextRequest) {
  try {
    const { scenario = 'skeptical_homeowner' } = await request.json();
    
    const selectedScenario = SCENARIOS[scenario as keyof typeof SCENARIOS] || SCENARIOS.skeptical_homeowner;
    
    // In a real app, you'd create a session in the database here
    const sessionId = crypto.randomUUID();
    
    return NextResponse.json({
      sessionId,
      greeting: selectedScenario.greeting,
      voiceId: selectedScenario.voiceId,
      scenario: scenario,
      personality: selectedScenario.personality
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to start practice session' },
      { status: 500 }
    );
  }
}


