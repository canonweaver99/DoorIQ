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
    
    const now = new Date().toISOString()

    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .update({
        ended_at: now,
        duration_seconds: duration_seconds,
        full_transcript: formattedTranscript,
        overall_score: null,
        sale_closed: false,
        virtual_earnings: 0,
        return_appointment: false
      })
      .eq('id', id)
      .select('id')
      .single()
    
    if (error) {
      console.error('❌ PATCH: Update failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ PATCH: Session updated successfully:', data.id)
    
    // Trigger grading immediately in the background (fire-and-forget)
    if (formattedTranscript.length > 0) {
      console.log('🎯 PATCH: Triggering background grading for session:', id)
      
      // Fire-and-forget grading request
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/grade/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id })
      }).then(resp => {
        if (resp.ok) {
          console.log('✅ PATCH: Background grading triggered successfully')
        } else {
          console.error('❌ PATCH: Background grading trigger failed:', resp.status)
        }
      }).catch(err => {
        console.error('❌ PATCH: Background grading error:', err)
      })
    } else {
      console.warn('⚠️ PATCH: No transcript to grade')
    }
    
    return NextResponse.json({ id: data.id })
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

// DELETE session by ID (owner only)
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Verify user
    const server = await createServerSupabaseClient()
    const { data: { user } } = await server.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = await createServiceSupabaseClient()
    // Ensure ownership
    const { data: session, error: fetchErr } = await (supabase as any)
      .from('live_sessions')
      .select('id,user_id')
      .eq('id', id)
      .single()
    if (fetchErr || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await (supabase as any)
      .from('live_sessions')
      .delete()
      .eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
