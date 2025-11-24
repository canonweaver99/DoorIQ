import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/session/voice-analysis
 * Update voice analysis data for a session
 * This is called periodically during the session to save speech metrics
 */
export async function POST(req: NextRequest) {
  try {
    const { sessionId, voice_analysis } = await req.json()
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required field: sessionId' },
        { status: 400 }
      )
    }
    
    if (!voice_analysis) {
      return NextResponse.json(
        { error: 'Missing required field: voice_analysis' },
        { status: 400 }
      )
    }
    
    // Validate voice_analysis has actual data
    const hasValidVoiceData = voice_analysis && (
      typeof voice_analysis.avgWPM === 'number' ||
      typeof voice_analysis.totalFillerWords === 'number' ||
      typeof voice_analysis.wpmTimeline !== 'undefined'
    )
    
    if (!hasValidVoiceData) {
      return NextResponse.json(
        { error: 'Invalid voice_analysis data' },
        { status: 400 }
      )
    }
    
    const supabase = await createServiceSupabaseClient()
    
    // Get current session data to preserve existing analytics
    const { data: currentSession, error: fetchError } = await (supabase as any)
      .from('live_sessions')
      .select('analytics')
      .eq('id', sessionId)
      .single()
    
    if (fetchError || !currentSession) {
      console.error('❌ Failed to fetch session:', fetchError)
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    // Merge voice_analysis into existing analytics, preserving other analytics fields
    const existingAnalytics = currentSession.analytics || {}
    const updatedAnalytics = {
      ...existingAnalytics,
      voice_analysis: voice_analysis
    }
    
    console.log('🎤 Saving voice analysis incrementally:', {
      sessionId,
      avgWPM: voice_analysis.avgWPM,
      totalFillerWords: voice_analysis.totalFillerWords,
      wpmTimelineLength: voice_analysis.wpmTimeline?.length || 0,
      hasPitchData: voice_analysis.avgPitch > 0
    })
    
    // Update database
    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .update({ 
        analytics: updatedAnalytics 
      })
      .eq('id', sessionId)
      .select('id, analytics')
      .single()
    
    if (error) {
      console.error('❌ Failed to save voice analysis:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true,
      sessionId: data.id,
      voiceAnalysisSaved: !!data.analytics?.voice_analysis
    })
  } catch (e: any) {
    console.error('❌ Error in voice-analysis POST:', e)
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

