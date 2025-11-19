import { NextResponse } from 'next/server'
import { createServiceSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// CREATE session
export async function POST(req: Request) {
  try {
    const { agent_name, agent_id } = await req.json()
    
    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Create session with service role
    const serviceSupabase = await createServiceSupabaseClient()
    const sessionData: any = {
      user_id: user.id,
      agent_name: agent_name,
      started_at: new Date().toISOString()
    }
    
    // Add agent_id if provided
    if (agent_id) {
      sessionData.agent_id = agent_id
    }
    
    const { data, error } = await (serviceSupabase as any)
      .from('live_sessions')
      .insert(sessionData)
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
    const { id, transcript, duration_seconds, end_reason, agent_name, homeowner_name, agent_persona } = await req.json()
    
    console.log('🔧 PATCH: Updating session:', id)
    console.log('📝 PATCH: Transcript lines:', transcript?.length || 0)
    console.log('📝 PATCH: Transcript type:', Array.isArray(transcript) ? 'array' : typeof transcript)
    console.log('📝 PATCH: Transcript is null/undefined:', transcript === null || transcript === undefined)
    console.log('⏱️ PATCH: Duration:', duration_seconds)
    if (end_reason) {
      console.log('📊 PATCH: End reason:', end_reason)
    }
    
    // WARNING: If transcript is empty, log it for debugging
    if (!transcript || (Array.isArray(transcript) && transcript.length === 0)) {
      console.warn('⚠️ WARNING: Empty transcript received! This may indicate a problem.')
      console.warn('⚠️ Session ID:', id)
      console.warn('⚠️ End reason:', end_reason)
    }
    
    const supabase = await createServiceSupabaseClient()
    
    // Convert transcript to ensure proper format
    const formattedTranscript = transcript && Array.isArray(transcript)
      ? transcript.map((entry: any) => ({
          speaker: entry.speaker,
          text: entry.text || entry.message || '',
          timestamp: entry.timestamp ? new Date(entry.timestamp).toISOString() : new Date().toISOString()
        }))
      : []
    
    console.log('📝 PATCH: Formatted transcript lines:', formattedTranscript.length)
    if (formattedTranscript.length > 0) {
      console.log('📝 PATCH: Formatted transcript sample:', formattedTranscript[0])
    } else {
      console.warn('⚠️ PATCH: Formatted transcript is empty!')
    }
    
    const now = new Date().toISOString()

    // Build update object with all provided fields
    const updateData: any = {
      ended_at: now,
      duration_seconds: duration_seconds,
      full_transcript: formattedTranscript,
      overall_score: null,
      sale_closed: false,
      virtual_earnings: 0,
      return_appointment: false
    }
    
    // Add optional fields if provided
    if (agent_name) updateData.agent_name = agent_name
    if (homeowner_name) updateData.homeowner_name = homeowner_name
    if (agent_persona) updateData.agent_persona = agent_persona
    if (end_reason) updateData.end_reason = end_reason

    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .update(updateData)
      .eq('id', id)
      .select('id, full_transcript')
      .single()
    
    if (error) {
      console.error('❌ PATCH: Update failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Verify the transcript was actually saved
    const savedTranscript = data.full_transcript
    console.log('✅ PATCH: Session updated successfully:', {
      id: data.id,
      transcriptSaved: !!savedTranscript,
      transcriptLength: Array.isArray(savedTranscript) ? savedTranscript.length : 0
    })
    
    if (!savedTranscript || (Array.isArray(savedTranscript) && savedTranscript.length === 0)) {
      console.error('❌ CRITICAL: Transcript was NOT saved to database!', {
        sessionId: id,
        updateDataTranscriptLength: formattedTranscript.length,
        savedTranscriptLength: Array.isArray(savedTranscript) ? savedTranscript.length : 'N/A'
      })
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
    
    // Add caching headers for GET requests
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
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
