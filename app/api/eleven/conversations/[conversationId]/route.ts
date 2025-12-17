import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';


const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io';

/**
 * GET /api/eleven/conversations/[conversationId]
 * Simple proxy to get conversation details
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

  const url = `${ELEVENLABS_API_BASE}/v1/convai/conversations/${conversationId}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'xi-api-key': apiKey },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    return NextResponse.json({ error: errorText }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}

/**
 * DELETE /api/eleven/conversations/[conversationId]
 * Simple proxy to delete conversation
 */
export async function DELETE(
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

  const url = `${ELEVENLABS_API_BASE}/v1/convai/conversations/${conversationId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { 'xi-api-key': apiKey },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    return NextResponse.json({ error: errorText }, { status: response.status });
  }

  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data);
}
