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

// Perform deep GPT-4o analysis with full context
async function performDeepAnalysis(data: {
  keyMoments: any[]
  instantMetrics: any
  elevenLabsData: any
  userHistory: any
  transcript: any[]
  durationSeconds: number
}) {
  const { keyMoments, instantMetrics, elevenLabsData, userHistory, transcript, durationSeconds } = data
  
  const prompt = `You are an expert door-to-door sales coach analyzing a training session.

Context:
- User's average performance: ${userHistory?.averageScore || 'N/A'} (from ${userHistory?.sessionCount || 0} previous sessions)
- This session's instant score: ${instantMetrics?.estimatedScore || 'N/A'}
- Key moments identified: ${keyMoments.length}
- Session duration: ${Math.round(durationSeconds / 60)} minutes
${elevenLabsData ? `- ElevenLabs sentiment trend: ${JSON.stringify(elevenLabsData.sentimentProgression || [])}` : ''}

Key Moments Analysis:
${keyMoments.map((m, i) => `
${i + 1}. ${m.type.toUpperCase()} (${m.outcome}):
   "${m.transcript.slice(0, 200)}"
   Analysis: ${m.analysis?.whatHappened || 'Not analyzed'}
`).join('\n')}

Instant Metrics:
- Words per minute: ${instantMetrics?.wordsPerMinute || 'N/A'}
- Conversation balance: ${instantMetrics?.conversationBalance || 'N/A'}%
- Objections faced: ${instantMetrics?.objectionCount || 0}
- Close attempts: ${instantMetrics?.closeAttempts || 0}
- Safety mentions: ${instantMetrics?.safetyMentions || 0}

Provide a comprehensive analysis in JSON format:
{
  "overallAssessment": "Compare this session to their usual performance (one paragraph)",
  "topStrengths": ["strength 1", "strength 2", "strength 3"],
  "topImprovements": ["improvement 1", "improvement 2", "improvement 3"],
  "specificTechniques": ["technique 1 to practice", "technique 2 to practice"],
  "psychologicalInsights": {
    "confidence": "assessment of confidence level",
    "energy": "assessment of energy level",
    "rapport": "assessment of rapport building"
  },
  "scoreAdjustments": {
    "rapport": {"adjustment": number, "reason": "why adjusted"},
    "discovery": {"adjustment": number, "reason": "why adjusted"},
    "objectionHandling": {"adjustment": number, "reason": "why adjusted"},
    "closing": {"adjustment": number, "reason": "why adjusted"},
    "safety": {"adjustment": number, "reason": "why adjusted"}
  },
  "finalScores": {
    "overall": number (0-100),
    "rapport": number (0-100),
    "discovery": number (0-100),
    "objectionHandling": number (0-100),
    "closing": number (0-100),
    "safety": number (0-100)
  }
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an elite door-to-door sales coach with 20+ years of experience. Provide specific, actionable feedback.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    })
    
    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No content from OpenAI')
    }
    
    return JSON.parse(content)
  } catch (error: any) {
    logger.error('Error performing deep analysis', error)
    throw error
  }
}

// Generate personalized coaching plan
async function generateCoachingPlan(deepAnalysis: any, userHistory: any) {
  const prompt = `Based on this analysis, create a personalized coaching plan:

Strengths: ${deepAnalysis.topStrengths?.join(', ') || 'None identified'}
Improvements: ${deepAnalysis.topImprovements?.join(', ') || 'None identified'}
User's average score: ${userHistory?.averageScore || 'N/A'}

Create a coaching plan in JSON format:
{
  "immediateFixes": [
    {
      "issue": "specific issue",
      "example": "example from conversation",
      "practiceScenario": "role play scenario",
      "resource": "suggested resource or technique"
    }
  ],
  "skillDevelopment": [
    {
      "skill": "skill name",
      "currentLevel": "assessment",
      "targetLevel": "goal",
      "exercises": ["exercise 1", "exercise 2"]
    }
  ],
  "rolePlayScenarios": [
    {
      "scenario": "scenario description",
      "focus": "what to practice",
      "expectedOutcome": "what success looks like"
    }
  ]
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert sales trainer creating personalized coaching plans.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })
    
    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No content from OpenAI')
    }
    
    return JSON.parse(content)
  } catch (error: any) {
    logger.error('Error generating coaching plan', error)
    // Return basic coaching plan if AI fails
    return {
      immediateFixes: [],
      skillDevelopment: [],
      rolePlayScenarios: []
    }
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
    
    // Step 2: Deep GPT-4o analysis with full context
    const deepAnalysis = await performDeepAnalysis({
      keyMoments: finalKeyMoments,
      instantMetrics: finalInstantMetrics,
      elevenLabsData: finalElevenLabsData,
      userHistory,
      transcript,
      durationSeconds
    })
    
    // Step 3: Generate personalized coaching plan
    const coachingPlan = await generateCoachingPlan(deepAnalysis, userHistory)
    
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
    const { error: updateError } = await supabase
      .from('live_sessions')
      .update({
        overall_score: finalScores.overall,
        rapport_score: Math.round(finalScores.rapport),
        discovery_score: Math.round(finalScores.discovery),
        objection_handling_score: Math.round(finalScores.objectionHandling),
        close_score: Math.round(finalScores.closing),
        safety_score: Math.round(finalScores.safety),
        analytics: {
          ...existingAnalytics,
          deep_analysis: deepAnalysis,
          coaching_plan: coachingPlan,
          comparative_performance: comparativePerformance,
          improvement_trends: improvementTrends,
          final_scores: finalScores,
          grading_version: '2.0',
          graded_at: new Date().toISOString()
        },
        grading_status: 'complete',
        grading_version: '2.0'
      })
      .eq('id', sessionId)
    
    if (updateError) {
      logger.error('Error updating session with deep analysis', updateError)
      return NextResponse.json({ 
        error: 'Failed to save deep analysis',
        details: updateError.message || updateError.code || 'Unknown database error',
        hint: 'Check database logs for more details'
      }, { status: 500 })
    }
    
    const timeElapsed = Date.now() - startTime
    logger.info('Deep analysis completed', {
      sessionId,
      timeElapsed: `${timeElapsed}ms`,
      finalScore: finalScores.overall
    })
    
    return NextResponse.json({ 
      status: 'complete',
      deepAnalysis,
      coachingPlan,
      finalScores,
      comparativePerformance,
      improvementTrends,
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

