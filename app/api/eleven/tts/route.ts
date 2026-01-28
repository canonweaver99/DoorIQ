
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * Eleven Labs Text-to-Speech API endpoint
 * Converts text to speech using Eleven Labs TTS API
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ELEVEN_LABS_API_KEY
    
    if (!apiKey) {
      logger.error('ELEVEN_LABS_API_KEY is not set in environment variables')
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      )
    }

    const { text, voice_id, model_id, stability, similarity_boost } = await request.json()
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Default voice_id for professional coaching voice
    // You can change this to any voice_id from your Eleven Labs account
    const defaultVoiceId = voice_id || '21m00Tcm4TlvDq8ikWAM' // Rachel - a professional female voice
    const defaultModel = model_id || 'eleven_multilingual_v2'
    
    // Call ElevenLabs TTS API
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${defaultVoiceId}`
    
    logger.info('Requesting TTS from ElevenLabs', { 
      textLength: text.length,
      voiceId: defaultVoiceId,
      model: defaultModel
    })
    
    const response = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: defaultModel,
        voice_settings: {
          stability: stability || 0.5,
          similarity_boost: similarity_boost || 0.75,
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
      
      // Parse error details for better error messages
      let errorMessage = `ElevenLabs TTS error: ${response.status}`
      let errorDetails = errorText || response.statusText
      
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.detail) {
          // Handle quota exceeded specifically
          if (errorJson.detail.status === 'quota_exceeded') {
            errorMessage = 'ElevenLabs quota exceeded'
            errorDetails = errorJson.detail.message || 'Your ElevenLabs account has run out of credits. Please add credits to continue.'
          } else if (errorJson.detail.message) {
            errorMessage = errorJson.detail.message
            errorDetails = errorText
          }
        }
      } catch {
        // If parsing fails, use the original error text
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails
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
      },
    })
    
  } catch (error: any) {
    logger.error('Error in ElevenLabs TTS endpoint', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'Failed to generate speech'
      },
      { status: 500 }
    )
  }
}

