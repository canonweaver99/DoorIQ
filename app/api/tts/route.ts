import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { text } = await req.json();
  const voiceId = process.env.ELEVEN_VOICE_ID!;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

  const upstream = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVEN_API_KEY!,
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
    const err = await upstream.text();
    return new NextResponse(err, { status: upstream.status });
  }

  // Pipe the streaming audio straight through
  return new NextResponse(upstream.body, {
    status: 200,
    headers: { 'Content-Type': 'audio/mpeg' }
  });
}
