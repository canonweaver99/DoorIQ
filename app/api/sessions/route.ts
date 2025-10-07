import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('Creating session...')
    
    const supabase = await createServiceSupabaseClient()

    // Simple insert with auto-generated UUID
    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .insert({
        user_id: body.user_id,
        agent_id: body.agent_id,
        agent_name: body.agent_name,
        agent_persona: body.agent_persona,
        started_at: new Date().toISOString(),
        conversation_metadata: body.conversation_metadata || {},
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating session:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Session created:', data.id)
    return NextResponse.json({ id: data.id })
  } catch (e: any) {
    console.error('Fatal error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
