import { NextResponse } from 'next/server'

/**
 * Test endpoint to explore ElevenLabs ConvAI conversation history API
 * This will help us discover if we can retrieve full conversation recordings
 */
export async function GET(request: Request) {
  const apiKey = process.env.ELEVEN_LABS_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({ error: 'No API key configured' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversationId')
  const agentId = searchParams.get('agentId')

  try {
    // Try different potential endpoints for conversation history
    const endpoints = [
      // Conversation history/list
      'https://api.elevenlabs.io/v1/convai/conversations',
      // Specific conversation
      conversationId ? `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}` : null,
      // Agent conversations
      agentId ? `https://api.elevenlabs.io/v1/convai/agents/${agentId}/conversations` : null,
      // Conversation recording/audio
      conversationId ? `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio` : null,
      conversationId ? `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/recording` : null,
    ].filter(Boolean)

    const results = []

    for (const endpoint of endpoints) {
      try {
        console.log('Testing endpoint:', endpoint)
        const response = await fetch(endpoint as string, {
          method: 'GET',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        })

        results.push({
          endpoint,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          body: response.ok ? await response.json().catch(() => await response.text()) : await response.text()
        })
      } catch (error: any) {
        results.push({
          endpoint,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      message: 'Tested ElevenLabs conversation endpoints',
      apiKeyConfigured: true,
      conversationId,
      agentId,
      results
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      details: 'Failed to test endpoints'
    }, { status: 500 })
  }
}

