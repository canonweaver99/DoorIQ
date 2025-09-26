import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { gradeSession, Transcript as GTranscript } from '@/lib/grader'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type TranscriptEntry = { speaker: string; text: string; timestamp?: string | number }

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json()
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: session, error } = await (supabase as any)
      .from('training_sessions')
      .select('id, transcript, analytics')
      .eq('id', sessionId)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const transcript: TranscriptEntry[] = Array.isArray(session.transcript) ? session.transcript : []
    if (!transcript.length) {
      return NextResponse.json({ error: 'No transcript available to grade' }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    if (!openai.apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
    }

    // Map to structured transcript for deterministic + LLM rubric grader
    const gTranscript: GTranscript = {
      sessionId,
      turns: transcript.map((t, i) => ({
        id: i,
        speaker: (t.speaker === 'user' || t.speaker === 'rep') ? 'rep' : 'homeowner',
        startMs: typeof t.timestamp === 'number' ? t.timestamp : i * 4000,
        endMs: typeof t.timestamp === 'number' ? (Number(t.timestamp) + Math.max(1500, t.text?.length * 30)) : i * 4000 + Math.max(1500, (t.text?.length || 10) * 30),
        text: String(t.text || '')
      }))
    }

    const packet = await gradeSession(gTranscript, async (prompt: string) => {
      const r = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Return strict JSON only. No prose.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
      })
      return r.choices?.[0]?.message?.content || '{}'
    })

    // Persist results to Supabase
    const updatePayload: any = {
      overall_score: clamp(packet.components.final, 0, 100),
      rapport_score: clamp((packet.llm?.clarity_empathy?.score ?? 0) * 10, 0, 100),
      introduction_score: clamp((packet.objective.stepCoverage.opener ? 85 : 40), 0, 100),
      listening_score: clamp(Math.round(packet.objective.questionRate * 100), 0, 100),
      objection_handling_score: clamp(packet.llm?.objection_handling?.overall ?? 0, 0, 100),
      safety_score: clamp((packet.objective.stepCoverage.value ? 75 : 40), 0, 100),
      close_effectiveness_score: clamp((packet.objective.closeAttempts > 0 ? 70 + Math.min(30, packet.objective.closeAttempts * 10) : 40), 0, 100),
      analytics: {
        ...(session.analytics || {}),
        aiGrader: 'openai+rule',
        objective: packet.objective,
        objection_cases: packet.objectionCases,
        feedback: {
          strengths: packet.llm?.top_wins ?? [],
          improvements: packet.llm?.top_fixes ?? [],
          specificTips: (packet.llm?.drills ?? []).map(d => `${d.skill}: ${d.microplay}`)
        },
        line_ratings: (gTranscript.turns.some(t => t.speaker === 'rep')
          ? gTranscript.turns.filter(t => t.speaker === 'rep').map(t => ({ idx: t.id, speaker: 'rep', label: 'average', rationale: '' }))
          : []),
        graded_at: new Date().toISOString(),
      },
    }

    const { error: updateError } = await (supabase as any)
      .from('training_sessions')
      .update(updatePayload)
      .eq('id', sessionId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save grading' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data: updatePayload })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

function clamp(n: any, min: number, max: number) {
  const num = Number.isFinite(n) ? Number(n) : 0
  return Math.max(min, Math.min(max, Math.round(num)))
}


