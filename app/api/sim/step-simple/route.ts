import { NextResponse } from "next/server";
import { getPersonaById } from "@/lib/personas";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Track conversation history for context
const conversationHistory = new Map<string, Array<{role: 'user' | 'assistant', content: string}>>();

function getPersonaPrompt(persona: any, turnCount: number): string {
  const basePrompt = `You are ${persona.name}, a ${persona.age}-year-old ${persona.occupation}. 

PERSONALITY: ${persona.personality}
CURRENT MOOD: ${persona.currentMood}
CURRENT ACTIVITY: ${persona.currentActivity}

BACKGROUND:
- Family: ${persona.backgroundInfo.maritalStatus}, ${persona.backgroundInfo.familySize} people in household
- Home: ${persona.backgroundInfo.propertyType}, lived here ${persona.backgroundInfo.yearsInHome} years
- Known pest issues: ${persona.backgroundInfo.previousPestIssues?.join(', ') || 'none mentioned'}
- Financial situation: ${persona.backgroundInfo.financialStatus}

BEHAVIORAL TRAITS:
- Door behavior: ${persona.behavioralPatterns.doorAnswerSpeed}, ${persona.behavioralPatterns.doorOpeningStyle}
- Voice tone: ${persona.behavioralPatterns.voiceTone}
- Trust signals: ${persona.behavioralPatterns.trustSignals.join(', ')}
- Decision making: ${persona.behavioralPatterns.decisionMakingStyle}

CONVERSATION STYLE:
- Temperament: ${persona.conversationStyle.temperament}
- Common phrases: ${persona.conversationStyle.commonPhrases.slice(0, 3).join(', ')}
- Main objections: ${persona.conversationStyle.objections.slice(0, 3).join(', ')}
- Interests: ${persona.conversationStyle.interests.join(', ')}

INSTRUCTIONS:
1. Respond as this specific person would, using their voice, concerns, and personality
2. Reference your specific background details naturally when relevant
3. Keep responses conversational and realistic (1-2 sentences usually)
4. Show genuine reactions to what the salesperson actually says
5. Use interruptions, side comments, or distractions occasionally: ${persona.conversationStyle.sideConversations?.slice(0, 2).join(', ') || 'none'}
6. Your mood can change based on how the salesperson treats you
7. Ask follow-up questions when curious
8. Give realistic objections based on your character
9. Don't reveal information the salesperson hasn't earned through good questions
10. Be more receptive if they mention neighbors, show expertise, or address your specific concerns

Current conversation turn: ${turnCount}

Respond ONLY as ${persona.name} would respond. Do not break character or mention this is a simulation.`;

  return basePrompt;
}

export async function POST(req: Request) {
  try {
    console.log('AI-powered step endpoint called');
    
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
    const persona = getPersonaById(personaId);
    
    if (!persona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 400 }
      );
    }
    
    // Get or initialize conversation history
    let history = conversationHistory.get(attemptId) || [];
    
    // Add the user's message to history
    history.push({ role: 'user', content: repUtterance });
    
    // Create the persona prompt
    const systemPrompt = getPersonaPrompt(persona, turnCount);
    
    try {
      // Call OpenAI to generate a contextual response
      const completion = await openai.chat.completions.create({
        model: process.env.MODEL_NAME || 'gpt-4o-mini',
        temperature: 0.8, // Higher temperature for more natural variation
        max_tokens: 150, // Keep responses concise
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-6), // Keep last 6 messages for context (3 exchanges)
        ],
      });

      const response = completion.choices[0]?.message?.content?.trim() || "I'm not sure what to say to that.";
      
      // Add AI response to history
      history.push({ role: 'assistant', content: response });
      
      // Store updated history (keep last 10 messages)
      conversationHistory.set(attemptId, history.slice(-10));
      
      // Clean up old conversations (keep last 20 attempts)
      if (conversationHistory.size > 20) {
        const firstKey = conversationHistory.keys().next().value;
        if (firstKey) {
          conversationHistory.delete(firstKey);
        }
      }
      
      // Determine if conversation should end
      const lowerRep = repUtterance.toLowerCase();
      const lowerResponse = response.toLowerCase();
      
      const isTerminal = 
        // Positive endings
        (lowerRep.includes('schedule') && lowerResponse.includes('yes')) ||
        lowerResponse.includes('let\'s do it') ||
        lowerResponse.includes('sounds good') ||
        lowerResponse.includes('when can you') ||
        // Negative endings  
        lowerResponse.includes('not interested') ||
        lowerResponse.includes('no thank you') ||
        lowerResponse.includes('goodbye') ||
        lowerResponse.includes('please leave') ||
        lowerResponse.includes('get off my property') ||
        // Time/turn limits
        turnCount > 12;
      
      console.log('AI generated response:', response);

      return NextResponse.json({ 
        prospectReply: response,
        state: isTerminal ? "TERMINAL" : "DISCOVERY",
        terminal: isTerminal,
        objectivesCompleted: turnCount > 2 ? ['1', '2'] : ['1'],
        success: true
      });
      
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      
      // Fallback to basic response if OpenAI fails
      const fallbackResponses = {
        harold: "I need to think about this. What exactly are you offering?",
        amanda: "I'm sorry, I'm really busy right now. Can you be quick?",
        marcus: "That's interesting. Tell me more about how this works.",
        jennifer: "I'll need to see some data before making any decisions.",
        carlos: "Just give it to me straight - what's this going to cost?"
      };
      
      const fallbackResponse = fallbackResponses[personaId as keyof typeof fallbackResponses] || fallbackResponses.marcus;
      
      return NextResponse.json({ 
        prospectReply: fallbackResponse,
        state: "DISCOVERY",
        terminal: false,
        objectivesCompleted: ['1'],
        success: true
      });
    }
    
  } catch (error) {
    console.error('Step endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process step',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}