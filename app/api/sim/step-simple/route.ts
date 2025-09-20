import { NextResponse } from "next/server";
import { getPersonaById } from "@/lib/personas";

// Helper functions to generate contextual responses
function getInitialResponse(personaId: string, repUtterance: string): string {
  const persona = getPersonaById(personaId);
  if (!persona) return "I'm not sure what you're talking about.";
  
  const lowerRep = repUtterance.toLowerCase();
  
  // Check for specific triggers
  if (lowerRep.includes('pest') || lowerRep.includes('bug') || lowerRep.includes('control')) {
    return persona.conversationStyle.objections[0] || "We don't need that.";
  }
  
  if (lowerRep.includes('free') || lowerRep.includes('inspection')) {
    return persona.conversationStyle.skepticalPhrases[0] || "What's the catch?";
  }
  
  // Default skeptical response
  return persona.conversationStyle.commonPhrases[0] || "I'm listening...";
}

function getEarlyResponse(personaId: string, repUtterance: string): string {
  const persona = getPersonaById(personaId);
  if (!persona) return "Tell me more.";
  
  const lowerRep = repUtterance.toLowerCase();
  
  // Price mentioned
  if (lowerRep.includes('$') || lowerRep.includes('price') || lowerRep.includes('cost')) {
    return persona.conversationStyle.priceQuestions[0] || "How much?";
  }
  
  // Safety mentioned
  if (lowerRep.includes('safe') || lowerRep.includes('organic') || lowerRep.includes('eco')) {
    return persona.conversationStyle.safetyQuestions[0] || "Is it safe?";
  }
  
  // Process mentioned
  if (lowerRep.includes('process') || lowerRep.includes('how') || lowerRep.includes('work')) {
    return persona.conversationStyle.processQuestions[0] || "How does it work?";
  }
  
  // Return a random objection
  const objections = persona.conversationStyle.objections;
  return objections[Math.floor(Math.random() * Math.min(3, objections.length))];
}

function getLaterResponse(personaId: string, repUtterance: string): string {
  const persona = getPersonaById(personaId);
  if (!persona) return "I need to think about it.";
  
  const lowerRep = repUtterance.toLowerCase();
  
  // Good rapport building detected
  if (lowerRep.includes('neighbor') || lowerRep.includes('understand') || lowerRep.includes('family')) {
    // Warming up
    return persona.conversationStyle.thinkingPhrases[Math.floor(Math.random() * persona.conversationStyle.thinkingPhrases.length)];
  }
  
  // Scheduling attempt
  if (lowerRep.includes('schedule') || lowerRep.includes('appointment') || lowerRep.includes('tomorrow')) {
    if (persona.temperature === 'warm' || persona.temperature === 'interested') {
      return persona.closingBehaviors.acceptance.eager;
    } else {
      return persona.closingBehaviors.consideration.needSpouse;
    }
  }
  
  // Pushy detected
  if (lowerRep.includes('today') || lowerRep.includes('right now') || lowerRep.includes('special')) {
    return persona.closingBehaviors.rejection.firm;
  }
  
  // Default consideration
  return persona.closingBehaviors.consideration.needTime;
}

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
    
    // Get richer responses based on persona data and context
    const personaId = personaData?.id || 'marcus';
    const turnCount = body.turnCount || 0;
    
    // Generate contextual responses based on conversation stage
    let response = '';
    
    if (turnCount === 0) {
      // First response after greeting
      response = getInitialResponse(personaId, repUtterance);
    } else if (turnCount < 3) {
      // Early conversation - more objections and questions
      response = getEarlyResponse(personaId, repUtterance);
    } else {
      // Later conversation - can warm up or shut down
      response = getLaterResponse(personaId, repUtterance);
    }
    
    // Simple terminal condition - end after 6+ exchanges or certain phrases
    const isTerminal = repUtterance.toLowerCase().includes('schedule') || 
                      repUtterance.toLowerCase().includes('not interested') ||
                      body.turnCount > 6;
    
    console.log('Sending AI response:', response);

    return NextResponse.json({ 
      prospectReply: response,
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
