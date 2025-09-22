import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { agentId, userId } = await request.json();

    // Fetch agent data
    const agentResponse = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/agents/${agentId}`
    );
    const { agent } = await agentResponse.json();

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Create conversation session in Supabase
    const { data: session, error } = await supabaseAdmin
      .from('conversation_sessions')
      .insert({
        user_id: userId || 'demo-user',
        agent_id: agent.id,
        status: 'active',
        conversation_history: [],
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Generate initial greeting using OpenAI
    const greeting = await generateAgentResponse(agent, [], 'GREETING');

    // Update session with greeting
    await supabaseAdmin
      .from('conversation_sessions')
      .update({
        conversation_history: [
          { role: 'assistant', content: greeting, timestamp: new Date().toISOString() }
        ]
      })
      .eq('id', session.id);

    return NextResponse.json({
      sessionId: session.id,
      agent: {
        name: agent.name,
        avatar_initials: agent.avatar_initials,
        avatar_url: agent.avatar_url,
        voice_id: agent.voice_id
      },
      greeting
    });

  } catch (error) {
    console.error('Error starting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to start conversation' },
      { status: 500 }
    );
  }
}

async function generateAgentResponse(
  agent: any, 
  conversationHistory: any[], 
  context: string = 'CONVERSATION'
) {
  // Build context from training data
  const trainingContext = agent.training_data
    ?.slice(0, 3) // Use top 3 most relevant docs
    ?.map((doc: any) => `${doc.title}: ${doc.content.substring(0, 500)}`)
    ?.join('\n\n') || '';

  // Build conversation context
  const recentHistory = conversationHistory
    .slice(-6) // Last 6 messages for context
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');

  const systemPrompt = `${agent.system_prompt}

TRAINING CONTEXT:
${trainingContext}

BEHAVIORAL RULES:
${agent.behavioral_rules.join('\n')}

CONVERSATION STYLE:
${JSON.stringify(agent.conversation_style)}

Context: ${context}
Recent conversation:
${recentHistory}

Respond as ${agent.name}. Keep responses natural, 1-3 sentences unless asked for detail.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: context === 'GREETING' ? 
        'Generate a natural greeting as if someone just knocked on your door.' : 
        'Continue the conversation naturally based on the context above.'
      }
    ],
    temperature: agent.temperature || 0.7,
    max_tokens: 150
  });

  return completion.choices[0]?.message?.content || 'Hello, how can I help you?';
}
