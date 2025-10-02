import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const supabase = await createServiceSupabaseClient()

    const payload: any = {
      user_id: body?.user_id || '00000000-0000-0000-0000-000000000000',
      agent_id: body?.agent_id || null,
      agent_name: body?.agent_name || null,
      agent_persona: body?.agent_persona || null,
      started_at: new Date().toISOString(),
      conversation_metadata: body?.conversation_metadata || {},
    }

    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .insert(payload)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to create session', details: error }, { status: 500 })
    }

    return NextResponse.json({ id: (data as any).id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


