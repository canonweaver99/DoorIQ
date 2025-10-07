import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { id, duration, transcript } = await req.json()
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    console.log('Ending session:', id)

    const supabase = await createServiceSupabaseClient()
    
    const { error } = await (supabase as any)
      .from('live_sessions')
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: duration,
        full_transcript: transcript,
      })
      .eq('id', id)

    if (error) {
      console.error('Error ending session:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Session ended successfully')
    
    // Trigger grading
    if (transcript && transcript.length > 0) {
      fetch('/api/grade/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id }),
      }).catch(e => console.error('Grading failed:', e))
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
