import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Get the API key from environment variable
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    
    // Debug log
    console.log('🔑 API Key exists:', !!apiKey);
    console.log('🔑 API Key first 10 chars:', apiKey?.substring(0, 10) + '...');
    
    if (!apiKey) {
      console.error('❌ ELEVEN_LABS_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured', details: 'Missing API key in environment' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({} as any));
    const agentId = body?.agentId || body?.agent_id;

    if (!agentId) {
      console.error('❌ No agent ID provided in request body');
      return NextResponse.json(
        { error: 'Agent ID is required', details: 'Request must include agentId field' },
        { status: 400 }
      );
    }

    console.log('🤖 Agent ID:', agentId);

    // Call ElevenLabs API to get signed URL
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`;
    console.log('📡 Requesting signed URL from ElevenLabs:', elevenLabsUrl);
    
    const response = await fetch(elevenLabsUrl, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    console.log('📨 ElevenLabs Response Status:', response.status);
    console.log('📨 ElevenLabs Response Headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ElevenLabs API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        agentId,
      });

      // Handle specific error codes
      if (response.status === 406) {
        return NextResponse.json(
          { 
            error: 'Agent not configured for signed URL access',
            details: 'This agent may be a public agent or requires different authentication. Try connecting without a signed URL.',
            statusCode: 406,
            agentId,
            canFallback: true
          },
          { status: 406 }
        );
      }

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

    const text = await response.text();
    console.log('📨 ElevenLabs Response Body:', text);
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ Failed to parse ElevenLabs response:', parseError);
      return NextResponse.json(
        { error: 'Invalid response from ElevenLabs', details: 'Response was not valid JSON' },
        { status: 502 }
      );
    }

    if (!data.signed_url) {
      console.error('❌ No signed_url in response:', data);
      return NextResponse.json(
        { error: 'Missing signed URL in response', details: 'ElevenLabs did not return a signed_url' },
        { status: 502 }
      );
    }

    console.log('✅ Successfully obtained signed URL');
    console.log('⏰ Expires at:', data.expires_at);
    
    return NextResponse.json({
      signed_url: data.signed_url,
      expires_at: data.expires_at,
      agentId,
    });
    
  } catch (error: any) {
    console.error('❌ Error in signed URL endpoint:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'Failed to get signed URL'
      },
      { status: 500 }
    );
  }
}

