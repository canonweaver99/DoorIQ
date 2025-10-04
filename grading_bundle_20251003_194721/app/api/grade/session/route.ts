import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { gradeSession, Transcript as GTranscript } from '@/lib/grader'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { buildCompleteUpdatePayload } from '@/lib/grading-helpers'

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
    
    console.log('📊 GRADING DEBUG:', {
      sessionId,
      transcriptIsArray: Array.isArray(transcript),
      transcriptLength: transcript.length,
      firstEntry: transcript[0],
      lastEntry: transcript[transcript.length - 1]
    })
    
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
      turns: transcript.map((t, i) => {
        // Parse timestamp - handle both number (ms) and ISO string formats
        let startMs: number
        if (typeof t.timestamp === 'number') {
          startMs = t.timestamp
        } else if (typeof t.timestamp === 'string') {
          startMs = new Date(t.timestamp).getTime()
        } else {
          startMs = i * 4000 // Fallback for missing timestamps
        }
        
        // Estimate end time based on text length (avg 150 words/min = ~400ms per word)
        const estimatedDurationMs = Math.max(1500, (t.text?.length || 10) * 30)
        
        return {
          id: i,
          speaker: (t.speaker === 'user' || t.speaker === 'rep') ? 'rep' : 'homeowner',
          startMs,
          endMs: startMs + estimatedDurationMs,
          text: String(t.text || '')
        }
      })
    }
    
    console.log('🎯 PARSED TRANSCRIPT:', {
      totalTurns: gTranscript.turns.length,
      firstTurn: gTranscript.turns[0],
      lastTurn: gTranscript.turns[gTranscript.turns.length - 1],
      duration: (gTranscript.turns[gTranscript.turns.length - 1]?.endMs - gTranscript.turns[0]?.startMs) / 1000
    })

    const packet = await gradeSession(gTranscript, async (prompt: string) => {
      const r = await openai.chat.completions.create({
        model: 'gpt-4o', // Upgraded to GPT-4o for better quality feedback
        messages: [
          { role: 'system', content: 'You are an expert sales coach. Return strict JSON only. No prose.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, // Slight creativity for better coaching feedback
        response_format: { type: 'json_object' },
      })
      return r.choices?.[0]?.message?.content || '{}'
    })

    // Use LLM's contextual line-by-line ratings if available, otherwise fallback to heuristic
    const lineRatings = packet.llm?.line_by_line_ratings?.map((rating: any) => ({
      idx: rating.turn_id,
      speaker: 'rep',
      rating: rating.rating,
      label: rating.label,
      rationale: rating.context_rationale,
      what_worked: rating.what_worked,
      what_to_improve: rating.what_to_improve,
      example_alternative: rating.example_alternative
    })) || gTranscript.turns
      .filter(t => t.speaker === 'rep')
      .map(t => {
        // Fallback heuristic if LLM didn't provide ratings
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

    // Use the comprehensive helper to build complete payload with all columns
    const updatePayload = buildCompleteUpdatePayload(
      gTranscript,
      packet,
      session.analytics,
      lineRatings
    )

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
