import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Get session with bulletproof UUID handling
export async function GET(_req: Request, context: { params: { id?: string } } | { params: Promise<{ id?: string }> }) {
  try {
    const maybePromiseParams: any = (context as any)?.params
    const params = typeof maybePromiseParams?.then === 'function' ? await maybePromiseParams : maybePromiseParams
    
    const id = params?.id
    if (!id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    console.log('🔍 WORKING: Fetching session:', id)
    
    const serviceSupabase = await createServiceSupabaseClient()
    
    // Use service role to bypass all RLS issues
    const { data, error } = await (serviceSupabase as any)
      .from('live_sessions')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('❌ WORKING: Database error:', error)
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message,
        session_id: id
      }, { status: 500 })
    }
    
    if (!data) {
      console.error('❌ WORKING: Session not found:', id)
      
      // Let's also check what sessions DO exist
      const { data: allSessions } = await (serviceSupabase as any)
        .from('live_sessions')
        .select('id, user_id, agent_name, started_at')
        .order('started_at', { ascending: false })
        .limit(5)
      
      console.log('📊 Recent sessions in database:', allSessions)
      
      return NextResponse.json({ 
        error: 'Session not found',
        session_id: id,
        recent_sessions: allSessions || []
      }, { status: 404 })
    }
    
    console.log('✅ WORKING: Session found:', data.id, 'user:', data.user_id)
    
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('❌ WORKING: Fatal error:', e)
    return NextResponse.json({ 
      error: 'Fatal error',
      message: e.message,
      stack: e.stack
    }, { status: 500 })
  }
}

// Update session
export async function PATCH(_req: Request, context: { params: { id?: string } } | { params: Promise<{ id?: string }> }) {
  try {
    const maybePromiseParams: any = (context as any)?.params
    const params = typeof maybePromiseParams?.then === 'function' ? await maybePromiseParams : maybePromiseParams
    
    const id = params?.id
    if (!id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    const body = await _req.json()
    console.log('🔧 WORKING: Updating session:', id, 'with fields:', Object.keys(body))
    
    const serviceSupabase = await createServiceSupabaseClient()
    
    // Only update fields that definitely exist
    const allowedFields = ['ended_at', 'duration_seconds', 'full_transcript', 'overall_score', 'what_worked', 'what_failed']
    const updateData: any = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }
    
    console.log('📝 WORKING: Update data:', updateData)
    
    const { data, error } = await (serviceSupabase as any)
      .from('live_sessions')
      .update(updateData)
      .eq('id', id)
      .select('id, overall_score, ended_at')
      .single()
    
    if (error) {
      console.error('❌ WORKING: Update failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ WORKING: Session updated successfully:', data)
    
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('❌ WORKING: Update error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
