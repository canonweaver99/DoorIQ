import { NextResponse } from 'next/server'

const ELEVEN_BASE_URL = process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io'
const DEFAULT_AGENT_ID = process.env.ELEVENLABS_AGENT_ID || 'agent_7001k5jqfjmtejvs77jvhjf254tz'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type TokenRequestBody = {
  agentId?: string
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      console.error('ELEVENLABS_API_KEY is not configured')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const body = (await request.json().catch(() => ({}))) as TokenRequestBody
    const agentId = body.agentId || DEFAULT_AGENT_ID

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
    }

    const tokenUrl = new URL('/v1/convai/conversation/token', ELEVEN_BASE_URL)
    tokenUrl.searchParams.set('agent_id', agentId)

    const elevenResponse = await fetch(tokenUrl.toString(), {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (!elevenResponse.ok) {
      const errorText = await elevenResponse.text().catch(() => 'Unknown ElevenLabs error')
      console.error('Failed to fetch ElevenLabs conversation token', elevenResponse.status, errorText)
      return NextResponse.json({ error: 'Failed to fetch conversation token' }, { status: 502 })
    }

    const payload = (await elevenResponse.json().catch(() => null)) as { token?: string } | null
    if (!payload?.token) {
      console.error('ElevenLabs response missing token', payload)
      return NextResponse.json({ error: 'Conversation token missing from ElevenLabs response' }, { status: 502 })
    }

    return NextResponse.json({ token: payload.token })
  } catch (error) {
    console.error('Error creating ElevenLabs conversation token', error)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

export function GET() {
  return new NextResponse('Method Not Allowed', {
    status: 405,
    headers: { Allow: 'POST' },
  })
}


