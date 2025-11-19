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
    console.log('⏱️ PATCH: Duration:', duration_seconds)
    if (end_reason) {
      console.log('📊 PATCH: End reason:', end_reason)
    }
    
    // CRITICAL: Validate transcript before processing
    if (!transcript || !Array.isArray(transcript)) {
      console.error('❌ PATCH: Invalid transcript format - not an array:', typeof transcript)
      return NextResponse.json({ error: 'Transcript must be an array' }, { status: 400 })
    }
    
    if (transcript.length === 0) {
      console.error('❌ PATCH: CRITICAL - Transcript is empty! Session:', id)
      console.error('❌ This will cause grading to fail. Check why transcript was not collected.')
    }
    
    const supabase = await createServiceSupabaseClient()
    
    // Convert transcript to ensure proper format and filter invalid entries
    const formattedTranscript = transcript
      .filter((entry: any) => {
        // Filter out invalid entries
        if (!entry || typeof entry !== 'object') {
          console.warn('⚠️ PATCH: Skipping invalid transcript entry (not an object):', entry)
          return false
        }
        if (!entry.speaker || (entry.speaker !== 'user' && entry.speaker !== 'homeowner')) {
          console.warn('⚠️ PATCH: Skipping transcript entry with invalid speaker:', entry.speaker)
          return false
        }
        if (!entry.text || typeof entry.text !== 'string' || !entry.text.trim()) {
          console.warn('⚠️ PATCH: Skipping transcript entry with empty text:', entry)
          return false
        }
        return true
      })
      .map((entry: any) => ({
        speaker: entry.speaker,
        text: entry.text.trim(),
        timestamp: entry.timestamp ? new Date(entry.timestamp).toISOString() : new Date().toISOString()
      }))
    
    console.log('📝 PATCH: Formatted transcript entries:', formattedTranscript.length)
    console.log('📝 PATCH: Formatted transcript sample:', formattedTranscript[0])
    
    if (formattedTranscript.length === 0 && transcript.length > 0) {
      console.error('❌ PATCH: CRITICAL - All transcript entries were filtered out as invalid!')
      console.error('❌ Original transcript:', JSON.stringify(transcript.slice(0, 5), null, 2))
      return NextResponse.json({ 
        error: 'All transcript entries are invalid. Cannot save empty transcript.',
        details: 'Transcript entries must have valid speaker (user/homeowner) and non-empty text'
      }, { status: 400 })
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
      console.error('❌ Error details:', JSON.stringify(error, null, 2))
      console.error('❌ Update data:', JSON.stringify(updateData, null, 2))
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Verify transcript was saved
    const savedTranscriptLength = data?.full_transcript?.length || 0
    console.log('✅ PATCH: Session updated successfully:', data.id)
    console.log('✅ PATCH: Saved transcript length:', savedTranscriptLength)
    
    if (savedTranscriptLength === 0 && formattedTranscript.length > 0) {
      console.error('❌ PATCH: CRITICAL - Transcript was not saved properly!')
      console.error('❌ Expected:', formattedTranscript.length, 'entries')
      console.error('❌ Saved:', savedTranscriptLength, 'entries')
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
