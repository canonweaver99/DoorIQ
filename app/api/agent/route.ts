import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/server/supabase';

export const runtime = 'edge';

export async function GET() {
  try {
    // Fetch Amanda's agent data from the existing agents table
    const { data: agent, error } = await supabaseAdmin
      .from('agents')
      .select('name, avatar_url, avatar_initials, persona_description')
      .eq('agent_id', 'amanda_001')
      .single();

    if (error || !agent) {
      // Return default Amanda data if not found
      return NextResponse.json({
        name: 'Amanda Rodriguez',
        avatar_url: null,
        avatar_initials: 'AR',
        persona_description: 'Suburban mom, marketing director, values safety and clear communication'
      });
    }

    return NextResponse.json(agent);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch agent data' }, { status: 500 });
  }
}
