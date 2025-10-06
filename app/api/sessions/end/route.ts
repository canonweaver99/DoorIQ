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
    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('🟢 [SESSION END] Failed to save transcript:', error)
      return NextResponse.json({ error: 'Failed to end session', details: error }, { status: 500 })
    }
    
    // Verify the update was successful
    if (!data) {
      console.error('🟢 [SESSION END] No data returned after update')
      return NextResponse.json({ error: 'Session update verification failed' }, { status: 500 })
    }
    
    console.log('🟢 [SESSION END] Session updated successfully:', {
      id: data.id,
      ended_at: data.ended_at,
      transcript_length: data.full_transcript?.length || 0
    })

    // Trigger grading in background (fire-and-forget for faster response)
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

      // Fire-and-forget: Don't await grading, let it run in background
      for (const url of candidates) {
        fetch(url, { method: 'POST', headers, body })
          .then(() => console.log('🟢 [SESSION END] Background grading triggered at:', url))
          .catch((e) => console.error('🟠 [SESSION END] Background grading failed for', url, e))
        break // Only try first URL to avoid duplicate grading
      }
      
      console.log('🟢 [SESSION END] Grading triggered in background, responding immediately')
    }

    return NextResponse.json({ 
      ok: true,
      gradingInProgress: Array.isArray(transcript) && transcript.length > 0
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


