import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export const maxDuration = 60 // 60 seconds total
export const dynamic = 'force-dynamic'

/**
 * Detect inappropriate/profane language in transcript
 * Returns true if inappropriate language is detected
 */
function detectInappropriateLanguage(transcript: any[]): boolean {
  if (!Array.isArray(transcript) || transcript.length === 0) return false
  
  // Comprehensive list of inappropriate words/phrases
  const inappropriatePatterns = [
    /\bn[i1]gg?[e3]r\b/i,
    /\bf[a4]gg?[o0]t\b/i,
    /\bc[o0]ck\b/i,
    /\bp[u3]ssy\b/i,
    /\ba[s5]s\b/i,
    /\bsh[i1]t\b/i,
    /\bf[u3]ck\b/i,
    /\bd[i1]ck\b/i,
    /\bt[i1]ts?\b/i,
    /\bb[i1]tch\b/i,
    /\bwh[o0]re\b/i,
    /\bsl[u3]t\b/i,
    /\bc[u3]nt\b/i,
    /\btw[a4]t\b/i,
    /\bp[o0]rn\b/i,
    /\bs[e3]x\b/i,
    /\br[a4]p[e3]\b/i,
    /\bk[i1]ll\b/i,
    /\bm[u3]rd[e3]r\b/i,
    /\bh[a4]t[e3]\b/i,
    /\bk[i1]ll\s+y[o0]u\b/i,
    /\bf[u3]ck\s+y[o0]u\b/i,
    /\bg[o0]\s+t[o0]\s+h[e3]ll\b/i,
    /\bd[i1][e3]\b/i,
    /\bs[u3]ck\b/i,
    /\bl[i1]ck\b/i,
    /\bbl[o0]w\s+j[o0]b\b/i,
    /\bh[o0]m[o0]\b/i,
    /\bg[a4]y\b/i,
    /\br[e3]t[a4]rd\b/i,
    /\bm[o0]r[o0]n\b/i,
    /\bi[d4]i[o0]t\b/i,
    /\bst[u3]p[i1]d\b/i,
    /\bd[u3]mb\b/i,
    /\bf[a4]rt\b/i,
    /\bp[o0][o0]p\b/i,
    /\bp[i1]ss\b/i,
    /\bp[i1]ss\s+[o0]ff\b/i,
    /\bg[o0]\s+f[u3]ck\s+y[o0]urs[e3]lf\b/i,
    /\bsh[u3]t\s+u[p3]\b/i,
    /\bsh[u3]t\s+th[e3]\s+f[u3]ck\s+u[p3]\b/i
  ]
  
  // Check all transcript entries for inappropriate language
  for (const entry of transcript) {
    const text = (entry.text || entry.message || '').toLowerCase()
    if (!text) continue
    
    // Check against all patterns
    for (const pattern of inappropriatePatterns) {
      if (pattern.test(text)) {
        logger.warn('🚫 Inappropriate language detected', { 
          pattern: pattern.toString(), 
          text: text.substring(0, 50),
          speaker: entry.speaker 
        })
        return true
      }
    }
  }
  
  return false
}

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
    logger.info('🎯 Grading orchestration started', { sessionId, timestamp: new Date().toISOString() })
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    const fetchStart = Date.now()
    const supabase = await createServiceSupabaseClient()
    
    // OPTIMIZATION: Fetch session data (we'll fetch transcript separately if needed)
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    logger.info('⏱️ Session fetch time', { timeMs: Date.now() - fetchStart })
    
    if (sessionError || !session) {
      logger.error('Session not found for orchestration', { sessionId, error: sessionError })
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    // Get transcript if not provided
    const sessionTranscript = transcript || session.full_transcript || []
    if (!Array.isArray(sessionTranscript) || sessionTranscript.length === 0) {
      return NextResponse.json({ error: 'No transcript available' }, { status: 400 })
    }
    
    // CRITICAL: Check for inappropriate language FIRST - if detected, set all scores to 0
    const hasInappropriateLanguage = detectInappropriateLanguage(sessionTranscript)
    if (hasInappropriateLanguage) {
      logger.error('🚫 Inappropriate language detected - setting all scores to 0', { sessionId })
      
      // Immediately update session with zero scores
      await supabase
        .from('live_sessions')
        .update({
          overall_score: 0,
          rapport_score: 0,
          discovery_score: 0,
          objection_handling_score: 0,
          close_score: 0,
          safety_score: 0,
          analytics: {
            ...session.analytics,
            inappropriate_language_detected: true,
            grading_note: 'Session score set to 0 due to inappropriate language detected in transcript'
          }
        })
        .eq('id', sessionId)
      
      return NextResponse.json({
        sessionId,
        status: 'orchestration_complete',
        inappropriateLanguageDetected: true,
        message: 'Session score set to 0 due to inappropriate language',
        phases: {
          instant: {
            status: 'skipped',
            reason: 'Inappropriate language detected'
          },
          keyMoments: {
            status: 'skipped',
            reason: 'Inappropriate language detected'
          },
          deepAnalysis: {
            status: 'skipped',
            reason: 'Inappropriate language detected'
          }
        }
      })
    }
    
    const results: any = {
      sessionId,
      phases: {}
    }
    
    // Phase 1: Instant Metrics (0-2s)
    try {
      logger.info('📊 Starting Phase 1: Instant Metrics', { sessionId })
      const instantStart = Date.now()
      
      // OPTIMIZATION: Sync ElevenLabs metrics in parallel (fire and forget) to not block Phase 1
      const conversationId = elevenLabsConversationId || session.elevenlabs_conversation_id
      if (conversationId && !session.elevenlabs_metrics) {
        logger.info('Attempting to sync ElevenLabs metrics (non-blocking)', { sessionId, conversationId })
        // Fire and forget - don't wait for this
        fetch(`${req.nextUrl.origin}/api/elevenlabs/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        })
          .then(async (syncResponse) => {
            if (syncResponse.ok) {
              logger.info('Successfully synced ElevenLabs metrics', { sessionId })
            } else {
              // Track failure in session analytics
              const errorData = await syncResponse.json().catch(() => ({ error: 'Unknown error' }))
              logger.warn('Failed to sync ElevenLabs metrics', { sessionId, error: errorData })
              await supabase
                .from('live_sessions')
                .update({
                  analytics: {
                    ...session.analytics,
                    speech_grading_error: true
                  }
                })
                .eq('id', sessionId)
            }
          })
          .catch(async (syncError) => {
            logger.warn('Failed to sync ElevenLabs metrics (non-blocking)', { sessionId, error: syncError })
            // Track failure in session analytics
            await supabase
              .from('live_sessions')
              .update({
                analytics: {
                  ...session.analytics,
                  speech_grading_error: true
                }
              })
              .eq('id', sessionId)
          })
      }
      
      const instantResponse = await fetch(`${req.nextUrl.origin}/api/grade/instant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          transcript: sessionTranscript,
          elevenLabsConversationId: conversationId
        })
      })
      
      if (instantResponse.ok) {
        const instantData = await instantResponse.json()
        const instantTime = Date.now() - instantStart
        results.phases.instant = {
          status: 'complete',
          timeElapsed: instantTime,
          metrics: instantData.metrics,
          scores: instantData.scores
        }
        logger.info('✅ Phase 1 completed', { sessionId, timeElapsed: `${instantTime}ms`, timeSeconds: `${(instantTime / 1000).toFixed(2)}s` })
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
      logger.info('🔍 Starting Phase 2: Key Moments', { sessionId })
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
        const momentsTime = Date.now() - momentsStart
        results.phases.keyMoments = {
          status: 'complete',
          timeElapsed: momentsTime,
          keyMoments: momentsData.keyMoments,
          feedback: momentsData.feedback
        }
        logger.info('✅ Phase 2 completed', { sessionId, timeElapsed: `${momentsTime}ms`, timeSeconds: `${(momentsTime / 1000).toFixed(2)}s` })
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
      
      // Fire and forget - don't await, but log the request
      const deepAnalysisUrl = `${req.nextUrl.origin}/api/grade/deep-analysis`
      logger.info('Triggering deep analysis', { sessionId, url: deepAnalysisUrl })
      
      fetch(deepAnalysisUrl, {
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
      })
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json().catch(() => ({}))
          logger.info('Deep analysis completed successfully', { sessionId, status: data.status })
        } else {
          const errorText = await response.text().catch(() => 'Unknown error')
          logger.error('Deep analysis failed', { sessionId, status: response.status, error: errorText })
        }
      })
      .catch(error => {
        logger.error('Phase 3 background error', { sessionId, error: error.message, stack: error.stack })
      })
      
      results.phases.deepAnalysis = {
        status: 'processing',
        message: 'Deep analysis running in background'
      }
    } catch (error: any) {
      logger.error('Phase 3 trigger error', { sessionId, error: error.message, stack: error.stack })
      results.phases.deepAnalysis = {
        status: 'error',
        error: error.message
      }
    }
    
    const totalTime = Date.now() - startTime
    results.totalTimeElapsed = totalTime
    results.status = 'orchestration_complete'
    
    logger.info('🎉 Grading orchestration completed', {
      sessionId,
      totalTime: `${totalTime}ms`,
      totalTimeSeconds: `${(totalTime / 1000).toFixed(2)}s`,
      phase1Time: results.phases.instant?.timeElapsed || 'N/A',
      phase2Time: results.phases.keyMoments?.timeElapsed || 'N/A',
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

