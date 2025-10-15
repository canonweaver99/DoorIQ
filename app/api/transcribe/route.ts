import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { fileUrl, filename } = await request.json()

    if (!fileUrl || !filename) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Download file from URL
    const response = await fetch(fileUrl)
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
    }

    const blob = await response.blob()
    
    // Create a File object for OpenAI
    const file = new File([blob], filename, { type: blob.type })

    console.log('Transcribing file:', filename, 'Size:', blob.size)

    // Transcribe with OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'verbose_json',
    })

    console.log('Transcription complete, duration:', transcription.duration)

    // Format transcript with basic speaker detection
    // For now, we'll use a simple alternating pattern, but this should be improved
    const formattedTranscript = await formatTranscriptWithSpeakers(transcription)

    // Create session in database
    const supabase = await createServiceSupabaseClient()
    
    // Get the authenticated user from server-side
    const { createServerSupabaseClient } = await import('@/lib/supabase/server')
    const serverSupabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create a new session
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .insert({
        user_id: user.id,
        agent_name: 'Uploaded Recording',
        agent_id: 'uploaded',
        full_transcript: formattedTranscript,
        audio_url: fileUrl,
        duration_seconds: Math.floor(transcription.duration || 0),
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        upload_type: 'file_upload' as const
      })
      .select('id')
      .single()

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    return NextResponse.json({
      transcript: formattedTranscript,
      sessionId: session.id,
      duration: transcription.duration
    })

  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Transcription failed' 
    }, { status: 500 })
  }
}

async function formatTranscriptWithSpeakers(transcription: any) {
  // Extract text from transcription
  const fullText = transcription.text || ''
  
  // Split into sentences for basic formatting
  const sentences = fullText.match(/[^.!?]+[.!?]+/g) || []
  
  // For now, create a simple alternating pattern
  // In production, you'd want to use speaker diarization or GPT-4 to identify speakers
  const formatted = sentences.map((sentence: string, index: number) => ({
    speaker: index % 2 === 0 ? 'rep' : 'customer',
    text: sentence.trim(),
    timestamp: new Date().toISOString() // Placeholder timestamp
  }))

  // If we have segments with timestamps, use those instead
  if (transcription.segments && Array.isArray(transcription.segments)) {
    return transcription.segments.map((segment: any, index: number) => ({
      speaker: index % 2 === 0 ? 'rep' : 'customer',
      text: segment.text,
      timestamp: new Date(segment.start * 1000).toISOString()
    }))
  }

  return formatted
}
