import { NextResponse } from 'next/server'
import OpenAI from 'openai'
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

    const transcriptText = transcript
      .map((t) => `${t.speaker || 'unknown'}: ${t.text}`)
      .join('\n')

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    if (!openai.apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
    }

    const systemPrompt = `You are a door-to-door sales performance judge. Grade a sales conversation transcript with extremely high standards. A score of 100/100 requires a perfect pitch: flawless introduction, genuine rapport, masterful discovery (quality questions and follow-ups), comprehensive value presentation (features/benefits/proof, safety discussed), professional objection handling with empathy, and an assumptive close with urgency and next-step clarity. Penalize filler words, tentative language, poor sequencing, or missed opportunities. Return ONLY JSON in the following schema.

Schema:
{
  "overallScore": number (0-100),
  "scores": {
    "introduction": number,
    "rapport": number,
    "listening": number,
    "salesTechnique": number,
    "closing": number,
    "objectionHandling": number,
    "safety": number
  },
  "keyMoments": {
    "priceDiscussed": boolean,
    "safetyAddressed": boolean,
    "closeAttempted": boolean,
    "objectionHandled": boolean
  },
  "feedback": {
    "strengths": string[],
    "improvements": string[],
    "specificTips": string[]
  }
}`

    const { choices } = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Transcript (speaker: text):\n\n${transcriptText}` }
      ],
      temperature: 0.2,
    })

    const content = choices?.[0]?.message?.content || '{}'
    let result: any
    try {
      result = JSON.parse(content)
    } catch {
      return NextResponse.json({ error: 'Failed to parse grading response' }, { status: 502 })
    }

    // Persist results to Supabase
    const updatePayload: any = {
      overall_score: clamp(result.overallScore, 0, 100),
      rapport_score: clamp(result.scores?.rapport, 0, 100),
      introduction_score: clamp(result.scores?.introduction, 0, 100),
      listening_score: clamp(result.scores?.listening, 0, 100),
      objection_handling_score: clamp(result.scores?.objectionHandling, 0, 100),
      safety_score: clamp(result.scores?.safety, 0, 100),
      close_effectiveness_score: clamp(result.scores?.closing, 0, 100),
      analytics: {
        ...(session.analytics || {}),
        aiGrader: 'openai',
        scores: result.scores,
        key_moments: result.keyMoments,
        feedback: result.feedback,
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


