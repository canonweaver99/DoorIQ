import { NextRequest, NextResponse } from 'next/server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

const ELEVEN_BASE_URL = process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io'
const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { agent_id: agentId } = (await request.json().catch(() => ({}))) as {
      agent_id?: string
    }

    if (!agentId) {
      return NextResponse.json({ error: 'agent_id is required' }, { status: 400 })
    }

    if (!ELEVEN_LABS_API_KEY) {
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 })
    }

    const signedUrlEndpoint = new URL('/v1/convai/conversation/get_signed_url', ELEVEN_BASE_URL)
    signedUrlEndpoint.searchParams.set('agent_id', agentId)

    const elevenResponse = await fetch(signedUrlEndpoint.toString(), {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY,
        accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (!elevenResponse.ok) {
      const errorText = await elevenResponse.text().catch(() => 'Unknown ElevenLabs error')
      console.error('ElevenLabs API error:', elevenResponse.status, errorText)
      return NextResponse.json({ error: 'Failed to get signed URL from ElevenLabs' }, { status: elevenResponse.status })
    }

    const data = (await elevenResponse.json().catch(() => null)) as {
      signed_url?: string
      expires_at?: string
    } | null

    if (!data?.signed_url) {
      return NextResponse.json({ error: 'Signed URL missing from ElevenLabs response' }, { status: 502 })
    }

    return NextResponse.json({
      signed_url: data.signed_url,
      expires_at: data.expires_at ?? null,
    })
  } catch (error) {
    console.error('Error generating signed URL:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export function GET() {
  return new NextResponse('Method Not Allowed', {
    status: 405,
    headers: { Allow: 'POST' },
  })
}

