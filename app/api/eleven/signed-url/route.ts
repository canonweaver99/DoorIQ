import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';


export const dynamic = "force-static";
const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io';

/**
 * GET /api/eleven/signed-url?agent_id=xxx
 * Simple proxy to ElevenLabs signed URL endpoint
 */
export async function GET(request: NextRequest) {
  const apiKey = process.env.ELEVEN_LABS_API_KEY || process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agent_id');
  if (!agentId) {
    return NextResponse.json({ error: 'agent_id is required' }, { status: 400 });
  }

  const url = `${ELEVENLABS_API_BASE}/v1/convai/conversation/get-signed-url?agent_id=${agentId}`;
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
 * POST /api/eleven/signed-url
 * Accepts agentId in body
 */
export async function POST(request: Request) {
  const apiKey = process.env.ELEVEN_LABS_API_KEY || process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const agentId = (body as any)?.agentId || (body as any)?.agent_id;
  if (!agentId) {
    return NextResponse.json({ error: 'agent_id is required' }, { status: 400 });
  }

  const url = `${ELEVENLABS_API_BASE}/v1/convai/conversation/get-signed-url?agent_id=${agentId}`;
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
