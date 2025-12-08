import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export const maxDuration = 10
export const dynamic = 'force-dynamic'

/**
 * Health check endpoint to verify grading status and diagnose issues
 * GET /api/grade/health?sessionId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json({ 
        error: 'Session ID required',
        usage: 'GET /api/grade/health?sessionId=xxx'
      }, { status: 400 })
    }
    
    const supabase = await createServiceSupabaseClient()
    
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    if (sessionError || !session) {
      return NextResponse.json({ 
        error: 'Session not found',
        sessionId 
      }, { status: 404 })
    }
    
    // Diagnose grading status
    const diagnosis = {
      sessionId,
      status: 'healthy',
      issues: [] as string[],
      recommendations: [] as string[],
      
      // Phase status
      phase1_complete: !!session.instant_metrics,
      phase2_complete: !!session.key_moments && Array.isArray(session.key_moments) && session.key_moments.length > 0,
      phase3_complete: session.grading_status === 'complete' && session.sale_closed !== null,
      
      // Data checks
      has_transcript: Array.isArray(session.full_transcript) && session.full_transcript.length > 0,
      has_ended_at: !!session.ended_at,
      has_scores: session.overall_score !== null,
      has_sale_status: session.sale_closed !== null,
      
      // Error checks
      has_errors: !!session.analytics?.deep_analysis_error,
      error_message: session.analytics?.deep_analysis_error_message || null,
      retry_count: session.analytics?.deep_analysis_retry_count || 0,
      
      // Timing
      started_at: session.started_at,
      ended_at: session.ended_at,
      graded_at: session.graded_at,
      deep_analysis_started: session.analytics?.deep_analysis_started_at || null,
      deep_analysis_completed: session.analytics?.deep_analysis_completed_at || null,
      
      // Current state
      grading_status: session.grading_status,
      overall_score: session.overall_score,
      sale_closed: session.sale_closed,
      virtual_earnings: session.virtual_earnings
    }
    
    // Identify issues
    if (!diagnosis.has_ended_at) {
      diagnosis.issues.push('Session never ended (ended_at is NULL)')
      diagnosis.recommendations.push('Run fix-session-finalization.js script')
      diagnosis.status = 'error'
    }
    
    if (!diagnosis.has_transcript) {
      diagnosis.issues.push('No transcript available')
      diagnosis.status = 'error'
    }
    
    if (!diagnosis.phase1_complete) {
      diagnosis.issues.push('Phase 1 (Instant Metrics) not complete')
      diagnosis.recommendations.push('Trigger grading orchestration')
    }
    
    if (!diagnosis.phase2_complete && diagnosis.phase1_complete) {
      diagnosis.issues.push('Phase 2 (Key Moments) not complete')
      diagnosis.recommendations.push('Check key-moments endpoint logs')
    }
    
    if (!diagnosis.phase3_complete && diagnosis.phase2_complete) {
      diagnosis.issues.push('Phase 3 (Deep Analysis) not complete')
      if (diagnosis.has_errors) {
        diagnosis.recommendations.push('Deep analysis failed - use /api/grade/retry to retry')
      } else {
        diagnosis.recommendations.push('Deep analysis may still be running - wait or check logs')
      }
      diagnosis.status = 'warning'
    }
    
    if (diagnosis.has_errors) {
      diagnosis.status = 'error'
      diagnosis.recommendations.push(`Error: ${diagnosis.error_message}`)
      if (diagnosis.retry_count < 2) {
        diagnosis.recommendations.push('POST to /api/grade/retry to retry deep analysis')
      }
    }
    
    if (diagnosis.phase3_complete && !diagnosis.has_scores) {
      diagnosis.issues.push('Grading marked complete but no scores found')
      diagnosis.status = 'warning'
    }
    
    // Calculate time since session ended
    if (session.ended_at) {
      const endedAt = new Date(session.ended_at)
      const now = new Date()
      const minutesSinceEnd = Math.floor((now.getTime() - endedAt.getTime()) / 1000 / 60)
      diagnosis.minutes_since_ended = minutesSinceEnd
      
      if (minutesSinceEnd > 5 && !diagnosis.phase3_complete) {
        diagnosis.issues.push(`Session ended ${minutesSinceEnd} minutes ago but grading not complete`)
        diagnosis.status = 'error'
        diagnosis.recommendations.push('Grading appears stuck - check server logs or retry')
      }
    }
    
    return NextResponse.json(diagnosis)
  } catch (error: any) {
    logger.error('Error in health check', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check grading health' },
      { status: 500 }
    )
  }
}
