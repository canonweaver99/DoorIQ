import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export const dynamic = "force-dynamic";
export const maxDuration = 60

/**
 * Retry endpoint for failed grading phases
 * Can be called manually or automatically to retry failed phases
 */
export async function POST(req: NextRequest) {
  try {
    const { sessionId, phase } = await req.json()
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    const supabase = await createServiceSupabaseClient()
    
    // Fetch session to check current status
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    // Check if deep analysis failed
    const deepAnalysisError = session.analytics?.deep_analysis_error
    const gradingStatus = session.grading_status
    
    // If deep analysis failed or grading is stuck, retry it
    if (deepAnalysisError || (gradingStatus !== 'complete' && session.overall_score === null)) {
      logger.info('Retrying deep analysis', { sessionId, hadError: !!deepAnalysisError })
      
      // Clear error flag
      await supabase
        .from('live_sessions')
        .update({
          analytics: {
            ...session.analytics,
            deep_analysis_error: false,
            deep_analysis_retry_count: (session.analytics?.deep_analysis_retry_count || 0) + 1,
            deep_analysis_last_retry: new Date().toISOString()
          }
        })
        .eq('id', sessionId)
      
      // Trigger deep analysis
      const deepAnalysisUrl = `${req.nextUrl.origin}/api/grade/deep-analysis`
      const response = await fetch(deepAnalysisUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          keyMoments: session.key_moments,
          instantMetrics: session.instant_metrics,
          elevenLabsData: session.elevenlabs_metrics
        })
      })
      
      if (response.ok) {
        const data = await response.json().catch(() => ({}))
        return NextResponse.json({ 
          success: true, 
          message: 'Deep analysis retry initiated',
          status: data.status 
        })
      } else {
        const errorText = await response.text().catch(() => 'Unknown error')
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to retry deep analysis',
          details: errorText 
        }, { status: 500 })
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'No retry needed - grading appears to be complete or in progress' 
    })
  } catch (error: any) {
    logger.error('Error in retry endpoint', error)
    return NextResponse.json(
      { error: error.message || 'Failed to retry grading' },
      { status: 500 }
    )
  }
}
