import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    console.log('🟢 [SESSIONS API] Create session payload:', body)
    const supabase = await createServiceSupabaseClient()

    // Use client-provided ID if available, otherwise generate one
    const sessionId = body?.id || crypto.randomUUID()
    
    console.log('🟢 [SESSIONS API] Using session ID:', sessionId)
    
    // Check if session already exists
    const { data: existingSession } = await (supabase as any)
      .from('live_sessions')
      .select('id, created_at')
      .eq('id', sessionId)
      .single()
    
    if (existingSession) {
      console.log('⚠️ [SESSIONS API] Session already exists, returning existing ID:', sessionId)
      return NextResponse.json({ id: sessionId, existing: true })
    }
    
    const payload: any = {
      id: sessionId, // Explicitly set the ID
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

    if (error) {
      console.error('🛑 [SESSIONS API] Insert error:', error)
      
      // If it's a duplicate key error, return the ID anyway
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        console.log('⚠️ [SESSIONS API] Duplicate key error, returning ID anyway:', sessionId)
        return NextResponse.json({ id: sessionId, existing: true })
      }
      
      return NextResponse.json({ error: 'Failed to create session', details: error?.message || error }, { status: 500 })
    }
    
    if (!data) {
      console.error('🛑 [SESSIONS API] No data returned after insert')
      return NextResponse.json({ error: 'Failed to create session - no data returned' }, { status: 500 })
    }

    // Return the session ID we used (not from data, to avoid corruption)
    console.log('🟢 [SESSIONS API] Session created with ID:', sessionId)
    console.log('🟢 [SESSIONS API] Session ID length:', sessionId.length)
    
    // Verify the session was actually created - retry a few times as it might take a moment
    let verifyAttempts = 0
    let verifyData = null
    let verifyError = null
    
    while (verifyAttempts < 3) {
      const { data: checkData, error: checkError } = await (supabase as any)
        .from('live_sessions')
        .select('id, created_at, started_at')
        .eq('id', sessionId)
        .single()
      
      if (checkData && !checkError) {
        verifyData = checkData
        verifyError = null
        break
      }
      
      verifyError = checkError
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
    
    console.log('✅ [SESSIONS API] Session verified after', verifyAttempts + 1, 'attempts')
    // Return the original sessionId we generated, not from database
    return NextResponse.json({ id: sessionId })
  } catch (e: any) {
    console.error('🛑 [SESSIONS API] FATAL:', e)
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


