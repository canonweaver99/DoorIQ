import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const agentId = body?.agentId || body?.agent_id;
    
    if (!agentId) {
      console.error('❌ No agent ID provided in request body');
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    
    if (!apiKey) {
      console.error('❌ ELEVEN_LABS_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    console.log('🎙️ Requesting WebRTC conversation token for agent:', agentId);

    // Get conversation token for WebRTC connection
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`;
    console.log('📡 Requesting token from ElevenLabs:', elevenLabsUrl);
    
    const response = await fetch(elevenLabsUrl, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    console.log('📨 ElevenLabs Token Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ElevenLabs API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        agentId,
      });

      if (response.status === 404) {
        return NextResponse.json(
          { 
            error: 'Agent not found',
            details: `Agent with ID ${agentId} does not exist or you don't have access to it.`,
            statusCode: 404,
            agentId
          },
          { status: 404 }
        );
      }

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { 
            error: 'Authentication failed',
            details: 'API key is invalid or does not have access to this agent.',
            statusCode: response.status
          },
          { status: response.status }
        );
      }

      return NextResponse.json(
        { 
          error: `ElevenLabs API error: ${response.status}`,
          details: errorText || response.statusText,
          statusCode: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Successfully obtained conversation token');
    console.log('⏰ Expires at:', data.expires_at);
    
    return NextResponse.json({
      conversation_token: data.conversation_token,
      expires_at: data.expires_at,
      agentId,
    });
    
  } catch (error: any) {
    console.error('❌ Error in conversation token endpoint:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'Failed to get conversation token'
      },
      { status: 500 }
    );
  }
}

