import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = "force-dynamic";
export const runtime = 'nodejs'

/**
 * POST /api/session/transcript
 * Add a transcript entry to a session
 * This is called incrementally as messages come in from ElevenLabs
 */
export async function POST(req: NextRequest) {
  try {
    const { sessionId, speaker, text } = await req.json()
    
    if (!sessionId || !speaker || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, speaker, text' },
        { status: 400 }
      )
    }
    
    if (speaker !== 'user' && speaker !== 'homeowner') {
      return NextResponse.json(
        { error: 'Speaker must be "user" or "homeowner"' },
        { status: 400 }
      )
    }
    
    if (typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: 'Text must be a non-empty string' },
        { status: 400 }
      )
    }
    
    const supabase = await createServiceSupabaseClient()
    
    // Get current transcript
    const { data: session, error: fetchError } = await (supabase as any)
      .from('live_sessions')
      .select('full_transcript')
      .eq('id', sessionId)
      .single()
    
    if (fetchError || !session) {
      console.error('❌ Failed to fetch session:', fetchError)
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    // Initialize transcript array if it doesn't exist
    const currentTranscript = Array.isArray(session.full_transcript) 
      ? session.full_transcript 
      : []
    
    // Create new entry
    const newEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      speaker,
      text: text.trim(),
      timestamp: new Date().toISOString()
    }
    
    // Append to transcript
    const updatedTranscript = [...currentTranscript, newEntry]
    
    // Update database
    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .update({ full_transcript: updatedTranscript })
      .eq('id', sessionId)
      .select('id')
      .single()
    
    if (error) {
      console.error('❌ Failed to save transcript entry:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true,
      entryId: newEntry.id,
      transcriptLength: updatedTranscript.length
    })
  } catch (e: any) {
    console.error('❌ Error in transcript POST:', e)
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/session/transcript?id=sessionId
 * Get transcript for a session
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const sessionId = url.searchParams.get('id')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }
    
    const supabase = await createServiceSupabaseClient()
    
    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .select('full_transcript')
      .eq('id', sessionId)
      .single()
    
    if (error || !data) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      transcript: Array.isArray(data.full_transcript) ? data.full_transcript : [],
      length: Array.isArray(data.full_transcript) ? data.full_transcript.length : 0
    })
  } catch (e: any) {
    console.error('❌ Error in transcript GET:', e)
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

