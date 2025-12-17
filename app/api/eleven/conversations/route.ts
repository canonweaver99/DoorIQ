import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';


const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io';

/**
 * GET /api/eleven/conversations?agent_id=xxx&cursor=xxx&...
 * Simple proxy - forwards all query params to ElevenLabs
 */
export async function GET(request: NextRequest) {
  const apiKey = process.env.ELEVEN_LABS_API_KEY || process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams(searchParams);
  const url = `${ELEVENLABS_API_BASE}/v1/convai/conversations?${params.toString()}`;
  
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
