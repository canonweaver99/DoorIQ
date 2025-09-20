import type { SimState, SimResult } from "./types";

export function inferNextState(
  current: SimState, 
  rep: string, 
  prospect: string
): { next: SimState; terminal?: SimResult } {
  const repLower = rep.toLowerCase();
  const prospectLower = prospect.toLowerCase();
  const combinedText = (rep + " " + prospect).toLowerCase();

  // Hard terminal: explicit rejections for door-to-door pest control
  const hardRejections = [
    'not interested',
    'go away',
    'no soliciting',
    'leave me alone',
    'don\'t need pest control',
    'we\'re fine',
    'get off my property',
    'don\'t come back',
    'absolutely not',
    'we handle it ourselves'
  ];
  
  const isHardRejection = hardRejections.some(phrase => prospectLower.includes(phrase));
  if (isHardRejection) {
    return { next: "TERMINAL", terminal: "rejected" };
  }

  // Success terminal: explicit advancement for pest control
  const advancementPhrases = [
    'schedule the inspection',
    'book the service',
    'when can you come',
    'let\'s set up the appointment',
    'sounds good, when',
    'yes, let\'s do it',
    'sign me up',
    'we\'ll try it',
    'let\'s get started',
    'come back tomorrow',
    'what time works'
  ];
  
  const isAdvancement = advancementPhrases.some(phrase => prospectLower.includes(phrase));
  if (isAdvancement) {
    return { next: "TERMINAL", terminal: "advanced" };
  }

  // Closed deal indicators
  const closedPhrases = [
    'we\'ll sign',
    'where do i sign',
    'let\'s get started',
    'we want to move forward',
    'you have a deal',
    'we\'re ready to buy'
  ];
  
  const isClosed = closedPhrases.some(phrase => prospectLower.includes(phrase));
  if (isClosed) {
    return { next: "TERMINAL", terminal: "closed" };
  }

  // State transitions based on conversation content
  
  // CTA detection in rep's message
  const ctaPhrases = [
    'book', 'schedule', 'calendar', 'demo', 'call', 'meeting', 
    '15 min', '20 min', 'tomorrow at', 'next week', 'available',
    'when would', 'what time', 'send you a link'
  ];
  const repHasCTA = ctaPhrases.some(phrase => repLower.includes(phrase));

  // Objection detection in prospect's message - pest control specific
  const objectionPhrases = [
    'too expensive', 'don\'t have bugs', 'use diy sprays', 'no time', 
    'not a priority', 'maybe later', 'need to think about it', 'talk to spouse',
    'not in the budget', 'happy with current', 'what chemicals',
    'safe for pets', 'safe for kids', 'had bad experience', 'send me information'
  ];
  const prospectHasObjection = objectionPhrases.some(phrase => prospectLower.includes(phrase));

  // Discovery questions from prospect - pest control specific
  const discoveryQuestions = [
    'how does', 'what is', 'can you explain', 'tell me more', 
    'how much', 'what about', 'how long', 'what chemicals',
    'how often', 'what\'s included', 'safe for', 'what pests',
    'how do you', 'what if', 'do you guarantee'
  ];
  const prospectAsksQuestions = discoveryQuestions.some(phrase => prospectLower.includes(phrase));

  // Value/benefit interest - pest control specific
  const valueInterest = [
    'peace of mind', 'prevention', 'protect family', 'health benefits',
    'safe treatment', 'effective', 'results', 'benefits', 'guarantee',
    'prevent damage', 'save money', 'professional grade'
  ];
  const prospectInterestInValue = valueInterest.some(phrase => prospectLower.includes(phrase));

  // FSM logic
  switch (current) {
    case "OPENING":
      if (prospectHasObjection) return { next: "OBJECTION" };
      if (prospectAsksQuestions) return { next: "DISCOVERY" };
      return { next: "DISCOVERY" };
      
    case "DISCOVERY":
      if (prospectHasObjection) return { next: "OBJECTION" };
      if (prospectInterestInValue || prospectAsksQuestions) return { next: "VALUE" };
      if (repHasCTA) return { next: "CTA" };
      return { next: "VALUE" };
      
    case "VALUE":
      if (prospectHasObjection) return { next: "OBJECTION" };
      if (repHasCTA) return { next: "CTA" };
      // Stay in value if they're asking more questions
      if (prospectAsksQuestions) return { next: "VALUE" };
      return { next: "CTA" };
      
    case "OBJECTION":
      // After handling objection, where do we go?
      if (repHasCTA) return { next: "CTA" };
      if (prospectInterestInValue) return { next: "VALUE" };
      if (prospectAsksQuestions) return { next: "DISCOVERY" };
      // If objection not resolved, stay here
      if (prospectHasObjection) return { next: "OBJECTION" };
      return { next: "VALUE" };
      
    case "CTA":
      if (prospectHasObjection) return { next: "OBJECTION" };
      // If they're asking scheduling questions, move to scheduling
      if (combinedText.includes('when') || combinedText.includes('time') || combinedText.includes('available')) {
        return { next: "SCHEDULING" };
      }
      // Stay in CTA until resolved
      return { next: "CTA" };
      
    case "SCHEDULING":
      if (prospectHasObjection) return { next: "OBJECTION" };
      // If scheduling details are being worked out, this often leads to advancement
      if (combinedText.includes('calendar') || combinedText.includes('confirm')) {
        return { next: "TERMINAL", terminal: "advanced" };
      }
      return { next: "SCHEDULING" };
      
    case "TERMINAL":
      return { next: "TERMINAL" };
      
    default:
      return { next: "DISCOVERY" };
  }
}

// Check if conversation should naturally terminate
export function shouldTerminate(
  turnCount: number,
  state: SimState,
  lastProspectMessage: string,
  lastRepMessage: string
): { terminal: boolean; result?: SimResult; reason?: string } {
  
  // Too many turns without progress
  if (turnCount > 20) {
    return { 
      terminal: true, 
      result: "rejected", 
      reason: "Conversation exceeded maximum length without resolution" 
    };
  }

  // Prospect is clearly done
  const donePhrases = [
    'i have to go',
    'this isn\'t working',
    'i\'m not interested',
    'please stop',
    'goodbye',
    'have a nice day'
  ];
  
  const prospectIsDone = donePhrases.some(phrase => 
    lastProspectMessage.toLowerCase().includes(phrase)
  );
  
  if (prospectIsDone) {
    return { 
      terminal: true, 
      result: "rejected", 
      reason: "Prospect ended conversation" 
    };
  }

  // Rep gave up or ended positively
  const repEndPhrases = [
    'thanks for your time',
    'have a great day',
    'i\'ll follow up',
    'talk soon'
  ];
  
  const repIsEnding = repEndPhrases.some(phrase => 
    lastRepMessage.toLowerCase().includes(phrase)
  );
  
  if (repIsEnding && state !== "TERMINAL") {
    // Determine result based on how far they got
    if (state === "CTA" || state === "SCHEDULING") {
      return { terminal: true, result: "advanced", reason: "Rep concluded with next steps" };
    } else {
      return { terminal: true, result: "rejected", reason: "Rep concluded without advancement" };
    }
  }

  return { terminal: false };
}

// Analyze conversation quality for real-time feedback
export function analyzeConversationQuality(turns: any[]): {
  discoveryScore: number;
  valueScore: number;
  objectionScore: number;
  ctaScore: number;
  suggestions: string[];
} {
  const repTurns = turns.filter(t => t.role === 'rep');
  const prospectTurns = turns.filter(t => t.role === 'prospect');
  
  let discoveryScore = 0;
  let valueScore = 0;
  let objectionScore = 0;
  let ctaScore = 0;
  const suggestions: string[] = [];

  // Discovery analysis
  const discoveryQuestions = repTurns.filter(turn => 
    /\?/.test(turn.text) && 
    /(what|how|when|where|why|tell me|can you|would you)/i.test(turn.text)
  ).length;
  
  discoveryScore = Math.min(25, discoveryQuestions * 5);
  if (discoveryScore < 15) {
    suggestions.push("Ask more discovery questions to understand their specific needs");
  }

  // Value analysis
  const valueStatements = repTurns.filter(turn =>
    /(save|reduce|increase|improve|roi|return|benefit|value)/i.test(turn.text)
  ).length;
  
  valueScore = Math.min(25, valueStatements * 8);
  if (valueScore < 15) {
    suggestions.push("Connect your solution more clearly to their specific business value");
  }

  // Objection handling
  const objections = prospectTurns.filter(turn =>
    /(but|however|concern|worry|problem|expensive|budget|time)/i.test(turn.text)
  ).length;
  
  const objectionResponses = repTurns.filter((turn, i) => {
    const nextProspectTurn = prospectTurns.find(pt => 
      new Date(pt.ts) > new Date(turn.ts)
    );
    return nextProspectTurn && /(understand|appreciate|makes sense)/i.test(turn.text);
  }).length;
  
  objectionScore = objections > 0 ? Math.min(25, (objectionResponses / objections) * 25) : 20;
  
  // CTA analysis
  const ctaAttempts = repTurns.filter(turn =>
    /(schedule|book|calendar|demo|call|meeting|next step|move forward)/i.test(turn.text)
  ).length;
  
  ctaScore = Math.min(25, ctaAttempts * 12);
  if (ctaScore < 15) {
    suggestions.push("Include a clear call-to-action with specific next steps");
  }

  return {
    discoveryScore,
    valueScore,
    objectionScore,
    ctaScore,
    suggestions
  };
}
