import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Get the API key from environment variable
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    
    // Debug log (remove in production)
    console.log('API Key exists:', !!apiKey);
    console.log('API Key first 10 chars:', apiKey?.substring(0, 10) + '...');
    
    if (!apiKey) {
      console.error('ELEVEN_LABS_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    const { agentId } = await request.json();

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    // Call ElevenLabs API to get signed URL
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey, // ElevenLabs uses 'xi-api-key' header
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return NextResponse.json(
        { error: `ElevenLabs API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      signed_url: data.signed_url,
      expires_at: data.expires_at,
    });
    
  } catch (error) {
    console.error('Error in signed URL endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to get signed URL' },
      { status: 500 }
    );
  }
}

