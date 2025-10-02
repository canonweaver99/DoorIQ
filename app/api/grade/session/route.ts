import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { gradeSession, Transcript as GTranscript } from '@/lib/grader'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type TranscriptEntry = { speaker: string; text: string; timestamp?: string | number }

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json()
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    const supabase = await createServiceSupabaseClient()
    const { data: session, error } = await (supabase as any)
      .from('live_sessions')
      .select('id, full_transcript, analytics')
      .eq('id', sessionId)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const transcript: TranscriptEntry[] = Array.isArray((session as any).full_transcript)
      ? (session as any).full_transcript
      : []
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
    // Heuristic line-level ratings (override average labels)
    const lineRatings = gTranscript.turns
      .filter(t => t.speaker === 'rep')
      .map(t => {
        const text = t.text.toLowerCase()
        let label: 'excellent' | 'good' | 'average' | 'poor' = 'average'
        let rationale = ''
        if (
          text.includes('understand how you feel') ||
          text.includes('which works better') ||
          text.includes('i have two appointments') ||
          (text.includes('?') && (text.includes('pest') || text.includes('issue') || text.includes('concern')))
        ) {
          label = 'excellent'; rationale = 'Advanced sale with empathy, assumptive close or quality discovery.'
        } else if (
          text.includes('great question') || text.includes('let me explain') || text.includes('our service includes')
        ) {
          label = 'good'; rationale = 'Adequate response that moves conversation forward.'
        } else if (
          text.includes('um') || text.includes('uh') || text.includes('i think') || text.includes('maybe') || text.length < 8 ||
          (text.includes('price') && !text.includes('value')) || text.includes("i don't know") || text.includes('not sure')
        ) {
          label = 'poor'; rationale = 'Weak/hesitant language or missed value framing.'
        }
        return { idx: t.id, speaker: 'rep', label, rationale }
      })

    const updatePayload: any = {
      overall_score: clamp(packet.components.final, 0, 100),
      rapport_score: clamp((packet.llm?.clarity_empathy?.score ?? 0) * 10, 0, 100),
      introduction_score: clamp((packet.objective.stepCoverage.opener ? 85 : 40), 0, 100),
      listening_score: clamp(Math.round(packet.objective.questionRate * 100), 0, 100),
      objection_handling_score: clamp(packet.llm?.objection_handling?.overall ?? 0, 0, 100),
      // Safety score: 0 if rep never mentions safety-related concepts; 60 for basic mention; 85 for detailed (pets/kids)
      safety_score: (() => {
        const repTurns = gTranscript.turns.filter(t => t.speaker === 'rep')
        const safetyRegex = /(safe|safety|non[-\s]?toxic|eco|chemical|chemicals|harm|exposure|residual)/i
        const detailedRegex = /(pets?|children|kids|family)/i
        const anyMention = repTurns.some(t => safetyRegex.test(t.text || ''))
        if (!anyMention) return 0
        const detailed = repTurns.some(t => detailedRegex.test(t.text || ''))
        return detailed ? 85 : 60
      })(),
      // More conservative closing score: 0 if convo < 20s and no clear close;
      // base 40 for any close attempt, 70 for assumptive close, +10 per extra attempt up to 90
      close_effectiveness_score: (() => {
        const durationMs = (gTranscript.turns.at(-1)?.endMs ?? 0) - (gTranscript.turns[0]?.startMs ?? 0)
        const attempts = packet.objective.closeAttempts || 0
        const assumptive = gTranscript.turns.some(t => t.speaker === 'rep' && /which works better|two appointments|when would you prefer|let'?s get started/i.test(t.text || ''))
        if (attempts === 0) return durationMs < 20000 ? 0 : 40
        let base = assumptive ? 70 : 40
        base += Math.min(20, Math.max(0, attempts - 1) * 10)
        return clamp(base, 0, 100)
      })(),
      analytics: {
        ...(session.analytics || {}),
        aiGrader: 'openai+rule',
        objective: packet.objective,
        objection_cases: packet.objectionCases,
        pest_control_objections: packet.pestControlObjections,
        moment_of_death: packet.momentOfDeath,
        difficulty_analysis: packet.components.difficulty,
        feedback: {
          strengths: packet.llm?.top_wins ?? [],
          improvements: packet.llm?.top_fixes ?? [],
          specificTips: (packet.llm?.drills ?? []).map(d => `${d.skill}: ${d.microplay}`)
        },
        line_ratings: lineRatings,
        graded_at: new Date().toISOString(),
      },
    }

    let { error: updateError } = await (supabase as any)
      .from('live_sessions')
      .update(updatePayload)
      .eq('id', sessionId)

    if (updateError) {
      console.error('❌ Supabase update error (grading):', updateError)
      // Fallback: update only analytics if schema is missing score columns
      const reducedPayload: any = { analytics: updatePayload.analytics }
      const { error: reducedError } = await (supabase as any)
        .from('live_sessions')
        .update(reducedPayload)
        .eq('id', sessionId)
      if (reducedError) {
        console.error('❌ Supabase reduced update error (analytics-only):', reducedError)
        return NextResponse.json({ error: 'Failed to save grading', details: reducedError?.message || reducedError }, { status: 500 })
      }
      return NextResponse.json({ ok: true, data: reducedPayload, downgraded: true })
    }

    return NextResponse.json({ ok: true, data: updatePayload, downgraded: false })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

function clamp(n: any, min: number, max: number) {
  const num = Number.isFinite(n) ? Number(n) : 0
  return Math.max(min, Math.min(max, Math.round(num)))
}


