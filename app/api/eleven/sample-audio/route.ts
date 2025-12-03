import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * Generate a sample audio snippet for the landing page demo
 * This endpoint generates a short audio clip using ElevenLabs TTS
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.ELEVEN_LABS_API_KEY
    
    if (!apiKey) {
      logger.error('ELEVEN_LABS_API_KEY is not set in environment variables')
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      )
    }

    // Sample text for the demo - a short snippet from an AI trainer
    const sampleText = "Hi there! I'm one of DoorIQ's AI trainers. I help sales reps practice their pitch and handle objections until they're ready for anything at the door. Want to hear more?"
    
    // Use Rachel voice (professional female voice)
    const voiceId = '21m00Tcm4TlvDq8ikWAM'
    const modelId = 'eleven_multilingual_v2'
    
    // Call ElevenLabs TTS API
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`
    
    logger.info('Generating sample audio for landing page', { 
      textLength: sampleText.length,
      voiceId
    })
    
    const response = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: sampleText,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('ElevenLabs TTS API error', undefined, {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      })
      
      return NextResponse.json(
        { 
          error: `ElevenLabs TTS error: ${response.status}`,
          details: errorText || response.statusText
        },
        { status: response.status }
      )
    }

    // Get audio as array buffer
    const audioBuffer = await response.arrayBuffer()
    
    // Return audio with proper headers
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
    
  } catch (error: any) {
    logger.error('Error generating sample audio', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'Failed to generate speech'
      },
      { status: 500 }
    )
  }
}

