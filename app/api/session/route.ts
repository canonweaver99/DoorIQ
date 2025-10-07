import { NextResponse } from 'next/server'
import { createServiceSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// CREATE session
export async function POST(req: Request) {
  try {
    const { agent_name } = await req.json()
    
    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Create session with service role
    const serviceSupabase = await createServiceSupabaseClient()
    const { data, error } = await (serviceSupabase as any)
      .from('live_sessions')
      .insert({
        user_id: user.id,
        agent_name: agent_name,
        started_at: new Date().toISOString()
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('Session creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ id: data.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// UPDATE session (save transcript and scores)
export async function PATCH(req: Request) {
  try {
    const { id, transcript, duration_seconds } = await req.json()
    
    console.log('🔧 PATCH: Updating session:', id)
    console.log('📝 PATCH: Transcript lines:', transcript?.length || 0)
    console.log('⏱️ PATCH: Duration:', duration_seconds)
    
    const supabase = await createServiceSupabaseClient()
    
    // Convert transcript to ensure proper format
    const formattedTranscript = transcript
      ? transcript.map((entry: any) => ({
          speaker: entry.speaker,
          text: entry.text,
          timestamp: entry.timestamp ? new Date(entry.timestamp).toISOString() : new Date().toISOString()
        }))
      : []
    
    console.log('📝 PATCH: Formatted transcript sample:', formattedTranscript[0])
    
    // Simple heuristic scoring
    const repLines = formattedTranscript.filter((l: any) => l.speaker === 'rep' || l.speaker === 'user')
    const score = Math.min(100, Math.max(50, repLines.length * 15))
    
    console.log('📊 PATCH: Calculated score:', score, 'from', repLines.length, 'rep lines')
    
    const now = new Date().toISOString()

    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .update({
        ended_at: now,
        duration_seconds: duration_seconds,
        full_transcript: formattedTranscript,
        overall_score: score,
        analytics: {
          graded_at: now,
          grading_version: 'manual-placeholder',
          feedback: {
            strengths: ['Completed the training session', 'Engaged with the agent'],
            improvements: ['Keep practicing to improve your skills'],
            specific_tips: []
          }
        }
      })
      .eq('id', id)
      .select('id')
      .single()
    
    if (error) {
      console.error('❌ PATCH: Update failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ PATCH: Session updated successfully:', data.id)
    return NextResponse.json({ id: data.id, score: score })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET session by ID
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    const supabase = await createServiceSupabaseClient()
    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !data) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
