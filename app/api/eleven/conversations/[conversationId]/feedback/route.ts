import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';


export const dynamic = "force-static";
const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io';

/**
 * POST /api/eleven/conversations/[conversationId]/feedback
 * Simple proxy to send feedback
 */
export async function POST(
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

  const body = await request.json().catch(() => ({}));
  const url = `${ELEVENLABS_API_BASE}/v1/convai/conversations/${conversationId}/feedback`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ feedback: (body as any)?.feedback || null }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    return NextResponse.json({ error: errorText }, { status: response.status });
  }

  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data);
}
