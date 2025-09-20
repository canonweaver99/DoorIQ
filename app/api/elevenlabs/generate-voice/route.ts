import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = await request.json();
    
    if (!process.env.ELEVENLABS_API_KEY) {
      // Return mock audio for demo purposes
      return new NextResponse('Mock audio response', {
        headers: { 'Content-Type': 'audio/mpeg' }
      });
    }
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      throw new Error('ElevenLabs API error');
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' }
    });
  } catch (error) {
    console.error('Text-to-speech error:', error);
    // Return mock audio for demo
    return new NextResponse('Mock audio response', {
      headers: { 'Content-Type': 'audio/mpeg' }
    });
  }
}

