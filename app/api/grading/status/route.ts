import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const supabase = await createServiceSupabaseClient()

    const { data: session, error } = await supabase
      .from('live_sessions')
      .select('analytics, graded')
      .eq('id', sessionId)
      .single()

    if (error) {
      logger.error('Error fetching grading status', { error, sessionId })
      // Return 404 only if it's a "not found" error, otherwise return 500
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
    }

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const analytics = (session as any).analytics || {}
    const lineRatings = analytics.line_ratings || []
    const lineRatingsStatus = analytics.line_ratings_status || 'not_started'
    const totalBatches = analytics.line_ratings_total_batches || 0
    const completedBatches = analytics.line_ratings_completed_batches || 0

    // Calculate progress
    const progress = totalBatches > 0 ? (completedBatches / totalBatches) * 100 : 0

    return NextResponse.json({
      sessionId,
      graded: session.graded || false,
      lineRatingsStatus: lineRatingsStatus,
      lineRatingsCount: lineRatings.length,
      totalBatches,
      completedBatches,
      progress: Math.round(progress),
      isComplete: lineRatingsStatus === 'completed' || (totalBatches > 0 && completedBatches >= totalBatches),
    })
  } catch (error: any) {
    logger.error('Failed to get grading status', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get status' },
      { status: 500 }
    )
  }
}

