import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Simple, realistic sample transcript for testing the grader end-to-end
const SAMPLE_TRANSCRIPT = [
  { speaker: 'user', text: "Hey there! I'm Alex from DoorIQ Pest Control — beautiful roses out front!" },
  { speaker: 'homeowner', text: 'Thanks. What do you need?' },
  { speaker: 'user', text: 'Many homeowners around here have seen ants in the kitchen or spiders in the garage. What pests concern you most?' },
  { speaker: 'homeowner', text: 'Mostly ants near the sink.' },
  { speaker: 'user', text: 'That makes perfect sense — how long has that been going on?' },
  { speaker: 'homeowner', text: 'A couple months.' },
  { speaker: 'user', text: 'We treat the foundation and entry points so they stop coming back. Everything we use is completely safe for kids and pets.' },
  { speaker: 'homeowner', text: 'Is it expensive?' },
  { speaker: 'user', text: 'I hear you. Most folks see it as an investment to protect the home. Today we can get you started at $129 for the initial service and $49 monthly after.' },
  { speaker: 'homeowner', text: 'That sounds good.' },
  { speaker: 'user', text: 'Great — I have two appointments open, Tuesday or Thursday. Which works better?' },
  { speaker: 'homeowner', text: 'Thursday works.' },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const transcript = Array.isArray(body?.transcript) && body.transcript.length > 0
      ? body.transcript
      : SAMPLE_TRANSCRIPT

    const supabase = await createServiceSupabaseClient()

    // Create a minimal session row
    const insertPayload: any = {
      user_id: body?.user_id || '00000000-0000-0000-0000-000000000000',
      agent_id: body?.agent_id || null,
      agent_name: body?.agent_name || 'Austin',
      agent_persona: body?.agent_persona || 'Standard homeowner persona',
      started_at: new Date().toISOString(),
      conversation_metadata: { seeded: true },
    }

    const { data: created, error: insertError } = await (supabase as any)
      .from('live_sessions')
      .insert(insertPayload)
      .select()
      .single()

    if (insertError || !created) {
      return NextResponse.json({ error: 'Failed to create test session', details: insertError }, { status: 500 })
    }

    const sessionId = (created as any).id as string

    // Save the transcript and end the session
    const { error: updateError } = await (supabase as any)
      .from('live_sessions')
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: body?.duration_seconds ?? 90,
        full_transcript: transcript,
        analytics: { seeded: true }
      })
      .eq('id', sessionId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save test transcript', details: updateError }, { status: 500 })
    }

    // Trigger grading
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/grade/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
      const json = await resp.json().catch(() => ({}))
      return NextResponse.json({
        ok: true,
        sessionId,
        gradingStatus: resp.status,
        gradingPayload: json
      })
    } catch (e) {
      return NextResponse.json({ ok: true, sessionId, gradingTriggered: false, note: 'Grading call failed to execute' })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to seed session' }, { status: 500 })
  }
}


