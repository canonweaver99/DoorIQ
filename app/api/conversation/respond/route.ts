import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { sessionId, userMessage } = await request.json();

    // Fetch conversation session
    const { data: session, error } = await supabaseAdmin
      .from('conversation_sessions')
      .select(`
        *,
        agents (
          name,
          system_prompt,
          conversation_style,
          behavioral_rules,
          temperature,
          voice_id,
          agent_training_docs (
            training_documents (title, content, category, keywords)
          )
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const agent = session.agents;
    const history = session.conversation_history || [];

    // Add user message to history
    const updatedHistory = [
      ...history,
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() }
    ];

    // Generate agent response
    const agentResponse = await generateAgentResponse(agent, updatedHistory);

    // Add agent response to history
    const finalHistory = [
      ...updatedHistory,
      { role: 'assistant', content: agentResponse, timestamp: new Date().toISOString() }
    ];

    // Check if conversation should end
    const shouldEnd = checkConversationEnd(agentResponse, userMessage, finalHistory);

    // Update session
    await supabaseAdmin
      .from('conversation_sessions')
      .update({
        conversation_history: finalHistory,
        status: shouldEnd ? 'completed' : 'active',
        ended_at: shouldEnd ? new Date().toISOString() : null
      })
      .eq('id', sessionId);

    return NextResponse.json({
      response: agentResponse,
      voiceId: agent.voice_id,
      isComplete: shouldEnd,
      turnCount: finalHistory.length
    });

  } catch (error) {
    console.error('Error processing response:', error);
    return NextResponse.json(
      { error: 'Failed to process response' },
      { status: 500 }
    );
  }
}

async function generateAgentResponse(agent: any, conversationHistory: any[]) {
  // Build training context
  const trainingData = agent.agent_training_docs?.map((doc: any) => 
    `${doc.training_documents.title}: ${doc.training_documents.content.substring(0, 400)}`
  ).join('\n\n') || '';

  // Recent conversation context
  const recentHistory = conversationHistory
    .slice(-8)
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');

  // Analyze conversation state
  const conversationState = analyzeConversationState(conversationHistory);

  const systemPrompt = `${agent.system_prompt}

TRAINING KNOWLEDGE:
${trainingData}

BEHAVIORAL RULES:
${agent.behavioral_rules?.join('\n') || ''}

CONVERSATION STATE: ${conversationState}

Recent conversation:
${recentHistory}

Respond naturally as ${agent.name}. Consider your personality, the conversation flow, and training knowledge.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Respond to the latest message in the conversation.' }
    ],
    temperature: agent.temperature || 0.7,
    max_tokens: 200
  });

  return completion.choices[0]?.message?.content || 'I see, tell me more.';
}

function analyzeConversationState(history: any[]): string {
  const messageCount = history.length;
  const lastUserMessage = history.filter(h => h.role === 'user').slice(-1)[0]?.content.toLowerCase() || '';
  
  // Check for closing signals
  if (lastUserMessage.includes('schedule') || lastUserMessage.includes('book') || lastUserMessage.includes('sign up')) {
    return 'CLOSING';
  }
  
  // Check for objections
  if (lastUserMessage.includes('not interested') || lastUserMessage.includes('no thanks') || lastUserMessage.includes('think about it')) {
    return 'OBJECTION_HANDLING';
  }
  
  // Check for questions about pricing
  if (lastUserMessage.includes('cost') || lastUserMessage.includes('price') || lastUserMessage.includes('expensive')) {
    return 'PRICING_DISCUSSION';
  }
  
  // Check conversation stage
  if (messageCount <= 4) return 'OPENING';
  if (messageCount <= 10) return 'DISCOVERY';
  if (messageCount <= 16) return 'PRESENTATION';
  
  return 'CLOSING';
}

function checkConversationEnd(agentResponse: string, userMessage: string, history: any[]): boolean {
  const lowerAgent = agentResponse.toLowerCase();
  const lowerUser = userMessage.toLowerCase();
  
  // Positive endings
  if (lowerAgent.includes('schedule') && lowerAgent.includes('appointment')) return true;
  if (lowerUser.includes('book') || lowerUser.includes('schedule')) return true;
  
  // Negative endings
  if (lowerUser.includes('not interested') && lowerAgent.includes('understand')) return true;
  if (lowerUser.includes('no thanks') && history.length > 6) return true;
  
  // Long conversation
  if (history.length > 20) return true;
  
  return false;
}
