
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { PERSONA_METADATA, ALLOWED_AGENT_ORDER, type AllowedAgentName } from '@/components/trainer/personas'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getRandomSnippet } from '@/lib/agent-snippets'

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
    
    // Reorder to put "Too Expensive Tim" first
    const timIndex = activeAgents.indexOf('Too Expensive Tim')
    const reorderedAgents = timIndex >= 0
      ? [
          activeAgents[timIndex],
          ...activeAgents.slice(0, timIndex),
          ...activeAgents.slice(timIndex + 1)
        ]
      : activeAgents
    
    // Cycle through agents using modulo
    const agentName = reorderedAgents[index % reorderedAgents.length] as AllowedAgentName
    const agentMetadata = PERSONA_METADATA[agentName]
    
    if (!agentMetadata || !agentMetadata.card.elevenAgentId) {
      logger.error('Agent metadata not found', { agentName })
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    const agentId = agentMetadata.card.elevenAgentId
    
    // Check if voice ID is stored directly in persona metadata (preferred method)
    let voiceId: string | null = (agentMetadata.card as any).elevenVoiceId || null
    
    // If not in metadata, try to fetch from Supabase agents table
    if (!voiceId) {
      try {
        const supabase = await createServerSupabaseClient()
        const { data: agentData, error } = await supabase
          .from('agents')
          .select('eleven_voice_id')
          .eq('eleven_agent_id', agentId)
          .single()
        
        if (!error && agentData?.eleven_voice_id) {
          voiceId = agentData.eleven_voice_id
          logger.info('Fetched voice ID from Supabase', { 
            agentId,
            agentName,
            voiceId
          })
        } else if (error) {
          logger.warn('Could not fetch voice ID from Supabase', {
            agentId,
            agentName,
            error: error.message
          })
        }
      } catch (error: any) {
        logger.warn('Error fetching voice ID from Supabase', { 
          error: error?.message || error,
          agentId 
        })
      }
    }
    
    // If still not found, try to fetch from ElevenLabs API
    if (!voiceId) {
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
          // Try multiple possible paths for voice_id in the response
          voiceId = agentData?.voice_id || 
                    agentData?.voice?.voice_id || 
                    agentData?.voice_id || 
                    agentData?.voice_config?.voice_id ||
                    agentData?.conversation_config?.voice_id ||
                    null
          
          // Log the full response structure for debugging if voice_id not found
          if (!voiceId) {
            logger.warn('Voice ID not found in agent response', { 
              agentId,
              agentName,
              responseKeys: Object.keys(agentData),
              responseSample: JSON.stringify(agentData).substring(0, 500)
            })
          } else {
            logger.info('Fetched voice ID from agent API', { 
              agentId,
              agentName,
              voiceId
            })
          }
        } else {
          const errorText = await agentResponse.text()
          logger.warn('Could not fetch agent details from ElevenLabs API', {
            status: agentResponse.status,
            statusText: agentResponse.statusText,
            agentId,
            error: errorText.substring(0, 200)
          })
        }
      } catch (error: any) {
        logger.warn('Error fetching agent details from ElevenLabs API', { 
          error: error?.message || error,
          agentId 
        })
      }
    }

    // If we still don't have a voice ID, use fallback mapping
    // NOTE: These are generic ElevenLabs voices and may not match the actual agent voices
    // The proper fix is to add elevenVoiceId to each agent in PERSONA_METADATA
    if (!voiceId) {
      const fallbackVoiceMap: Record<string, string> = {
        'Average Austin': 'pNInz6obpgDQGcFmaJgB', // Adam - professional male
        'No Problem Nancy': 'EXAVITQu4vr4xnSDxMaL', // Bella - friendly female
        'Switchover Steve': 'ErXwobaYiN019PkySvjV', // Antoni - confident male
        'Not Interested Nick': 'MF3mGyEYCl7XYWbV9V6O', // Elli - dismissive female
        'DIY Dave': 'TxGEqnHWrfWFTfGW9XjX', // Josh - practical male
        'Too Expensive Tim': 'pNInz6obpgDQGcFmaJgB', // Adam - professional male
        'Spouse Check Susan': 'EXAVITQu4vr4xnSDxMaL', // Bella - friendly female
        'Busy Beth': 'EXAVitQu4vr4xnSDxMaL', // Bella - friendly female
        'Renter Randy': 'pNInz6obpgDQGcFmaJgB', // Adam - professional male
        'Skeptical Sam': 'pNInz6obpgDQGcFmaJgB', // Adam - professional male
        'Just Treated Jerry': 'ErXwobaYiN019PkySvjV', // Antoni - confident male
        'Think About It Tina': 'EXAVITQu4vr4xnSDxMaL', // Bella - friendly female
        'Veteran Victor': 'pNInz6obpgDQGcFmaJgB', // Adam - professional male
      }
      
      voiceId = fallbackVoiceMap[agentName] || '21m00Tcm4TlvDq8ikWAM' // Default: Rachel - professional female
      
      logger.warn('Using fallback voice ID - this may not match the actual agent voice', { 
        agentName, 
        voiceId,
        suggestion: 'Add elevenVoiceId to PERSONA_METADATA for accurate voice matching'
      })
    }

    // Generate sample text using random snippet from sales conversation
    const sampleText = getRandomSnippet(agentName)
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

