import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert audio file to base64
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Audio = buffer.toString('base64');

    if (!process.env.ELEVENLABS_API_KEY) {
      // Return mock transcription for demo
      return NextResponse.json({
        text: "Hello! I'm interested in hearing about your energy assessment program.",
        confidence: 0.95,
        mock: true
      });
    }

    // Call ElevenLabs Speech-to-Text API
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio: base64Audio,
        model: 'eleven_english_sts_v2'
      })
    });

    if (!response.ok) {
      throw new Error('ElevenLabs transcription error');
    }

    const data = await response.json();
    
    return NextResponse.json({
      text: data.text,
      confidence: data.confidence
    });
  } catch (error) {
    console.error('Transcription error:', error);
    // Return mock data for demo
    return NextResponse.json({
      text: "Hello! I'm interested in hearing about your energy assessment program.",
      confidence: 0.95,
      mock: true
    });
  }
}

