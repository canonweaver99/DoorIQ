import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/server/supabase';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id') || 'amanda_001';

    // Prefer agents table (with avatar_url)
    const { data: agent, error } = await supabaseAdmin
      .from('agents')
      .select('name, avatar_url, avatar_initials, persona_description')
      .eq('agent_id', agentId)
      .single();

    if (agent && !error) {
      return NextResponse.json(agent);
    }

    // Fallback: try scenarios.persona.avatar_url if present
    const { data: scenario } = await supabaseAdmin
      .from('scenarios')
      .select('name, persona')
      .limit(1)
      .maybeSingle();

    if (scenario?.persona) {
      return NextResponse.json({
        name: scenario.name || 'Homeowner',
        avatar_url: scenario.persona.avatar_url || null,
        avatar_initials: (scenario.persona.initials || 'AR'),
        persona_description: scenario.persona.description || 'Suburban homeowner'
      });
    }

    // Default
    return NextResponse.json({
      name: 'Amanda Rodriguez',
      avatar_url: null,
      avatar_initials: 'AR',
      persona_description: 'Suburban mom, marketing director, values safety and clear communication'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch agent data' }, { status: 500 });
  }
}
