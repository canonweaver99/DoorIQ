import { NextRequest, NextResponse } from 'next/server';
import { generateSpeech } from '@/lib/openai';

// Import from start-v2 route (in production, use a shared store)
declare const conversations: Map<string, any>;

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userMessage } = await request.json();
    
    // Get conversation manager
    const manager = conversations.get(sessionId);
    if (!manager) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Generate AI response
    const { response, emotion, internalThought } = await manager.generateResponse(userMessage);

    // Get current metrics
    const metrics = manager.getMetrics();

    // Check if conversation should end
    const conversationLength = manager.getConversationHistory().length;
    const shouldEnd = 
      conversationLength > 10 || 
      userMessage.toLowerCase().includes('thank you') ||
      userMessage.toLowerCase().includes('bye') ||
      response.toLowerCase().includes('goodbye');

    // Generate voice
    let audioBuffer;
    if (process.env.OPENAI_API_KEY) {
      audioBuffer = await generateSpeech(response, 'nova', emotion);
    }

    return NextResponse.json({
      response,
      emotion,
      internalThought,
      metrics,
      shouldEnd,
      audioUrl: audioBuffer ? `/api/audio/${sessionId}/response-${conversationLength}` : null,
    });
  } catch (error) {
    console.error('Failed to generate response:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}

