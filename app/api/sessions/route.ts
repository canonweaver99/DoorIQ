import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    console.log('🟢 [SESSIONS API] Create session payload:', body)
    const supabase = await createServiceSupabaseClient()

    const payload: any = {
      user_id: body?.user_id || '00000000-0000-0000-0000-000000000000',
      agent_id: body?.agent_id || null,
      agent_name: body?.agent_name || null,
      agent_persona: body?.agent_persona || null,
      started_at: new Date().toISOString(),
      conversation_metadata: body?.conversation_metadata || {},
    }

    console.log('🟢 [SESSIONS API] Inserting into live_sessions:', payload)
    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .insert(payload)
      .select()
      .single()

    if (error || !data) {
      console.error('🛑 [SESSIONS API] Insert error:', error)
      return NextResponse.json({ error: 'Failed to create session', details: error?.message || error }, { status: 500 })
    }

    const sessionId = String((data as any).id || '')
    console.log('🟢 [SESSIONS API] Session created:', sessionId)
    console.log('🟢 [SESSIONS API] Session ID length:', sessionId.length)
    console.log('🟢 [SESSIONS API] Full session data:', JSON.stringify(data, null, 2))
    
    // Verify the session was actually created - retry a few times as it might take a moment
    let verifyAttempts = 0
    let verifyData = null
    let verifyError = null
    
    while (verifyAttempts < 3) {
      const { data, error } = await (supabase as any)
        .from('live_sessions')
        .select('id, created_at, started_at')
        .eq('id', sessionId)
        .single()
      
      if (data && !error) {
        verifyData = data
        verifyError = null
        break
      }
      
      verifyError = error
      verifyAttempts++
      
      if (verifyAttempts < 3) {
        console.log(`⏳ [SESSIONS API] Verification attempt ${verifyAttempts} failed, retrying...`)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    if (verifyError || !verifyData) {
      console.error('🛑 [SESSIONS API] Verification failed after 3 attempts - session not found!', verifyError)
      return NextResponse.json({ error: 'Session creation verification failed', details: verifyError }, { status: 500 })
    }
    
    console.log('✅ [SESSIONS API] Session verified after', verifyAttempts + 1, 'attempts:', verifyData)
    return NextResponse.json({ id: sessionId })
  } catch (e: any) {
    console.error('🛑 [SESSIONS API] FATAL:', e)
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


