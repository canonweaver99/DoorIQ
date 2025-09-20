import { NextResponse } from "next/server";
import { getPersonaById } from "@/lib/personas";

// Track conversation context to avoid repetition and create natural flow
const conversationContext = new Map<string, {
  usedResponses: string[];
  topics: string[];
  mood: 'cold' | 'warming' | 'interested' | 'annoyed' | 'ready_to_close';
  lastResponseType: 'question' | 'objection' | 'story' | 'humor' | 'consideration';
}>();

function getConversationFlow(personaId: string, repUtterance: string, attemptId: string, turnCount: number): string {
  const persona = getPersonaById(personaId);
  if (!persona) return "I'm not sure what you're talking about.";
  
  const lowerRep = repUtterance.toLowerCase();
  
  // Initialize or get context
  let context = conversationContext.get(attemptId);
  if (!context) {
    context = {
      usedResponses: [],
      topics: [],
      mood: persona.temperature === 'warm' ? 'warming' : 
            persona.temperature === 'interested' ? 'interested' : 'cold',
      lastResponseType: 'question'
    };
    conversationContext.set(attemptId, context);
  }
  
  // Analyze what the rep said to determine appropriate response
  const repMentions = {
    price: lowerRep.includes('$') || lowerRep.includes('cost') || lowerRep.includes('price') || lowerRep.includes('cheap'),
    safety: lowerRep.includes('safe') || lowerRep.includes('pet') || lowerRep.includes('kid') || lowerRep.includes('child'),
    neighbor: lowerRep.includes('neighbor') || lowerRep.includes('johnson') || lowerRep.includes('street') || lowerRep.includes('area'),
    problem: lowerRep.includes('ant') || lowerRep.includes('bug') || lowerRep.includes('pest') || lowerRep.includes('spider') || lowerRep.includes('mouse') || lowerRep.includes('roach'),
    process: lowerRep.includes('how') || lowerRep.includes('work') || lowerRep.includes('spray') || lowerRep.includes('treat'),
    schedule: lowerRep.includes('schedule') || lowerRep.includes('appointment') || lowerRep.includes('today') || lowerRep.includes('tomorrow'),
    humor: lowerRep.includes('funny') || lowerRep.includes('joke') || lowerRep.includes('laugh'),
    personal: lowerRep.includes('family') || lowerRep.includes('wife') || lowerRep.includes('husband') || lowerRep.includes('work'),
    pushy: lowerRep.includes('special') || lowerRep.includes('limited') || lowerRep.includes('right now') || lowerRep.includes('today only')
  };
  
  // Generate contextual responses based on persona and what rep said
  let response = '';
  
  // Handle different personas differently
  switch (personaId) {
    case 'harold':
      response = getHaroldResponse(repMentions, context, turnCount, lowerRep);
      break;
    case 'amanda':
      response = getAmandaResponse(repMentions, context, turnCount, lowerRep);
      break;
    case 'marcus':
      response = getMarcusResponse(repMentions, context, turnCount, lowerRep);
      break;
    case 'jennifer':
      response = getJenniferResponse(repMentions, context, turnCount, lowerRep);
      break;
    case 'carlos':
      response = getCarlosResponse(repMentions, context, turnCount, lowerRep);
      break;
    default:
      response = getMarcusResponse(repMentions, context, turnCount, lowerRep);
  }
  
  // Track used response and update context
  context.usedResponses.push(response);
  conversationContext.set(attemptId, context);
  
  return response;
}

function getHaroldResponse(mentions: any, context: any, turnCount: number, repText: string): string {
  if (mentions.pushy || turnCount > 6) {
    context.mood = 'annoyed';
    return "Look, I said I need to think about it. Stop pushing me.";
  }
  
  if (mentions.neighbor) {
    context.mood = 'warming';
    return "Oh, you're doing the Johnsons? Well, I suppose if Bob trusts you... he's not the sharpest tool in the shed, but still.";
  }
  
  if (mentions.price) {
    return "How much are we talking here? I'm on a fixed income, not made of money.";
  }
  
  if (mentions.safety) {
    context.mood = 'warming';
    return "Well, I do worry about Whiskers. That cat gets into everything. Is this stuff gonna hurt him?";
  }
  
  if (mentions.problem) {
    return "Yeah, we got ants. Marge has been complaining about them for weeks. But I've been handling pests myself for 40 years.";
  }
  
  if (turnCount === 0) {
    return "What do you want? I'm watching the news.";
  }
  
  // Default progression
  const responses = [
    "I've heard this all before from you people.",
    "What makes you different from the last guy who came by?",
    "Marge! Come here, pest control's at the door!",
    "Alright, you got my attention. But this better not be some scam."
  ];
  
  return responses[Math.min(turnCount, responses.length - 1)];
}

function getAmandaResponse(mentions: any, context: any, turnCount: number, repText: string): string {
  if (mentions.safety) {
    context.mood = 'interested';
    return "Okay, that's actually my biggest concern. Sofia just turned 3 and puts everything in her mouth. Is this really safe once it dries?";
  }
  
  if (mentions.price) {
    return "Okay, but what's the real cost here? I need the full picture because David handles our budget.";
  }
  
  if (mentions.schedule) {
    return "Can you work around nap time? Sofia sleeps from 1 to 3, and that's like... sacred time in this house.";
  }
  
  if (mentions.problem) {
    context.mood = 'interested';
    return "Actually, yes! We've been seeing spiders in the basement where the kids play. It's driving me crazy.";
  }
  
  if (turnCount === 0) {
    return "Hi! Sorry, I literally just walked in from picking up the kids. What's this about?";
  }
  
  if (turnCount > 4 && !mentions.schedule) {
    return "Look, I really need to get dinner started. Can you just tell me when you can come and how much it costs?";
  }
  
  const responses = [
    "I only have like 5 minutes before chaos erupts again.",
    "Hold on - SOFIA, SHARE WITH YOUR BROTHER! Sorry, what were you saying?",
    "That actually makes sense. We tried the DIY stuff but it didn't work.",
    "I'd need to run this by David, but if it's safe for the kids..."
  ];
  
  return responses[Math.min(turnCount - 1, responses.length - 1)];
}

function getMarcusResponse(mentions: any, context: any, turnCount: number, repText: string): string {
  if (mentions.neighbor) {
    context.mood = 'interested';
    return "Oh, you're working with the Garcias? Good people! Maria mentioned they had some bug issues. How's that going?";
  }
  
  if (mentions.problem) {
    context.mood = 'interested';
    return "Actually, funny you mention that. We've been dealing with mice in the garage. They got into my basketball equipment last month!";
  }
  
  if (mentions.price) {
    return "What are we looking at cost-wise? Teacher salary, you know, but if it works...";
  }
  
  if (mentions.humor || repText.includes('joke') || repText.includes('funny')) {
    context.mood = 'warming';
    return "Ha! That's good. I like that. You remind me of one of my students - he's got jokes too.";
  }
  
  if (mentions.schedule) {
    context.mood = 'ready_to_close';
    return "You know what? Let's do it. When can you come out? I'm usually home after 4 PM.";
  }
  
  if (turnCount === 0) {
    return "Hey there! How's it going? Just finished mowing the lawn. What brings you by?";
  }
  
  if (turnCount > 3 && context.mood === 'interested') {
    return "You seem like good people. I appreciate you taking the time to explain everything properly.";
  }
  
  const responses = [
    "That's interesting! Tell me more about how this works.",
    "You know, that reminds me of when we had wasps under the deck last summer...",
    "I try to support local businesses when I can. You guys local?",
    "My wife Keisha's been after me to do something about the mice."
  ];
  
  return responses[Math.min(turnCount - 1, responses.length - 1)];
}

function getJenniferResponse(mentions: any, context: any, turnCount: number, repText: string): string {
  if (mentions.safety) {
    return "What's the active ingredient? I need to know exactly what chemicals you're using and their half-lives.";
  }
  
  if (mentions.process) {
    context.mood = 'warming';
    return "That's actually a scientifically sound approach. Most homeowners don't understand integrated pest management.";
  }
  
  if (mentions.price) {
    return "Cost is less important than efficacy. What's your success rate, and do you have any peer-reviewed studies?";
  }
  
  if (turnCount === 0) {
    return "Yes? I'm Dr. Chen. What exactly are you selling?";
  }
  
  if (mentions.pushy) {
    context.mood = 'annoyed';
    return "I don't make impulsive decisions. Send me your technical documentation and I'll review it.";
  }
  
  if (turnCount > 2 && context.mood === 'warming') {
    return "Your approach seems evidence-based. What certifications do your technicians have?";
  }
  
  const responses = [
    "I need to see data before making any decisions.",
    "What's your company's Better Business Bureau rating?",
    "Do you have EPA registration numbers for your products?",
    "I'll need references from other medical professionals."
  ];
  
  return responses[Math.min(turnCount - 1, responses.length - 1)];
}

function getCarlosResponse(mentions: any, context: any, turnCount: number, repText: string): string {
  if (mentions.price) {
    return "Alright, what's the damage? Just give me the number straight up.";
  }
  
  if (mentions.safety) {
    context.mood = 'interested';
    return "My family's safety comes first. We got three kids and they're always running around. This stuff safe?";
  }
  
  if (mentions.problem) {
    context.mood = 'interested';
    return "Yeah, we got roaches in the kitchen. Elena's embarrassed to have people over. It's driving her crazy.";
  }
  
  if (mentions.schedule) {
    context.mood = 'ready_to_close';
    return "You know what? Let's do it. I'm tired of dealing with this myself. When can you come?";
  }
  
  if (turnCount === 0) {
    return "Yeah? What can I do for you?";
  }
  
  if (mentions.personal) {
    return "I work hard for my family. Got three shops to run and a house full of kids. No time for games.";
  }
  
  const responses = [
    "Just give it to me straight - what's this gonna cost?",
    "I respect honest work. You seem like good people.",
    "Elena's been after me to do something about the bugs.",
    "Alright, you got my attention. What's the deal?"
  ];
  
  return responses[Math.min(turnCount - 1, responses.length - 1)];
}

export async function POST(req: Request) {
  try {
    console.log('Enhanced step endpoint called');
    
    const body = await req.json().catch(() => ({}));
    console.log('Step request body:', body);
    
    const { attemptId, repUtterance, personaData } = body;
    
    if (!repUtterance) {
      return NextResponse.json(
        { error: 'Missing repUtterance' },
        { status: 400 }
      );
    }
    
    const personaId = personaData?.id || 'marcus';
    const turnCount = body.turnCount || 0;
    
    // Generate natural conversation response
    const response = getConversationFlow(personaId, repUtterance, attemptId, turnCount);
    
    // Clean up old conversations (keep last 50)
    if (conversationContext.size > 50) {
      const firstKey = conversationContext.keys().next().value;
      if (firstKey) {
        conversationContext.delete(firstKey);
      }
    }
    
    // More natural terminal conditions
    const lowerRep = repUtterance.toLowerCase();
    const context = conversationContext.get(attemptId);
    const isTerminal = 
      // Positive endings
      (lowerRep.includes('schedule') && lowerRep.includes('appointment')) ||
      (lowerRep.includes('let') && lowerRep.includes('do it')) ||
      lowerRep.includes('sign me up') ||
      lowerRep.includes('sounds good') ||
      // Negative endings  
      lowerRep.includes('not interested') ||
      lowerRep.includes('no thank you') ||
      lowerRep.includes('goodbye') ||
      lowerRep.includes('stop') ||
      response.includes('Stop pushing') ||
      response.includes('Get lost') ||
      // Natural conversation end
      (context?.mood === 'ready_to_close' && turnCount > 3) ||
      // Time limit
      turnCount > 10;
    
    console.log('Sending natural response:', response);

    return NextResponse.json({ 
      prospectReply: response,
      state: isTerminal ? "TERMINAL" : "DISCOVERY",
      terminal: isTerminal,
      objectivesCompleted: turnCount > 2 ? ['1', '2'] : ['1'],
      success: true
    });
  } catch (error) {
    console.error('Enhanced step error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process step',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}