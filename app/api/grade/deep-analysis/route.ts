import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { logger } from '@/lib/logger'

export const maxDuration = 60 // 60 seconds for deep analysis
export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 45000,
  maxRetries: 2
})

// Get user's historical performance for comparison
async function getUserPerformanceHistory(sessionId: string, supabase: any) {
  try {
    // First get the session to find user_id
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single()
    
    if (sessionError || !session) {
      logger.warn('Session not found for history lookup', { sessionId })
      return null
    }
    
    // Get user's recent sessions (last 10)
    const { data: sessions, error: historyError } = await supabase
      .from('live_sessions')
      .select('overall_score, rapport_score, discovery_score, objection_handling_score, close_score, created_at')
      .eq('user_id', session.user_id)
      .not('overall_score', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (historyError) {
      logger.warn('Error fetching user history', historyError)
      return null
    }
    
    if (!sessions || sessions.length === 0) {
      return {
        averageScore: null,
        sessionCount: 0,
        recentScores: []
      }
    }
    
    const scores = sessions
      .map(s => s.overall_score)
      .filter((score): score is number => typeof score === 'number')
    
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null
    
    return {
      averageScore,
      sessionCount: sessions.length,
      recentScores: scores,
      averageRapport: calculateAverage(sessions.map(s => s.rapport_score)),
      averageDiscovery: calculateAverage(sessions.map(s => s.discovery_score)),
      averageObjection: calculateAverage(sessions.map(s => s.objection_handling_score)),
      averageClosing: calculateAverage(sessions.map(s => s.close_score))
    }
  } catch (error) {
    logger.error('Error getting user performance history', error)
    return null
  }
}

function calculateAverage(scores: (number | null)[]): number | null {
  const validScores = scores.filter((s): s is number => typeof s === 'number')
  if (validScores.length === 0) return null
  return Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
}

// Perform deep GPT-4o analysis with full context - COMBINED with coaching plan for speed
async function performDeepAnalysis(data: {
  keyMoments: any[]
  instantMetrics: any
  elevenLabsData: any
  userHistory: any
  transcript: any[]
  durationSeconds: number
}) {
  const { keyMoments, instantMetrics, elevenLabsData, userHistory, transcript, durationSeconds } = data
  
  // Limit key moments to top 2 for faster processing
  const topKeyMoments = keyMoments.slice(0, 2)
  
  // Format full transcript for comprehensive analysis
  const fullTranscript = transcript.map((entry: any, index: number) => {
    const speaker = entry.speaker === 'user' || entry.speaker === 'rep' ? 'rep' : 'customer'
    const text = entry.text || entry.message || ''
    return `[${index}] ${speaker}: ${text}`
  }).join('\n')
  
  const prompt = `You are an expert door-to-door sales coach analyzing a sales conversation. Return ONLY valid JSON.

CONTEXT:
- User avg score: ${userHistory?.averageScore || 'N/A'}
- Instant estimated score: ${instantMetrics?.estimatedScore || 'N/A'}
- Key moments: ${topKeyMoments.length}
- WPM: ${instantMetrics?.wordsPerMinute || 'N/A'}
- Talk ratio: ${instantMetrics?.conversationBalance || 'N/A'}%
- Objections faced: ${instantMetrics?.objectionCount || 0}
- Close attempts: ${instantMetrics?.closeAttempts || 0}
- Duration: ${Math.round(durationSeconds / 60)} minutes

KEY MOMENTS:
${topKeyMoments.map((m, i) => `${i + 1}. ${m.type}: "${m.transcript.slice(0, 60)}"`).join('\n')}

FULL CONVERSATION TRANSCRIPT:
${fullTranscript}

SCORING RULES (0-100):
- Overall = average of rapport, discovery, objectionHandling, closing (weighted equally)
- Rapport = connection and trust building
- Discovery = quality of questions asked and listening
- ObjectionHandling = how well objections were addressed (85+ if handled effectively)
- Closing = commitment level (90-100=sale, 75-89=appointment, 60-74=trial, 40-59=weak, 0-39=none)
- If sale_closed=true AND objections handled well: overall should be 90+
- If sale_closed=true: closing score should be 90+

SALE DETECTION (CRITICAL):
✅ sale_closed=true if ANY of these occur:
1. STRONG BUYING SIGNALS: "sounds good", "that works", "I'm interested", "let's do it", "I'll take it", "count me in", "I'm ready", "when can you start", "what's next", "how do I sign up", "that makes sense", "I like that", "we need that", "definitely need", agreement after price discussion
2. HARD COMMITMENTS: Payment agreement, contract signing, "let's get started", "I'm ready to sign", explicit "yes" to service
3. APPOINTMENT SCHEDULING WITH SPECIFIC TIME/DATE: "I'm coming back", "I'll come back", "coming back tomorrow", "coming back at [time]", "see you tomorrow", "see you at [time]", specific time commitments after service discussion = SALE

❌ NOT a sale: "I'll think about it" without commitment, vague "sometime" or "later" without specific time, "maybe" without follow-up
- return_appointment=true ONLY if scheduled follow-up but NO specific time/date commitment AND no sale commitment

EARNINGS CALCULATION (if sale_closed=true):
- Extract deal value from conversation (price mentioned, contract length)
- Commission: 30% of total_contract_value
- Bonuses: quick_close=$25 (<15min), upsell=$50, retention=$30 (annual+), same_day_start=$20, referral_secured=$25, perfect_pitch=$50 (score>=90)
- total_earned = commission + bonuses

Return JSON:
{
  "overallAssessment": "1 sentence comparison",
  "topStrengths": ["s1", "s2"],
  "topImprovements": ["i1", "i2"],
  "finalScores": {"overall": n, "rapport": n, "discovery": n, "objectionHandling": n, "closing": n, "safety": n},
  "sale_closed": bool,
  "return_appointment": bool,
  "virtual_earnings": number,
  "earnings_data": {"base_amount": n, "closed_amount": n, "commission_rate": 0.30, "commission_earned": n, "bonus_modifiers": {"quick_close": n, "upsell": n, "retention": n, "same_day_start": n, "referral_secured": n, "perfect_pitch": n}, "total_earned": n},
  "deal_details": {"product_sold": "s", "service_type": "s", "base_price": n, "monthly_value": n, "contract_length": n, "total_contract_value": n, "payment_method": "s", "add_ons": [], "start_date": "s"},
  "coachingPlan": {"immediateFixes": [{"issue": "i", "practiceScenario": "s"}], "rolePlayScenarios": [{"scenario": "s", "focus": "f"}]},
  "feedback": {"strengths": ["s1 with specific quote"], "improvements": ["i1"], "specific_tips": ["t1"]},
  "session_highlight": "One specific highlight with actual quote from conversation (1 line max, include quote)"
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Best model for quality
      messages: [
        { role: 'system', content: 'Sales coach. JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3, // Lower temperature for faster responses
      max_tokens: 1000, // Reduced for speed
      response_format: { type: 'json_object' }
    })
    
    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No content from OpenAI')
    }
    
    const parsed = JSON.parse(content)
    
    // Extract coaching plan from combined response
    const coachingPlan = parsed.coachingPlan || {
      immediateFixes: [],
      skillDevelopment: [],
      rolePlayScenarios: []
    }
    
    // Return structured response matching old format
    return {
      overallAssessment: parsed.overallAssessment || '',
      topStrengths: parsed.topStrengths || [],
      topImprovements: parsed.topImprovements || [],
      finalScores: parsed.finalScores || {},
      saleClosed: parsed.sale_closed || false,
      returnAppointment: parsed.return_appointment || false,
      virtualEarnings: parsed.virtual_earnings || 0,
      earningsData: parsed.earnings_data || {},
      dealDetails: parsed.deal_details || {},
      coachingPlan,
      feedback: parsed.feedback || {
        strengths: parsed.topStrengths || [],
        improvements: parsed.topImprovements || [],
        specific_tips: []
      },
      sessionHighlight: parsed.session_highlight || parsed.feedback?.strengths?.[0] || ''
    }
  } catch (error: any) {
    logger.error('Error performing deep analysis', error)
    throw error
  }
}

// Generate personalized coaching plan - NOW COMBINED WITH performDeepAnalysis
// Keeping function for backwards compatibility but it's no longer called separately
async function generateCoachingPlan(deepAnalysis: any, userHistory: any) {
  // This is now included in performDeepAnalysis response
  return deepAnalysis.coachingPlan || {
    immediateFixes: [],
    skillDevelopment: [],
    rolePlayScenarios: []
  }
}

// Calculate final scores with adjustments
function calculateFinalScores(deepAnalysis: any, instantMetrics: any) {
  const instantScores = instantMetrics?.estimatedScores || {}
  
  const adjustments = deepAnalysis.scoreAdjustments || {}
  
  return {
    overall: deepAnalysis.finalScores?.overall || instantMetrics?.estimatedScore || 0,
    rapport: deepAnalysis.finalScores?.rapport || 
             (instantScores.rapport + (adjustments.rapport?.adjustment || 0)),
    discovery: deepAnalysis.finalScores?.discovery || 
               (instantScores.discovery + (adjustments.discovery?.adjustment || 0)),
    objectionHandling: deepAnalysis.finalScores?.objectionHandling || 
                       (instantScores.objectionHandling + (adjustments.objectionHandling?.adjustment || 0)),
    closing: deepAnalysis.finalScores?.closing || 
             (instantScores.closing + (adjustments.closing?.adjustment || 0)),
    safety: deepAnalysis.finalScores?.safety || 
            (instantScores.safety + (adjustments.safety?.adjustment || 0))
  }
}

// Compare to historical performance
function compareToHistory(userHistory: any, currentScores: any) {
  if (!userHistory || !userHistory.averageScore) {
    return {
      trend: 'no_data',
      improvement: null,
      message: 'Not enough historical data for comparison'
    }
  }
  
  const improvement = currentScores.overall - userHistory.averageScore
  
  return {
    trend: improvement > 5 ? 'improving' : improvement < -5 ? 'declining' : 'stable',
    improvement,
    message: improvement > 0 
      ? `Improved by ${improvement} points from your average`
      : improvement < 0
      ? `Declined by ${Math.abs(improvement)} points from your average`
      : 'Performed at your average level'
  }
}

// Calculate trends
function calculateTrends(userHistory: any) {
  if (!userHistory || !userHistory.recentScores || userHistory.recentScores.length < 3) {
    return {
      trend: 'insufficient_data',
      message: 'Need at least 3 sessions to calculate trends'
    }
  }
  
  const scores = userHistory.recentScores
  const recent = scores.slice(0, 3)
  const older = scores.slice(3, 6)
  
  if (older.length === 0) {
    return {
      trend: 'insufficient_data',
      message: 'Need more sessions for trend analysis'
    }
  }
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
  
  const trend = recentAvg > olderAvg ? 'improving' : recentAvg < olderAvg ? 'declining' : 'stable'
  
  return {
    trend,
    recentAverage: Math.round(recentAvg),
    previousAverage: Math.round(olderAvg),
    change: Math.round(recentAvg - olderAvg),
    message: trend === 'improving' 
      ? `Your recent sessions are ${Math.round(recentAvg - olderAvg)} points higher on average`
      : trend === 'declining'
      ? `Your recent sessions are ${Math.round(olderAvg - recentAvg)} points lower on average`
      : 'Your performance has been stable'
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { sessionId, keyMoments, instantMetrics, elevenLabsData } = await req.json()
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }
    
    const supabase = await createServiceSupabaseClient()
    
    // Fetch session data if not provided
    let sessionData: any = null
    if (!keyMoments || !instantMetrics) {
      const { data: session, error: sessionError } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()
      
      if (sessionError || !session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
      
      sessionData = session
    }
    
    const finalKeyMoments = keyMoments || sessionData?.key_moments || []
    const finalInstantMetrics = instantMetrics || sessionData?.instant_metrics || {}
    const finalElevenLabsData = elevenLabsData || sessionData?.elevenlabs_metrics || null
    const transcript = sessionData?.full_transcript || []
    const durationSeconds = sessionData?.duration_seconds || 0
    
    // Step 1: Get user's historical performance for comparison
    const userHistory = await getUserPerformanceHistory(sessionId, supabase)
    
    // Step 2: Deep GPT-4o analysis with full context (now includes coaching plan)
    const deepAnalysis = await performDeepAnalysis({
      keyMoments: finalKeyMoments,
      instantMetrics: finalInstantMetrics,
      elevenLabsData: finalElevenLabsData,
      userHistory,
      transcript,
      durationSeconds
    })
    
    // Step 3: Extract coaching plan from combined response
    const coachingPlan = deepAnalysis.coachingPlan || {
      immediateFixes: [],
      skillDevelopment: [],
      rolePlayScenarios: []
    }
    
    // Step 4: Calculate final precise scores
    const finalScores = calculateFinalScores(deepAnalysis, finalInstantMetrics)
    
    // Step 5: Compare to history
    const comparativePerformance = compareToHistory(userHistory, finalScores)
    const improvementTrends = calculateTrends(userHistory)
    
    // Step 6: Get existing analytics to preserve
    const { data: existingSession } = await supabase
      .from('live_sessions')
      .select('analytics')
      .eq('id', sessionId)
      .single()
    
    const existingAnalytics = existingSession?.analytics || {}
    
    // Step 7: Update with complete analysis
    // Build update object step by step to avoid issues
    const saleClosed = deepAnalysis.saleClosed || false
    const returnAppointment = deepAnalysis.returnAppointment || false
    const virtualEarnings = saleClosed ? (deepAnalysis.virtualEarnings || 0) : 0
    const earningsData = deepAnalysis.earningsData || {}
    const dealDetails = deepAnalysis.dealDetails || {}
    
    const updateData: any = {
      overall_score: finalScores.overall,
      rapport_score: Math.round(finalScores.rapport),
      discovery_score: Math.round(finalScores.discovery),
      objection_handling_score: Math.round(finalScores.objectionHandling),
      close_score: Math.round(finalScores.closing),
      sale_closed: saleClosed,
      return_appointment: returnAppointment,
      virtual_earnings: virtualEarnings,
      earnings_data: earningsData,
      deal_details: dealDetails,
      grading_status: 'complete',
      grading_version: '2.0'
    }
    
    // Only add safety_score if column exists (it might not in all schemas)
    if (finalScores.safety !== undefined) {
      updateData.safety_score = Math.round(finalScores.safety)
    }
    
    // Merge analytics carefully - preserve voice_analysis and other existing data
    const newAnalytics = {
      ...existingAnalytics,
      deep_analysis: deepAnalysis,
      coaching_plan: coachingPlan,
      feedback: deepAnalysis.feedback || existingAnalytics.feedback || {
        strengths: deepAnalysis.topStrengths || [],
        improvements: deepAnalysis.topImprovements || [],
        specific_tips: []
      },
      session_highlight: deepAnalysis.sessionHighlight || deepAnalysis.feedback?.strengths?.[0] || '',
      comparative_performance: comparativePerformance,
      improvement_trends: improvementTrends,
      final_scores: finalScores,
      earnings_data: earningsData,
      deal_details: dealDetails,
      grading_version: '2.0',
      graded_at: new Date().toISOString()
    }
    
    // Preserve voice_analysis if it exists (critical!)
    if (existingAnalytics.voice_analysis) {
      newAnalytics.voice_analysis = existingAnalytics.voice_analysis
    }
    
    updateData.analytics = newAnalytics
    
    logger.info('Updating session with deep analysis', {
      sessionId,
      updateKeys: Object.keys(updateData),
      analyticsKeys: Object.keys(newAnalytics),
      hasVoiceAnalysis: !!newAnalytics.voice_analysis
    })
    
    const { data: updatedSession, error: updateError } = await supabase
      .from('live_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select('id, grading_status, overall_score, analytics')
      .single()
    
    if (updateError) {
      logger.error('Error updating session with deep analysis', {
        error: updateError,
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
        updateDataKeys: Object.keys(updateData)
      })
      return NextResponse.json({ 
        error: 'Failed to save deep analysis',
        details: updateError.message || updateError.code || 'Unknown database error',
        code: updateError.code,
        hint: 'Check database logs for more details',
        updateDataKeys: Object.keys(updateData),
        errorObject: JSON.stringify(updateError).substring(0, 500)
      }, { status: 500 })
    }
    
    // Verify the update succeeded
    if (!updatedSession) {
      logger.error('Update returned no data', { sessionId })
      return NextResponse.json({ error: 'Update succeeded but no data returned' }, { status: 500 })
    }
    
    logger.info('Deep analysis completed and verified', {
      sessionId,
      timeElapsed: `${Date.now() - startTime}ms`,
      finalScore: finalScores.overall,
      updatedStatus: updatedSession.grading_status,
      updatedScore: updatedSession.overall_score,
      hasDeepAnalysis: !!updatedSession.analytics?.deep_analysis,
      hasCoachingPlan: !!updatedSession.analytics?.coaching_plan
    })
    
    const timeElapsed = Date.now() - startTime
    
    return NextResponse.json({ 
      status: 'complete',
      deepAnalysis,
      coachingPlan,
      finalScores,
      comparativePerformance,
      improvementTrends,
      saleClosed,
      returnAppointment,
      virtualEarnings,
      earningsData,
      dealDetails,
      timeElapsed 
    })
  } catch (error: any) {
    logger.error('Error performing deep analysis', error)
    return NextResponse.json(
      { error: error.message || 'Failed to perform deep analysis' },
      { status: 500 }
    )
  }
}

