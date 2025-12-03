import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { PERSONA_METADATA, ALLOWED_AGENT_ORDER, type AllowedAgentName } from '@/components/trainer/personas'

/**
 * Generate a sample audio snippet for the landing page demo
 * This endpoint generates a short audio clip using ElevenLabs TTS with actual agent voices
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

    // Get index parameter to cycle through different agents
    const { searchParams } = new URL(request.url)
    const index = parseInt(searchParams.get('index') || '0', 10)

    // Get active agents from PERSONA_METADATA (excluding Tag Team for simplicity)
    const activeAgents = ALLOWED_AGENT_ORDER.filter(name => name !== 'Tag Team Tanya & Tom')
    
    // Cycle through agents using modulo
    const agentName = activeAgents[index % activeAgents.length] as AllowedAgentName
    const agentMetadata = PERSONA_METADATA[agentName]
    
    if (!agentMetadata || !agentMetadata.card.elevenAgentId) {
      logger.error('Agent metadata not found', { agentName })
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    const agentId = agentMetadata.card.elevenAgentId
    
    // Get agent details from ElevenLabs to extract voice ID
    let voiceId: string | null = null
    
    try {
      const agentDetailsUrl = `https://api.elevenlabs.io/v1/convai/agent/${agentId}`
      const agentResponse = await fetch(agentDetailsUrl, {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      })
      
      if (agentResponse.ok) {
        const agentData = await agentResponse.json()
        // Extract voice_id from agent configuration
        voiceId = agentData?.voice_id || agentData?.voice?.voice_id || null
        
        logger.info('Fetched agent details', { 
          agentId,
          agentName,
          voiceId: voiceId || 'not found'
        })
      } else {
        logger.warn('Could not fetch agent details, will try alternative method', {
          status: agentResponse.status,
          agentId
        })
      }
    } catch (error) {
      logger.warn('Error fetching agent details', { error, agentId })
    }

    // If we couldn't get voice ID from agent details, try using agent ID directly with conversational TTS
    // Or fall back to a default approach
    if (!voiceId) {
      // Try using the conversational AI text endpoint with agent ID
      try {
        const convaiTtsUrl = `https://api.elevenlabs.io/v1/convai/text-to-speech`
        const convaiResponse = await fetch(convaiTtsUrl, {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agent_id: agentId,
            text: `Hi, I'm ${agentName}. ${agentMetadata.bubble.description}`,
          }),
        })
        
        if (convaiResponse.ok) {
          const audioBuffer = await convaiResponse.arrayBuffer()
          return new NextResponse(audioBuffer, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': audioBuffer.byteLength.toString(),
              'Cache-Control': 'public, max-age=3600',
            },
          })
        }
      } catch (error) {
        logger.warn('Conversational TTS failed, falling back to standard TTS', { error })
      }
      
      // Fallback: return error if we can't get the voice
      return NextResponse.json(
        { error: 'Could not determine voice for agent', agentName, agentId },
        { status: 500 }
      )
    }

    // Generate sample text based on agent
    const sampleText = `Hi, I'm ${agentName}. ${agentMetadata.bubble.description}`
    const modelId = 'eleven_multilingual_v2'
    
    // Call ElevenLabs TTS API with the agent's actual voice
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`
    
    logger.info('Generating sample audio for landing page', { 
      agentName,
      agentId,
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

