import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Whisper needs Node runtime

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Create FormData for OpenAI Whisper
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile);
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('language', 'en');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: whisperFormData,
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: `Transcription failed: ${error}` }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json({ 
      text: result.text || '',
      confidence: 1.0 // Whisper doesn't provide confidence, but it's generally high quality
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
