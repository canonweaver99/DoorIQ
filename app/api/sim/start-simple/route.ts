import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log('Simple start endpoint called');
    
    const body = await req.json().catch(() => ({}));
    console.log('Request body:', body);
    
    // Generate a simple attempt ID
    const attemptId = Date.now().toString();
    
    // Get greeting from persona data or use default
    const greeting = body.personaData?.conversationStyle?.greeting || 
                    "Hello, what can I help you with today?";
    
    console.log('Returning response with greeting:', greeting);

    return NextResponse.json({ 
      attemptId,
      state: "OPENING",
      reply: greeting,
      success: true
    });
  } catch (error) {
    console.error('Simple start error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to start simulation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
