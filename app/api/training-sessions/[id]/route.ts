import { NextResponse } from 'next/server'
import { createServiceSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Get single training session
export async function GET(_req: Request, context: { params: { id?: string } } | { params: Promise<{ id?: string }> }) {
  try {
    // Support both Promise and non-Promise params
    const maybePromiseParams: any = (context as any)?.params
    const params = typeof maybePromiseParams?.then === 'function' ? await maybePromiseParams : maybePromiseParams
    
    const id = params?.id
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid session ID required' }, { status: 400 })
    }
    
    const sessionId = parseInt(id)
    
    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Use service role for query
    const serviceSupabase = await createServiceSupabaseClient()
    
    const { data, error } = await (serviceSupabase as any)
      .from('training_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id) // Ensure user can only access their own sessions
      .single()
    
    if (error || !data) {
      console.error('Training session not found:', sessionId, error)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('Error fetching training session:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Update training session (for real-time transcript updates)
export async function PATCH(_req: Request, context: { params: { id?: string } } | { params: Promise<{ id?: string }> }) {
  try {
    const maybePromiseParams: any = (context as any)?.params
    const params = typeof maybePromiseParams?.then === 'function' ? await maybePromiseParams : maybePromiseParams
    
    const id = params?.id
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid session ID required' }, { status: 400 })
    }
    
    const sessionId = parseInt(id)
    const body = await _req.json()
    
    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Use service role for update
    const serviceSupabase = await createServiceSupabaseClient()
    
    // Handle different types of updates
    let updateData: any = {}
    
    if (body.transcript_line) {
      // Append new line to transcript
      const { data: currentSession } = await (serviceSupabase as any)
        .from('training_sessions')
        .select('transcript')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single()
      
      if (!currentSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
      
      const currentTranscript = currentSession.transcript || []
      const newTranscript = [...currentTranscript, body.transcript_line]
      
      updateData.transcript = newTranscript
    }
    
    // Handle other updates (scores, status, etc.)
    if (body.status) updateData.status = body.status
    if (body.ended_at) updateData.ended_at = body.ended_at
    if (body.duration_seconds) updateData.duration_seconds = body.duration_seconds
    if (body.rapport_score !== undefined) updateData.rapport_score = body.rapport_score
    if (body.discovery_score !== undefined) updateData.discovery_score = body.discovery_score
    if (body.objection_handling_score !== undefined) updateData.objection_handling_score = body.objection_handling_score
    if (body.closing_score !== undefined) updateData.closing_score = body.closing_score
    if (body.feedback_strengths) updateData.feedback_strengths = body.feedback_strengths
    if (body.feedback_improvements) updateData.feedback_improvements = body.feedback_improvements
    if (body.virtual_earnings !== undefined) updateData.virtual_earnings = body.virtual_earnings
    if (body.graded_at) updateData.graded_at = body.graded_at
    
    const { data, error } = await (serviceSupabase as any)
      .from('training_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select('id, status, overall_score')
      .single()
    
    if (error) {
      console.error('Error updating training session:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('Error updating training session:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
