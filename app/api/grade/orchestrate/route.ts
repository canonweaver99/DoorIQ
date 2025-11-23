import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export const maxDuration = 60 // 60 seconds total
export const dynamic = 'force-dynamic'

/**
 * Orchestration endpoint that coordinates all grading phases:
 * 1. Instant Metrics (0-2s)
 * 2. Key Moments Detection (2-5s)
 * 3. Deep Analysis (5-15s, background)
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { sessionId, transcript, elevenLabsConversationId } = await req.json()
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    const supabase = await createServiceSupabaseClient()
    
    // Fetch session data
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    if (sessionError || !session) {
      logger.error('Session not found for orchestration', { sessionId, error: sessionError })
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    // Get transcript if not provided
    const sessionTranscript = transcript || session.full_transcript || []
    if (!Array.isArray(sessionTranscript) || sessionTranscript.length === 0) {
      return NextResponse.json({ error: 'No transcript available' }, { status: 400 })
    }
    
    const results: any = {
      sessionId,
      phases: {}
    }
    
    // Phase 1: Instant Metrics (0-2s)
    try {
      logger.info('Starting Phase 1: Instant Metrics', { sessionId })
      const instantStart = Date.now()
      
      const instantResponse = await fetch(`${req.nextUrl.origin}/api/grade/instant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          transcript: sessionTranscript,
          elevenLabsConversationId: elevenLabsConversationId || session.elevenlabs_conversation_id
        })
      })
      
      if (instantResponse.ok) {
        const instantData = await instantResponse.json()
        results.phases.instant = {
          status: 'complete',
          timeElapsed: Date.now() - instantStart,
          metrics: instantData.metrics,
          scores: instantData.scores
        }
        logger.info('Phase 1 completed', { sessionId, timeElapsed: Date.now() - instantStart })
      } else {
        const error = await instantResponse.text()
        logger.error('Phase 1 failed', { sessionId, error })
        results.phases.instant = {
          status: 'failed',
          error: error.substring(0, 200)
        }
        // Continue to next phase even if instant fails
      }
    } catch (error: any) {
      logger.error('Phase 1 error', { sessionId, error: error.message })
      results.phases.instant = {
        status: 'error',
        error: error.message
      }
    }
    
    // Phase 2: Key Moments Detection (2-5s)
    try {
      logger.info('Starting Phase 2: Key Moments', { sessionId })
      const momentsStart = Date.now()
      
      // Get instant metrics for context
      const instantMetrics = results.phases.instant?.metrics || session.instant_metrics
      
      const momentsResponse = await fetch(`${req.nextUrl.origin}/api/grade/key-moments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          transcript: sessionTranscript,
          instantMetrics
        })
      })
      
      if (momentsResponse.ok) {
        const momentsData = await momentsResponse.json()
        results.phases.keyMoments = {
          status: 'complete',
          timeElapsed: Date.now() - momentsStart,
          keyMoments: momentsData.keyMoments,
          feedback: momentsData.feedback
        }
        logger.info('Phase 2 completed', { sessionId, timeElapsed: Date.now() - momentsStart })
      } else {
        const error = await momentsResponse.text()
        logger.error('Phase 2 failed', { sessionId, error })
        results.phases.keyMoments = {
          status: 'failed',
          error: error.substring(0, 200)
        }
        // Continue to next phase even if key moments fails
      }
    } catch (error: any) {
      logger.error('Phase 2 error', { sessionId, error: error.message })
      results.phases.keyMoments = {
        status: 'error',
        error: error.message
      }
    }
    
    // Phase 3: Deep Analysis (5-15s, fire and forget)
    // Trigger in background - don't wait for completion
    try {
      logger.info('Starting Phase 3: Deep Analysis (background)', { sessionId })
      
      // Fire and forget - don't await
      fetch(`${req.nextUrl.origin}/api/grade/deep-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          keyMoments: results.phases.keyMoments?.keyMoments || session.key_moments,
          instantMetrics: results.phases.instant?.metrics || session.instant_metrics,
          elevenLabsData: session.elevenlabs_metrics
        })
      }).catch(error => {
        logger.error('Phase 3 background error', { sessionId, error: error.message })
      })
      
      results.phases.deepAnalysis = {
        status: 'processing',
        message: 'Deep analysis running in background'
      }
    } catch (error: any) {
      logger.error('Phase 3 trigger error', { sessionId, error: error.message })
      results.phases.deepAnalysis = {
        status: 'error',
        error: error.message
      }
    }
    
    const totalTime = Date.now() - startTime
    results.totalTimeElapsed = totalTime
    results.status = 'orchestration_complete'
    
    logger.info('Grading orchestration completed', {
      sessionId,
      totalTime: `${totalTime}ms`,
      phases: Object.keys(results.phases)
    })
    
    return NextResponse.json(results)
  } catch (error: any) {
    logger.error('Error in grading orchestration', error)
    return NextResponse.json(
      { error: error.message || 'Failed to orchestrate grading' },
      { status: 500 }
    )
  }
}

