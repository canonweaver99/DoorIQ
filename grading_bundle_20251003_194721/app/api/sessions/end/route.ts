import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type TranscriptEntry = { speaker: string; text: string; timestamp?: string | number }

export async function POST(req: Request) {
  try {
    const { id, duration, transcript, analytics } = await req.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const supabase = await createServiceSupabaseClient()

    const update: any = {
      ended_at: new Date().toISOString(),
      duration_seconds: Number(duration) || null,
      full_transcript: Array.isArray(transcript) ? transcript : null,
      analytics: analytics || {},
    }

    const { error } = await (supabase as any)
      .from('live_sessions')
      .update(update)
      .eq('id', id)

    if (error) return NextResponse.json({ error: 'Failed to end session', details: error }, { status: 500 })

    // Try to grade if transcript provided
    if (Array.isArray(transcript) && transcript.length > 0) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/grade/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: id }),
        })
      } catch {}
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


