export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

// Lazy initialize OpenAI to avoid build-time errors
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
}

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

    const openai = getOpenAIClient()
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

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

    // Ensure transcript is always a valid array
    if (!Array.isArray(formattedTranscript)) {
      console.error('Invalid transcript format:', formattedTranscript)
      return NextResponse.json({ 
        error: 'Failed to format transcript',
        details: 'Transcript must be an array'
      }, { status: 500 })
    }

    // Get the authenticated user from server-side
    const { createServerSupabaseClient } = await import('@/lib/supabase/server')
    const serverSupabase = await createServerSupabaseClient()
    const { data: { user: authUser }, error: authError } = await serverSupabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // CRITICAL: Get user ID from users table (not auth) to ensure foreign key constraint
    const supabase = await createServiceSupabaseClient()
    
    let { data: userRecord } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.id)
      .maybeSingle()
    
    // Create user record if missing
    if (!userRecord) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          rep_id: `REP-${Date.now().toString().slice(-6)}`,
          role: 'rep',
          virtual_earnings: 0,
        })
        .select('id')
        .single()
      
      if (createError && createError.code !== '23505') {
        return NextResponse.json({ 
          error: 'Failed to create user profile',
          details: createError.message
        }, { status: 500 })
      }
      userRecord = newUser
    }

    // Ensure duration is at least 1 second (some files might have 0 duration)
    const durationSeconds = Math.max(1, Math.floor(transcription.duration || 0))

    // Create a new session - use ID from users table
    const sessionData: any = {
      user_id: userRecord?.id || authUser.id, // Use ID from users table
      agent_name: 'Uploaded Recording',
      full_transcript: formattedTranscript,
      audio_url: fileUrl,
      duration_seconds: durationSeconds,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      upload_type: 'file_upload'
      // Note: agent_id is optional and not included for uploaded recordings
    }
    
    const { data: session, error: sessionError } = await (supabase as any)
      .from('live_sessions')
      .insert(sessionData)
      .select('id')
      .single()

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      console.error('Error details:', JSON.stringify(sessionError, null, 2))
      console.error('Session data attempted:', JSON.stringify(sessionData, null, 2))
      return NextResponse.json({ 
        error: 'Failed to create session',
        details: sessionError.message || JSON.stringify(sessionError),
        code: sessionError.code,
        hint: sessionError.hint
      }, { status: 500 })
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
  
  // If we have segments with timestamps, use those instead
  if (transcription.segments && Array.isArray(transcription.segments) && transcription.segments.length > 0) {
    return transcription.segments.map((segment: any, index: number) => {
      // Convert seconds to MM:SS format for timestamp
      const totalSeconds = Math.floor(segment.start || 0)
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`
      
      return {
        speaker: index % 2 === 0 ? 'rep' : 'customer',
        text: segment.text || '',
        timestamp: new Date(segment.start * 1000).toISOString() // Keep ISO for internal use
      }
    })
  }
  
  // Split into sentences for basic formatting
  const sentences = fullText.match(/[^.!?]+[.!?]+/g) || []
  
  // If no sentences found but we have text, use the whole text as one entry
  if (sentences.length === 0 && fullText.trim().length > 0) {
    return [{
      speaker: 'rep',
      text: fullText.trim(),
      timestamp: new Date().toISOString()
    }]
  }
  
  // For now, create a simple alternating pattern
  // In production, you'd want to use speaker diarization or GPT-4 to identify speakers
  // Estimate timestamps based on sentence position (rough estimate: 3 seconds per sentence)
  const formatted = sentences.map((sentence: string, index: number) => {
    const estimatedSeconds = index * 3
    const minutes = Math.floor(estimatedSeconds / 60)
    const seconds = estimatedSeconds % 60
    const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`
    
    return {
      speaker: index % 2 === 0 ? 'rep' : 'customer',
      text: sentence.trim(),
      timestamp: new Date(Date.now() + estimatedSeconds * 1000).toISOString() // ISO timestamp for internal use
    }
  })

  // Ensure we always return at least one entry (even if empty)
  if (formatted.length === 0) {
    return [{
      speaker: 'rep',
      text: fullText.trim() || 'No transcription available',
      timestamp: new Date().toISOString()
    }]
  }

  return formatted
}
