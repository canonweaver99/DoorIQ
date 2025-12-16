import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';


export const dynamic = "force-static";
const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io';

/**
 * GET /api/eleven/conversations/[conversationId]/audio
 * Simple proxy to get conversation audio
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const apiKey = process.env.ELEVEN_LABS_API_KEY || process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const { conversationId } = await params;
  if (!conversationId) {
    return NextResponse.json({ error: 'conversation_id is required' }, { status: 400 });
  }

  const url = `${ELEVENLABS_API_BASE}/v1/convai/conversations/${conversationId}/audio`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'xi-api-key': apiKey },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    return NextResponse.json({ error: errorText }, { status: response.status });
  }

  const audioBuffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'audio/mpeg';

  return new NextResponse(audioBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': audioBuffer.byteLength.toString(),
    },
  });
}
