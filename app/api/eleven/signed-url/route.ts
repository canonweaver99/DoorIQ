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

    const body = await request.json().catch(() => ({} as any));
    const agentId = body?.agentId || body?.agent_id;

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    // Call ElevenLabs API to get signed URL (hyphenated path per docs)
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`;
    console.log('📡 Calling ElevenLabs:', elevenLabsUrl);
    const response = await fetch(
      elevenLabsUrl,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey, // ElevenLabs uses 'xi-api-key' header
          'Content-Type': 'application/json',
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

    const text = await response.text();
    console.log('📨 ElevenLabs Response Status:', response.status);
    const data = JSON.parse(text);
    
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

