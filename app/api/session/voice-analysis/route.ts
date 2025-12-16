import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = "force-dynamic";
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
      .select('id, analytics, duration_seconds, ended_at')
      .single()
    
    if (error) {
      console.error('❌ Failed to save voice analysis:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    // Also save to speech_analysis table for dedicated querying
    // Use upsert to update if record exists, insert if not
    const speechAnalysisData = {
      session_id: sessionId,
      is_final: !!data.ended_at, // Final if session has ended
      avg_wpm: Math.round(voice_analysis.avgWPM || 0),
      total_filler_words: voice_analysis.totalFillerWords || 0,
      filler_words_per_minute: data.duration_seconds && data.duration_seconds > 0
        ? (voice_analysis.totalFillerWords || 0) / (data.duration_seconds / 60)
        : 0,
      avg_pitch: voice_analysis.avgPitch || null,
      min_pitch: voice_analysis.minPitch || null,
      max_pitch: voice_analysis.maxPitch || null,
      pitch_variation: voice_analysis.pitchVariation || null,
      avg_volume: voice_analysis.avgVolume || null,
      volume_consistency: voice_analysis.volumeConsistency || null,
      has_pitch_data: !!(voice_analysis.avgPitch && voice_analysis.avgPitch > 0),
      has_volume_data: !!(voice_analysis.avgVolume && voice_analysis.avgVolume > 0),
      pitch_timeline: voice_analysis.pitchTimeline || [],
      volume_timeline: voice_analysis.volumeTimeline || [],
      wpm_timeline: voice_analysis.wpmTimeline || [],
      issues: {
        excessiveFillers: (voice_analysis.totalFillerWords || 0) > 10,
        tooFast: (voice_analysis.avgWPM || 0) > 200,
        tooSlow: (voice_analysis.avgWPM || 0) < 120 && (voice_analysis.avgWPM || 0) > 0,
        monotone: voice_analysis.isMonotone || false,
        lowEnergy: voice_analysis.lowEnergy || false,
        poorEndings: voice_analysis.poorEndings || false
      },
      analysis_timestamp: new Date().toISOString()
    }
    
    // Upsert to speech_analysis table (update if exists, insert if not)
    // First try to update existing record
    const { data: existingRecord } = await supabase
      .from('speech_analysis')
      .select('id')
      .eq('session_id', sessionId)
      .single()
    
    let speechError = null
    if (existingRecord) {
      // Update existing record
      const { error } = await supabase
        .from('speech_analysis')
        .update(speechAnalysisData)
        .eq('session_id', sessionId)
      speechError = error
    } else {
      // Insert new record
      const { error } = await supabase
        .from('speech_analysis')
        .insert(speechAnalysisData)
      speechError = error
    }
    
    if (speechError) {
      console.error('⚠️ Failed to save to speech_analysis table (non-critical):', speechError)
      // Don't fail the request - this is supplementary data
    } else {
      console.log('✅ Saved to speech_analysis table:', {
        sessionId,
        is_final: speechAnalysisData.is_final,
        avg_wpm: speechAnalysisData.avg_wpm
      })
    }
    
    return NextResponse.json({ 
      success: true,
      sessionId: data.id,
      voiceAnalysisSaved: !!data.analytics?.voice_analysis,
      speechAnalysisSaved: !speechError
    })
  } catch (e: any) {
    console.error('❌ Error in voice-analysis POST:', e)
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

