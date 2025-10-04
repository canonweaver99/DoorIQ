import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createServiceSupabaseClient()
    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .select('id, created_at, ended_at, duration_seconds, overall_score, full_transcript, analytics')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch sessions', details: error }, { status: 500 })
    }

    const rows = (data || []).map((s: any) => ({
      id: s.id,
      created_at: s.created_at,
      ended_at: s.ended_at,
      duration_seconds: s.duration_seconds,
      overall_score: s.overall_score,
      has_full_transcript: Array.isArray(s.full_transcript) && s.full_transcript.length > 0,
      transcript_length: Array.isArray(s.full_transcript) ? s.full_transcript.length : 0,
      has_ai_feedback: Boolean(s.analytics?.feedback),
      line_ratings_count: Array.isArray(s.analytics?.line_ratings) ? s.analytics.line_ratings.length : 0,
      graded_at: s.analytics?.graded_at || null,
    }))

    return NextResponse.json({ ok: true, count: rows.length, sessions: rows })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


