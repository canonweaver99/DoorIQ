import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: Request,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;

    // Fetch agent with training data
    const { data: agent, error } = await supabaseAdmin
      .from('agents')
      .select(`
        *,
        agent_training_docs (
          training_document_id,
          relevance_score,
          category,
          training_documents (
            title,
            content,
            category,
            keywords
          )
        )
      `)
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Format training data for easy access
    const trainingData = agent.agent_training_docs?.map((doc: any) => ({
      title: doc.training_documents.title,
      content: doc.training_documents.content,
      category: doc.category || doc.training_documents.category,
      relevance: doc.relevance_score,
      keywords: doc.training_documents.keywords
    })) || [];

    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        agent_id: agent.agent_id,
        avatar_initials: agent.avatar_initials,
        avatar_url: agent.avatar_url,
        voice_id: agent.voice_id,
        system_prompt: agent.system_prompt,
        persona_description: agent.persona_description,
        conversation_style: agent.conversation_style,
        behavioral_rules: agent.behavioral_rules,
        knowledge_base: agent.knowledge_base,
        training_data: trainingData
      }
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent data' },
      { status: 500 }
    );
  }
}
