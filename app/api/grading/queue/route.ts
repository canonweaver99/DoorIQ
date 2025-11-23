import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { addLineRatingJob } from '@/lib/queue/supabase-queue'
import { splitTranscriptIntoBatches } from '@/lib/queue/supabase-worker'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const supabase = await createServiceSupabaseClient()

    // Get session and transcript
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const transcript = (session as any).full_transcript
    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return NextResponse.json({ error: 'No transcript available' }, { status: 400 })
    }

    // Get user profile for names
    const { data: userProfile } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', (session as any).user_id)
      .single()

    const salesRepName = (userProfile as any)?.full_name || 'Sales Rep'
    const customerName = (session as any).agent_name || 'Homeowner'

    // Split transcript into batches
    const batches = splitTranscriptIntoBatches(transcript, 5)
    const totalBatches = batches.length

    logger.info('Queueing line-by-line grading', {
      sessionId,
      totalBatches,
      totalLines: transcript.length,
    })

    // Queue each batch
    const jobPromises = batches.map((batch, batchIndex) =>
      addLineRatingJob({
        sessionId,
        transcript: batch,
        batchIndex,
        batchSize: batch.length,
        salesRepName,
        customerName,
        totalBatches,
      })
    )

    const jobs = await Promise.all(jobPromises)

    // Update session to mark line-by-line grading as queued
    await supabase
      .from('live_sessions')
      .update({
        analytics: {
          ...((session as any).analytics || {}),
          line_ratings_status: 'queued',
          line_ratings_total_batches: totalBatches,
          line_ratings_completed_batches: 0,
        },
      })
      .eq('id', sessionId)

    return NextResponse.json({
      success: true,
      sessionId,
      totalBatches,
      jobsQueued: jobs.length,
      jobIds: jobs.map((j) => j.id),
    })
  } catch (error: any) {
    logger.error('Failed to queue line-by-line grading', error)
    return NextResponse.json(
      { error: error.message || 'Failed to queue grading' },
      { status: 500 }
    )
  }
}

