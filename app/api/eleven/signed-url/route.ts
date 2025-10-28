import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    // Get the API key from environment variable
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    
    logger.debug('ElevenLabs API Key check', { 
      exists: !!apiKey,
      preview: apiKey?.substring(0, 10) + '...'
    });
    
    if (!apiKey) {
      logger.error('ELEVEN_LABS_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured', details: 'Missing API key in environment' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({} as any));
    const agentId = body?.agentId || body?.agent_id;

    if (!agentId) {
      logger.error('No agent ID provided in request body');
      return NextResponse.json(
        { error: 'Agent ID is required', details: 'Request must include agentId field' },
        { status: 400 }
      );
    }

    logger.info('Requesting signed URL for agent', { agentId });

    // Call ElevenLabs API to get signed URL
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`;
    logger.api('Requesting signed URL from ElevenLabs', { url: elevenLabsUrl });
    
    const response = await fetch(elevenLabsUrl, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    logger.api('ElevenLabs Response', { 
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('ElevenLabs API error', undefined, {
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
    logger.debug('ElevenLabs Response Body', { body: text });
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      logger.error('Failed to parse ElevenLabs response', parseError);
      return NextResponse.json(
        { error: 'Invalid response from ElevenLabs', details: 'Response was not valid JSON' },
        { status: 502 }
      );
    }

    if (!data.signed_url) {
      logger.error('No signed_url in response', undefined, { data });
      return NextResponse.json(
        { error: 'Missing signed URL in response', details: 'ElevenLabs did not return a signed_url' },
        { status: 502 }
      );
    }

    logger.success('Successfully obtained signed URL', { expiresAt: data.expires_at });
    
    return NextResponse.json({
      signed_url: data.signed_url,
      expires_at: data.expires_at,
      agentId,
    });
    
  } catch (error: any) {
    logger.error('Error in signed URL endpoint', error, {
      message: error?.message,
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

