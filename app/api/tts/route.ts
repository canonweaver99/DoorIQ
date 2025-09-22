import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    const apiKey = process.env.ELEVEN_API_KEY;
    const voiceId = process.env.ELEVEN_VOICE_ID;
    if (!apiKey || !voiceId) {
      return NextResponse.json({
        error: 'ElevenLabs not configured',
        missing: {
          ELEVEN_API_KEY: !apiKey,
          ELEVEN_VOICE_ID: !voiceId
        }
      }, { status: 400 });
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        optimize_streaming_latency: 3,  // 0..3 (lower = faster)
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return NextResponse.json({ error: 'ElevenLabs error', detail: errText }, { status: upstream.status });
    }

    // Pipe the streaming audio straight through
    return new NextResponse(upstream.body, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg' }
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'TTS route failed', detail: e?.message || 'unknown' }, { status: 500 });
  }
}
