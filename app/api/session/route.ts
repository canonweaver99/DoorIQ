import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/server/supabase';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { data: session, error } = await supabaseAdmin
      .from('sessions')
      .insert([{ user_id: null }]) // Add real user_id when auth is ready
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
