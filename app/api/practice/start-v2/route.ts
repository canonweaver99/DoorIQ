import { NextRequest, NextResponse } from 'next/server';
import { AIConversationManager, generateSpeech } from '@/lib/openai';

// Store conversation managers in memory (use Redis in production)
const conversations = new Map<string, AIConversationManager>();

export async function POST(request: NextRequest) {
  try {
    const { scenario = 'skeptical_homeowner' } = await request.json();
    
    // Create new conversation manager
    const sessionId = crypto.randomUUID();
    const manager = new AIConversationManager(scenario);
    conversations.set(sessionId, manager);

    // Generate initial greeting
    const { response, emotion, internalThought } = await manager.generateResponse(
      '[Door opens]'
    );

    // Generate voice with emotion
    let audioBuffer;
    if (process.env.OPENAI_API_KEY) {
      audioBuffer = await generateSpeech(response, 'nova', emotion);
    }

    // Set a timeout to clean up old conversations
    setTimeout(() => {
      conversations.delete(sessionId);
    }, 30 * 60 * 1000); // 30 minutes

    return NextResponse.json({
      sessionId,
      greeting: response,
      emotion,
      internalThought,
      scenario,
      audioUrl: audioBuffer ? `/api/audio/${sessionId}/greeting` : null,
    });
  } catch (error) {
    console.error('Failed to start practice session:', error);
    return NextResponse.json(
      { error: 'Failed to start practice session' },
      { status: 500 }
    );
  }
}

