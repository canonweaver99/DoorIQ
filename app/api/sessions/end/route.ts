import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type TranscriptEntry = { speaker: string; text: string; timestamp?: string | number }

export async function POST(req: Request) {
  try {
    console.log('🟢 [SESSION END] Ending session...')
    const { id, duration, transcript, analytics } = await req.json()
    console.log('🟢 [SESSION END] Data received:', {
      id,
      duration,
      transcriptLength: Array.isArray(transcript) ? transcript.length : 0,
    })
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const supabase = await createServiceSupabaseClient()

    const update: any = {
      ended_at: new Date().toISOString(),
      duration_seconds: Number(duration) || null,
      full_transcript: Array.isArray(transcript) ? transcript : null,
      analytics: analytics || {},
    }

    console.log('🟢 [SESSION END] Saving transcript to database...')
    const { error } = await (supabase as any)
      .from('live_sessions')
      .update(update)
      .eq('id', id)

    if (error) {
      console.error('🟢 [SESSION END] Failed to save transcript:', error)
      return NextResponse.json({ error: 'Failed to end session', details: error }, { status: 500 })
    }

    // Try to grade if transcript provided
    let gradingResults: any = null
    if (Array.isArray(transcript) && transcript.length > 0) {
      const body = JSON.stringify({ sessionId: id })
      const headers = { 'Content-Type': 'application/json' }

      const candidates: string[] = []
      const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || ''
      if (envUrl) candidates.push(`${envUrl.replace(/\/$/, '')}/api/grade/session`)
      try {
        const origin = (req as any)?.headers?.get?.('origin') || (req as any)?.headers?.get?.('x-forwarded-host')
        const proto = (req as any)?.headers?.get?.('x-forwarded-proto') || 'https'
        if (origin && !/^https?:\/\//.test(origin)) {
          candidates.push(`${proto}://${origin}/api/grade/session`)
        } else if (origin) {
          candidates.push(`${origin.replace(/\/$/, '')}/api/grade/session`)
        }
      } catch {}
      // Fallback to relative path last
      candidates.push('/api/grade/session')

      let triggered = false
      for (const url of candidates) {
        try {
          console.log('🟢 [SESSION END] Triggering grading at:', url)
          const resp = await fetch(url, { method: 'POST', headers, body })
          const json = await resp.json().catch(() => ({}))
          console.log('🟢 [SESSION END] Grading response:', { status: resp.status, ok: resp.ok, payload: json })
          if (resp.ok) { 
            triggered = true
            gradingResults = json
            break 
          }
        } catch (e) {
          console.error('🟠 [SESSION END] Grading request failed for', url, e)
        }
      }
      if (!triggered) {
        console.error('🛑 [SESSION END] Failed to trigger grading after trying candidates:', candidates)
      }
    }

    return NextResponse.json({ 
      ok: true,
      grading: gradingResults 
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


