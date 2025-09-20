import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log('Simple step endpoint called');
    
    const body = await req.json().catch(() => ({}));
    console.log('Step request body:', body);
    
    const { attemptId, repUtterance, personaData } = body;
    
    if (!repUtterance) {
      return NextResponse.json(
        { error: 'Missing repUtterance' },
        { status: 400 }
      );
    }
    
    // Generate a simple AI response based on the persona
    const responses = {
      harold: [
        "I've heard this all before. What makes your company different?",
        "How do I know you're legitimate? Do you have references?",
        "We've been fine without pest control for 35 years.",
        "What's this going to cost me? I'm on a fixed income."
      ],
      amanda: [
        "I only have a few minutes. Can you get to the point?",
        "Is this safe for kids and pets? That's my main concern.",
        "I'd need to discuss this with my husband first.",
        "How long does the treatment take? I have a busy schedule."
      ],
      marcus: [
        "That's interesting! Tell me more about how it works.",
        "My neighbor mentioned something similar. Are you working in this area?",
        "I appreciate you taking the time to explain this.",
        "What kind of guarantee do you offer with your service?"
      ],
      jennifer: [
        "What's the active ingredient in your treatment?",
        "Do you have any clinical data on effectiveness?",
        "I need to see your company's safety record first.",
        "What EPA certifications do you have?"
      ],
      carlos: [
        "Just give it to me straight - what's the real cost?",
        "My family's safety comes first. How safe is this?",
        "I respect honest work. Are you local to this area?",
        "What kind of guarantee do you offer?"
      ]
    };
    
    const personaId = personaData?.id || 'marcus';
    const personaResponses = responses[personaId as keyof typeof responses] || responses.marcus;
    const randomResponse = personaResponses[Math.floor(Math.random() * personaResponses.length)];
    
    // Simple terminal condition - end after 6+ exchanges or certain phrases
    const isTerminal = repUtterance.toLowerCase().includes('schedule') || 
                      repUtterance.toLowerCase().includes('not interested') ||
                      body.turnCount > 6;
    
    console.log('Sending AI response:', randomResponse);

    return NextResponse.json({ 
      prospectReply: randomResponse,
      state: isTerminal ? "TERMINAL" : "DISCOVERY",
      terminal: isTerminal,
      objectivesCompleted: ['1'], // Mock completion
      success: true
    });
  } catch (error) {
    console.error('Simple step error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process step',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
