import { NextResponse } from 'next/server'
import { createServiceSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Complete a training session and trigger grading
export async function POST(_req: Request, context: { params: { id?: string } } | { params: Promise<{ id?: string }> }) {
  try {
    const maybePromiseParams: any = (context as any)?.params
    const params = typeof maybePromiseParams?.then === 'function' ? await maybePromiseParams : maybePromiseParams
    
    const id = params?.id
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid session ID required' }, { status: 400 })
    }
    
    const sessionId = parseInt(id)
    const body = await _req.json()
    const { duration_seconds } = body
    
    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Use service role for updates
    const serviceSupabase = await createServiceSupabaseClient()
    
    // First check if session exists
    const { data: existingSession, error: fetchError } = await (serviceSupabase as any)
      .from('training_sessions')
      .select('id, user_id, transcript, status')
      .eq('id', sessionId)
      .single()
    
    if (fetchError || !existingSession) {
      console.error('Session not found:', sessionId, fetchError)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    // Check if user owns the session
    if (existingSession.user_id !== user.id) {
      console.error('User does not own session:', sessionId, 'user:', user.id, 'owner:', existingSession.user_id)
      return NextResponse.json({ error: 'Unauthorized access to session' }, { status: 403 })
    }
    
    // Mark session as completed
    const { data: completedSession, error: updateError } = await (serviceSupabase as any)
      .from('training_sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        duration_seconds: duration_seconds || 0
      })
      .eq('id', sessionId)
      .select('id, transcript, status')
      .single()
    
    if (updateError || !completedSession) {
      console.error('Error updating session:', updateError)
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
    }
    
    // Trigger background grading if transcript exists
    const transcript = completedSession.transcript || []
    if (Array.isArray(transcript) && transcript.length > 0) {
      console.log(`🎯 Triggering grading for session ${sessionId}`)
      
      // Call grading endpoint in background (don't wait for response)
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/training-sessions/${sessionId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(error => {
        console.error('Background grading failed:', error)
      })
    } else {
      console.warn(`⚠️ No transcript found for session ${sessionId}, skipping grading`)
    }
    
    return NextResponse.json({ 
      id: sessionId,
      status: 'completed',
      redirect_to: `/analytics/${sessionId}`,
      message: 'Session completed successfully'
    })
  } catch (e: any) {
    console.error('Error completing training session:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
