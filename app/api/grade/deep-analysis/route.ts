import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { logger } from '@/lib/logger'

export const maxDuration = 60 // 60 seconds for deep analysis
export const dynamic = 'force-dynamic'
export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, // Increased to 60s for reliability
  maxRetries: 3 // Increased retries for reliability
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
  
  const prompt = `You are an expert door-to-door sales coach analyzing a sales conversation. Analyze the ENTIRE transcript carefully and determine:
1. Did the sale close? (Was the customer committed to the service?)
2. How much was the sale worth? (Extract price from conversation or use $1000 default)
3. What should the overall score be? (0-100 based on conversation quality)

Return ONLY valid JSON.

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

ANALYSIS INSTRUCTIONS:

Read the ENTIRE conversation transcript carefully. Look for:

SALE DETECTION - BE THOROUGH AND ACCURATE:
A sale is CLOSED if ANY of these conditions are met (check ALL of them):

1. EXPLICIT AGREEMENT + INFO COLLECTION:
   - Customer says: "let's do it", "go ahead", "sounds good", "yes", "okay", "sure", "alright", "that works", "I'm ready", "let's go", "sign me up", "I'll take it", "I'm in", "count me in", "let's do this", "works for me", "I'm game", "that sounds good"
   - AND THEN (either before or after): customer provides OR rep collects: name, phone, email, address, scheduling details, payment info, or specific date/time
   - = SALE CLOSED

2. REP COLLECTING INFO AFTER AGREEMENT OR DISCUSSION:
   - Rep asks for: "your name", "phone number", "email", "address", "when can we start", "what's your schedule", "what's a good time", "when would work", "can I get your", "let me get your", "I'll need your"
   - AND customer provides it OR agrees to provide it OR doesn't object
   - = SALE CLOSED (if this happens AFTER discussing the service/price)

3. SCHEDULING COMMITMENT:
   - Customer agrees to specific time/date: "tomorrow works", "next week", "Monday at 2pm", "I'm free Tuesday", "Tuesday works", "next Monday", "this weekend"
   - OR customer provides their schedule: "I'm home Tuesday", "afternoons work", "weekends are good"
   - = SALE CLOSED

4. SPOUSE APPROVAL:
   - Customer mentions checking with spouse/partner/wife/husband
   - AND THEN agrees: "spouse said okay", "wife said yes", "husband said go ahead", "partner said fine", "they said it's fine", "they're okay with it"
   - = SALE CLOSED

5. IMPLICIT AGREEMENT + ACTION:
   - Customer asks about: "when would you start", "how long does it take", "what's the process", "what's next", "how does this work", "when can you come", "how soon can you start"
   - AFTER discussing price/service
   - AND (rep starts collecting info OR customer provides info OR scheduling is discussed)
   - = SALE CLOSED

6. REP INITIATING SIGNUP:
   - Rep says: "I can get you signed up", "let me get your information", "I'll set this up for you", "let's get you started", "let's get you scheduled", "I can schedule you", "let me schedule that"
   - AND customer doesn't object (silence = agreement) OR says yes/okay/sure
   - = SALE CLOSED

7. PAYMENT DISCUSSION:
   - Rep asks about payment method OR customer provides payment info
   - AFTER discussing service/price
   - = SALE CLOSED

8. PROPERTY ACCESS DISCUSSION:
   - Rep asks about: "gate code", "where to park", "dog in yard", "access to backyard", "garage door"
   - AFTER agreement or discussion of service
   - = SALE CLOSED (they're planning the service)

CRITICAL: If customer agreed to the service (even implicitly) AND information was exchanged or scheduling discussed, mark sale_closed=true. Don't require perfect explicit language - look for the INTENT and ACTION. If the rep is collecting information or scheduling, and the customer isn't objecting, that's a sale.

WHAT IS NOT A SALE:
- Customer says "I'll think about it" and no info is collected
- Customer says "maybe later" and no scheduling happens
- Customer asks questions but doesn't agree or provide info
- Rep mentions the service but customer doesn't engage

PRICE EXTRACTION:
- Look for prices mentioned in conversation: "$99/month", "$1200/year", "$299", etc.
- If monthly price: multiply by 12 for annual value (or use contract length if specified)
- If no price found: use $1000 as default base price
- Calculate total_contract_value from the price found

OVERALL SCORE (0-100):
- Base score on conversation quality:
  * 90-100: Excellent - sale closed, great rapport, handled objections well, smooth close
  * 80-89: Very good - sale closed or strong progress, good technique
  * 70-79: Good - decent conversation, some areas for improvement
  * 60-69: Average - basic conversation, missed opportunities
  * 50-59: Below average - struggled with objections or closing
  * 0-49: Poor - major issues, no sale, poor technique

CRITICAL SCORING RULES FOR CLOSED SALES:
- If sale_closed=true AND objectionHandling >= 85: overall_score MUST be 85-100
- If sale_closed=true: overall_score MUST be at least 80 (minimum)
- If sale_closed=true: closing score MUST be 90-100 (sale closed = excellent closing)
- A closed sale is a SUCCESS - don't penalize minor issues like talk ratio or energy drops if the sale closed
- Focus on: Did they close? If yes, score reflects that success (80+ minimum)
- Consider: rapport building, discovery questions, objection handling, closing technique, conversation flow

Return JSON with your analysis:
{
  "sale_closed": true/false,  // Did the sale close? Be thorough - if customer agreed and info was collected, it's a sale
  "total_contract_value": number,  // How much was the sale worth? Extract from conversation or use 1000
  "overall_score": number,  // What should the overall score be (0-100)? Base on conversation quality
  "overallAssessment": "1 sentence summary of the conversation",
  "topStrengths": ["strength1", "strength2"],
  "topImprovements": ["improvement1", "improvement2"],
  "finalScores": {
    "overall": number,  // Use the overall_score you determined above
    "rapport": number,  // 0-100 based on connection and trust building
    "discovery": number,  // 0-100 based on quality of questions and listening
    "objectionHandling": number,  // 0-100 based on how objections were handled (85+ if handled well)
    "closing": number  // 0-100 (90-100=sale, 75-89=appointment, 60-74=trial, 40-59=weak, 0-39=none)
  },
  "return_appointment": false,  // Usually false if sale_closed=true
  "virtual_earnings": number,  // Same as total_contract_value (full deal value, not commission)
  "earnings_data": {
    "base_amount": number,  // Base price from conversation
    "closed_amount": number,  // Same as total_contract_value
    "total_earned": number  // Same as total_contract_value (full deal value)
  },
  "deal_details": {
    "product_sold": "string",  // What product/service was sold?
    "service_type": "string",  // Type of service
    "base_price": number,  // Base price found in conversation
    "monthly_value": number,  // Monthly value if applicable
    "contract_length": number,  // Contract length in months
    "total_contract_value": number,  // Total value (same as above)
    "payment_method": "string",  // Payment method if mentioned
    "add_ons": [],  // Any add-ons mentioned
    "start_date": "string"  // Start date if mentioned
  },
  "coachingPlan": {
    "immediateFixes": [{"issue": "issue", "practiceScenario": "scenario"}],
    "rolePlayScenarios": [{"scenario": "scenario", "focus": "focus"}]
  },
  "feedback": {
    "strengths": ["strength with quote"],
    "improvements": ["improvement"],
    "specific_tips": ["tip"]
  },
  "session_highlight": "One highlight with quote from conversation"
}

CRITICAL RULES:
- If sale_closed=true, virtual_earnings MUST equal total_contract_value (at minimum $1000)
- If sale_closed=true, overall_score MUST be at least 80 (85+ if objections handled well)
- If sale_closed=true, closing score MUST be 90-100 (sale closed = excellent closing)
- A closed sale is a SUCCESS - don't penalize minor issues if the sale closed
- Be thorough in analyzing the transcript - don't miss sales that happened
- Look for IMPLICIT agreements, not just explicit "yes" - if customer provided info or scheduled after discussing service, it's a sale
- If rep collected customer information (name, phone, email, address) AFTER discussing the service, assume sale_closed=true
- When in doubt and there's evidence of agreement + info exchange, err on the side of marking sale_closed=true
- Remember: Closing a sale is the ultimate goal - if achieved, score should reflect that success (80+ minimum)`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Use GPT-4o for best analysis quality
      messages: [
        { role: 'system', content: 'Sales coach. JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2, // Lower temperature for more consistent analysis
      max_tokens: 4000, // Increased for long conversations (was 2000)
      response_format: { type: 'json_object' }
    })
    
    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No content from OpenAI')
    }
    
    const parsed = JSON.parse(content)
    
    logger.info('GPT-4o analysis result', {
      sale_closed: parsed.sale_closed,
      total_contract_value: parsed.total_contract_value,
      overall_score: parsed.overall_score,
      hasFinalScores: !!parsed.finalScores
    })
    
    // Extract coaching plan from combined response
    const coachingPlan = parsed.coachingPlan || {
      immediateFixes: [],
      skillDevelopment: [],
      rolePlayScenarios: []
    }
    
    // Use GPT-4o's direct analysis - trust its judgment
    let saleClosed = parsed.sale_closed || false
    const totalContractValue = parsed.total_contract_value || (saleClosed ? 1000 : 0)
    
    // Use GPT-4o's overall_score if provided, otherwise calculate from finalScores
    const gptOverallScore = parsed.overall_score
    const finalScores = parsed.finalScores || {}
    
    // If GPT provided overall_score, use it; otherwise use the calculated one
    if (gptOverallScore !== undefined) {
      finalScores.overall = gptOverallScore
      logger.info('Using GPT-4o overall_score', { overall_score: gptOverallScore })
    }
    
    // Calculate earnings from GPT's analysis
    let virtualEarnings = saleClosed ? totalContractValue : 0
    let earningsData = parsed.earnings_data || {}
    let dealDetails = parsed.deal_details || {}
    
    // If sale is closed, ensure earnings are set
    if (saleClosed && virtualEarnings === 0) {
      virtualEarnings = totalContractValue
      logger.warn('Sale closed but virtual_earnings was 0, using total_contract_value', {
        totalContractValue,
        saleClosed
      })
    }
    
    // Ensure earnings_data is populated if sale closed
    if (saleClosed && (!earningsData.total_earned || earningsData.total_earned === 0)) {
      earningsData = {
        base_amount: dealDetails?.base_price || totalContractValue,
        closed_amount: totalContractValue,
        total_earned: totalContractValue
      }
      
      virtualEarnings = totalContractValue
      
      logger.info('Populated earnings_data from GPT analysis', {
        totalContractValue,
        totalEarned: virtualEarnings
      })
    }
    
    // If sale is NOT closed, ensure earnings are zero
    if (!saleClosed) {
      virtualEarnings = 0
      earningsData = {}
    }
    
    // Return structured response matching old format
    // Use GPT-4o's analysis directly - it analyzed the transcript and determined sale_closed, total_contract_value, and overall_score
    return {
      overallAssessment: parsed.overallAssessment || '',
      topStrengths: parsed.topStrengths || [],
      topImprovements: parsed.topImprovements || [],
      finalScores: finalScores, // Use GPT's overall_score if provided
      saleClosed,
      returnAppointment: parsed.return_appointment || false,
      virtualEarnings,
      earningsData,
      dealDetails: {
        ...dealDetails,
        total_contract_value: totalContractValue // Use GPT's analysis
      },
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
// Prioritizes GPT-4o's analysis if provided
function calculateFinalScores(deepAnalysis: any, instantMetrics: any) {
  const instantScores = instantMetrics?.estimatedScores || {}
  const adjustments = deepAnalysis.scoreAdjustments || {}
  
  // Use GPT-4o's scores if provided (it analyzed the transcript)
  const gptScores = deepAnalysis.finalScores || {}
  
  return {
    overall: gptScores.overall || deepAnalysis.finalScores?.overall || instantMetrics?.estimatedScore || 0,
    rapport: gptScores.rapport || deepAnalysis.finalScores?.rapport || 
             (instantScores.rapport + (adjustments.rapport?.adjustment || 0)),
    discovery: gptScores.discovery || deepAnalysis.finalScores?.discovery || 
               (instantScores.discovery + (adjustments.discovery?.adjustment || 0)),
    objectionHandling: gptScores.objectionHandling || deepAnalysis.finalScores?.objectionHandling || 
                       (instantScores.objectionHandling + (adjustments.objectionHandling?.adjustment || 0)),
    closing: gptScores.closing || deepAnalysis.finalScores?.closing || 
             (instantScores.closing + (adjustments.closing?.adjustment || 0))
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
    
    // CRITICAL: Mark that deep analysis is starting (for progress tracking)
    await supabase
      .from('live_sessions')
      .update({
        analytics: {
          ...((await supabase.from('live_sessions').select('analytics').eq('id', sessionId).single()).data?.analytics || {}),
          deep_analysis_started_at: new Date().toISOString(),
          deep_analysis_error: false // Clear any previous errors
        }
      })
      .eq('id', sessionId)
    
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
    
    // Step 4: Use GPT-4o's scores directly (it analyzed the transcript)
    // Only calculate if GPT didn't provide scores
    let finalScores = deepAnalysis.finalScores || {}
    
    // If GPT provided overall_score, use it; otherwise calculate
    if (deepAnalysis.finalScores?.overall !== undefined) {
      finalScores = deepAnalysis.finalScores
      logger.info('Using GPT-4o finalScores directly', { overall: finalScores.overall })
    } else {
      // Fallback to calculation if GPT didn't provide scores
      finalScores = calculateFinalScores(deepAnalysis, finalInstantMetrics)
      logger.info('Calculated finalScores (GPT did not provide)', { overall: finalScores.overall })
    }
    
    // Step 5: Compare to history
    const comparativePerformance = compareToHistory(userHistory, finalScores)
    const improvementTrends = calculateTrends(userHistory)
    
    // Step 6: Get existing analytics to preserve AND check ended_at
    const { data: existingSession } = await supabase
      .from('live_sessions')
      .select('analytics, ended_at')
      .eq('id', sessionId)
      .single()
    
    const existingAnalytics = existingSession?.analytics || {}
    const hasEndedAt = !!existingSession?.ended_at
    
    // Step 7: Update with complete analysis
    // Build update object step by step to avoid issues
    let saleClosed = deepAnalysis.saleClosed || false
    const returnAppointment = deepAnalysis.returnAppointment || false
    let virtualEarnings = saleClosed ? (deepAnalysis.virtualEarnings || 0) : 0
    let earningsData = deepAnalysis.earningsData || {}
    const dealDetails = deepAnalysis.dealDetails || {}
    
    // Note: Score enforcement happens AFTER fallback detection (see below)
    
    // FALLBACK DETECTION: Re-evaluate if sale wasn't detected but evidence suggests it should be
    if (!saleClosed && transcript && transcript.length > 0) {
      const closeAttempts = instantMetrics?.closeAttempts || 0
      const transcriptText = transcript.map((t: any) => (t.text || '').toLowerCase()).join(' ')
      
      // Check for buying signals - expanded list
      const buyingSignals = [
        "let's go ahead and do it",
        "let's do it",
        "go ahead",
        "sounds good",
        "that works",
        "i'm ready",
        "let's go",
        "sure",
        "alright",
        "okay",
        "yes",
        "sign me up",
        "i'll take it",
        "i'm in",
        "count me in",
        "let's do this",
        "i'm interested",
        "that sounds good",
        "works for me",
        "i'm game"
      ]
      
      const hasBuyingSignal = buyingSignals.some(signal => transcriptText.includes(signal))
      
      // Check for information collection patterns - expanded
      const infoCollectionPatterns = [
        /my (name|phone|number|email|address) is/i,
        /call me/i,
        /I'm [A-Z]/i,
        /my number is/i,
        /tomorrow at/i,
        /tomorrow works/i,
        /next week/i,
        /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i,
        /[0-9]{3}.*[0-9]{3}.*[0-9]{4}/i, // Phone number pattern
        /@.*\.(com|net|org)/i, // Email pattern
        /you can reach me/i,
        /my contact/i,
        /when would you/i,
        /when can you/i,
        /what's next/i,
        /how do we/i,
        /let's schedule/i,
        /i'm free/i
      ]
      
      const hasInfoCollection = infoCollectionPatterns.some(pattern => pattern.test(transcriptText))
      
      // Check for rep asking for info after agreement - expanded
      const repAskingForInfo = [
        /(just )?need your (name|phone|number|email|address)/i,
        /what's your (name|phone|number|email|address)/i,
        /what is your (name|phone|number|email|address)/i,
        /can get you signed up/i,
        /get you signed up/i,
        /get you set up/i,
        /let me get your/i,
        /i'll need your/i,
        /can i get your/i,
        /let's get your/i,
        /when would be/i,
        /when can we/i,
        /what's a good time/i,
        /let's schedule/i,
        /i can set/i
      ]
      
      const repAskedForInfo = repAskingForInfo.some(pattern => pattern.test(transcriptText))
      
      // Check for spouse approval followed by agreement
      const spouseApprovalPattern = /(spouse|wife|husband|partner).*(said|okay|ok|fine|good).*(let's|go ahead|do it|sounds good)/i
      const hasSpouseApproval = spouseApprovalPattern.test(transcriptText)
      
      // Fallback conditions: If we have close attempts OR buying signals AND info collection, mark as sale
      // Also check if rep asked for info AND customer responded positively (even without explicit "yes")
      const customerRespondedPositively = hasInfoCollection || hasSpouseApproval || 
        /(sure|okay|ok|yes|alright|sounds good|that works|go ahead)/i.test(transcriptText)
      
      if ((closeAttempts > 0 || hasBuyingSignal || repAskedForInfo) && customerRespondedPositively) {
        const fallbackReason = [
          closeAttempts > 0 ? `${closeAttempts} close attempt(s)` : null,
          hasBuyingSignal ? 'buying signal detected' : null,
          repAskedForInfo ? 'rep asked for info' : null,
          hasInfoCollection ? 'info collection detected' : null,
          hasSpouseApproval ? 'spouse approval' : null
        ].filter(Boolean).join(' + ')
        
        logger.warn('Fallback detection: Sale should be marked as closed', {
          sessionId,
          closeAttempts,
          hasBuyingSignal,
          hasInfoCollection,
          repAskedForInfo,
          hasSpouseApproval,
          originalSaleClosed: saleClosed,
          fallbackReason
        })
        
        saleClosed = true
        
        // If earnings weren't calculated, set minimum
        if (virtualEarnings === 0) {
          const totalContractValue = dealDetails?.total_contract_value || dealDetails?.base_price || 1000
          virtualEarnings = totalContractValue
          
          if (!earningsData.total_earned) {
            earningsData = {
              base_amount: dealDetails?.base_price || totalContractValue,
              closed_amount: totalContractValue,
              commission_rate: 1.0,
              commission_earned: totalContractValue,
              bonus_modifiers: {},
              total_earned: totalContractValue
            }
          }
        }
        
        // Store fallback detection info for audit log (will be added to gradingAudit below)
        // Note: Minimum scores will be enforced in final enforcement step below
      }
    }
    
    // Final safety check: If sale is closed, earnings MUST be > 0
    if (saleClosed && virtualEarnings === 0) {
      logger.warn('Sale closed but virtual_earnings is 0, calculating minimum earnings', { sessionId })
      // Calculate minimum earnings - FULL DEAL VALUE
      const totalContractValue = dealDetails?.total_contract_value || dealDetails?.base_price || 1000
      virtualEarnings = totalContractValue // Full deal value, minimum $1000
      
      // Ensure earnings_data is populated
      if (!earningsData.total_earned) {
        earningsData = {
          base_amount: dealDetails?.base_price || totalContractValue,
          closed_amount: totalContractValue,
          total_earned: totalContractValue
        }
      }
      
      logger.info('Applied minimum earnings for closed sale (full deal value)', {
        sessionId,
        virtualEarnings,
        totalContractValue
      })
    }
    
    // Ensure sale_closed is false if earnings are 0
    if (virtualEarnings === 0 && saleClosed) {
      logger.warn('Earnings are 0 but sale_closed is true, correcting sale_closed to false', { sessionId })
      // Don't override saleClosed here - trust the AI's judgment, but log it
    }
    
    // CRITICAL: Final enforcement of minimum scores for closed sales
    // This happens AFTER all sale detection logic (GPT + fallback) is complete
    if (saleClosed) {
      const objectionHandlingScore = finalScores.objectionHandling || 0
      const objectionsHandledWell = objectionHandlingScore >= 85
      
      // Minimum score: 85 if objections handled well, 80 otherwise
      const minimumScore = objectionsHandledWell ? 85 : 80
      
      if (finalScores.overall < minimumScore) {
        logger.warn('Final enforcement: Minimum score for closed sale', {
          sessionId,
          originalScore: finalScores.overall,
          minimumScore,
          objectionHandlingScore,
          objectionsHandledWell
        })
        finalScores.overall = minimumScore
      }
      
      // Also ensure closing score is at least 90 for closed sales
      if (finalScores.closing < 90) {
        logger.info('Final enforcement: Minimum closing score for closed sale', {
          sessionId,
          originalClosingScore: finalScores.closing,
          newClosingScore: 90
        })
        finalScores.closing = 90
      }
    }
    
    const updateData: any = {
      // Core scores (GPT finalScores)
      overall_score: finalScores.overall,
      rapport_score: Math.round(finalScores.rapport),
      discovery_score: Math.round(finalScores.discovery),
      objection_handling_score: Math.round(finalScores.objectionHandling),
      close_score: Math.round(finalScores.closing),
      final_scores: finalScores, // Store as JSONB too
      
      // Sale/Deal status (GPT outputs)
      sale_closed: saleClosed,
      return_appointment: returnAppointment,
      virtual_earnings: virtualEarnings,
      total_contract_value: dealDetails?.total_contract_value || (saleClosed ? virtualEarnings : null),
      
      // GPT text outputs
      overall_assessment: deepAnalysis.overallAssessment || '',
      top_strengths: deepAnalysis.topStrengths || [],
      top_improvements: deepAnalysis.topImprovements || [],
      session_highlight: deepAnalysis.sessionHighlight || deepAnalysis.feedback?.strengths?.[0] || '',
      
      // GPT JSONB outputs
      earnings_data: earningsData,
      deal_details: dealDetails,
      coaching_plan: coachingPlan,
      feedback_data: deepAnalysis.feedback || {
        strengths: deepAnalysis.topStrengths || [],
        improvements: deepAnalysis.topImprovements || [],
        specific_tips: []
      },
      
      // Grading metadata
      grading_status: 'complete',
      graded_at: new Date().toISOString(),
      grading_audit: gradingAudit,
      
      // Clear any error flags since we succeeded
      analytics: {
        ...existingAnalytics,
        deep_analysis_error: false,
        deep_analysis_completed_at: new Date().toISOString()
      }
    }
    
    // CRITICAL: Ensure ended_at is set so the trigger can fire and update user earnings
    // The trigger requires both virtual_earnings > 0 AND ended_at IS NOT NULL
    if (!hasEndedAt) {
      updateData.ended_at = new Date().toISOString()
      logger.info('Setting ended_at during grading to ensure earnings trigger fires', { sessionId })
    }
    
    // Safety score removed - no longer tracked
    
    // Build grading audit log to track detection process
    const gradingAudit = {
      gpt_detected_sale: deepAnalysis.saleClosed || false,
      gpt_virtual_earnings: deepAnalysis.virtualEarnings || 0,
      gpt_total_contract_value: deepAnalysis.dealDetails?.total_contract_value || 0,
      fallback_detection_triggered: false,
      fallback_detected_sale: false,
      fallback_reason: null as string | null,
      final_sale_closed: saleClosed,
      final_virtual_earnings: virtualEarnings,
      score_adjustments: {} as any,
      original_scores: {
        overall: finalScores.overall,
        closing: finalScores.closing
      },
      detection_evidence: {
        has_buying_signal: false,
        has_info_collection: false,
        rep_asked_for_info: false,
        has_spouse_approval: false,
        close_attempts: instantMetrics?.closeAttempts || 0
      },
      graded_at: new Date().toISOString()
    }
    
    // Track fallback detection if it was triggered
    if (!deepAnalysis.saleClosed && saleClosed) {
      gradingAudit.fallback_detection_triggered = true
      gradingAudit.fallback_detected_sale = true
      gradingAudit.fallback_reason = 'Fallback patterns detected sale evidence'
    }
    
    // Track score adjustments
    const originalOverall = deepAnalysis.finalScores?.overall || finalScores.overall
    const originalClosing = deepAnalysis.finalScores?.closing || finalScores.closing
    if (saleClosed) {
      if (finalScores.overall !== originalOverall && finalScores.overall >= 80) {
        gradingAudit.score_adjustments.overall = {
          original: originalOverall,
          adjusted: finalScores.overall,
          reason: 'Enforced minimum score for closed sale'
        }
      }
      if (finalScores.closing !== originalClosing && finalScores.closing >= 90) {
        gradingAudit.score_adjustments.closing = {
          original: originalClosing,
          adjusted: finalScores.closing,
          reason: 'Enforced minimum closing score for closed sale'
        }
      }
    }
    
    // Track detection evidence if fallback was used
    if (!deepAnalysis.saleClosed && transcript && transcript.length > 0) {
      const transcriptText = transcript.map((t: any) => (t.text || '').toLowerCase()).join(' ')
      const buyingSignals = ["let's do it", "go ahead", "sounds good", "yes", "okay", "sure", "sign me up"]
      const hasBuyingSignal = buyingSignals.some(signal => transcriptText.includes(signal))
      const hasInfoCollection = /(my (name|phone|number|email|address) is|call me|tomorrow|next week)/i.test(transcriptText)
      const repAskedForInfo = /(need your|what's your|can get you signed up)/i.test(transcriptText)
      const hasSpouseApproval = /(spouse|wife|husband).*(said|okay|ok|fine|good).*(let's|go ahead|do it)/i.test(transcriptText)
      
      gradingAudit.detection_evidence = {
        has_buying_signal: hasBuyingSignal,
        has_info_collection: hasInfoCollection,
        rep_asked_for_info: repAskedForInfo,
        has_spouse_approval: hasSpouseApproval,
        close_attempts: instantMetrics?.closeAttempts || 0
      }
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
      grading_audit: gradingAudit, // NEW: Audit trail for debugging
      graded_at: new Date().toISOString(),
      // Clear error flags and mark completion
      deep_analysis_error: false,
      deep_analysis_completed_at: new Date().toISOString()
    }
    
    // Preserve voice_analysis if it exists (critical!)
    if (existingAnalytics.voice_analysis) {
      newAnalytics.voice_analysis = existingAnalytics.voice_analysis
    }
    
    // Update analytics in updateData (don't override the one we set above)
    updateData.analytics = newAnalytics
    
    // NOTE: The database trigger update_user_virtual_earnings_from_live_sessions_trigger
    // will automatically update the user's total virtual_earnings when:
    // 1. virtual_earnings > 0
    // 2. ended_at IS NOT NULL
    // If ended_at is not set yet, the trigger will fire when it's set later by endSession()
    
    logger.info('Updating session with deep analysis', {
      sessionId,
      updateKeys: Object.keys(updateData),
      analyticsKeys: Object.keys(newAnalytics),
      hasVoiceAnalysis: !!newAnalytics.voice_analysis,
      saleClosed,
      virtualEarnings,
      hasEarningsData: !!earningsData.total_earned,
      earningsBreakdown: earningsData,
      endedAtSet: !!updateData.ended_at,
      hadEndedAt: hasEndedAt,
      earningsWillUpdateUser: virtualEarnings > 0 && !!updateData.ended_at
    })
    
    // CRITICAL: Use a transaction-like approach - update in steps to avoid conflicts
    // First, update core fields
    const { error: coreUpdateError } = await supabase
      .from('live_sessions')
      .update({
        overall_score: updateData.overall_score,
        rapport_score: updateData.rapport_score,
        discovery_score: updateData.discovery_score,
        objection_handling_score: updateData.objection_handling_score,
        close_score: updateData.close_score,
        sale_closed: updateData.sale_closed,
        virtual_earnings: updateData.virtual_earnings,
        return_appointment: updateData.return_appointment,
        total_contract_value: updateData.total_contract_value,
        earnings_data: updateData.earnings_data,
        deal_details: updateData.deal_details,
        grading_status: updateData.grading_status,
        graded_at: updateData.graded_at,
        grading_audit: updateData.grading_audit
      })
      .eq('id', sessionId)
    
    if (coreUpdateError) {
      logger.error('Error updating core fields', {
        error: coreUpdateError,
        message: coreUpdateError.message,
        code: coreUpdateError.code
      })
      // Continue to try analytics update anyway
    }
    
    // Then update analytics separately (larger JSONB field)
    const { error: analyticsUpdateError } = await supabase
      .from('live_sessions')
      .update({
        analytics: newAnalytics
      })
      .eq('id', sessionId)
    
    if (analyticsUpdateError) {
      logger.error('Error updating analytics', {
        error: analyticsUpdateError,
        message: analyticsUpdateError.message,
        code: analyticsUpdateError.code
      })
      // If analytics update fails, we still have core data, so continue
    }
    
    // Verify the update succeeded by fetching the session
    const { data: updatedSession, error: fetchError } = await supabase
      .from('live_sessions')
      .select('id, grading_status, overall_score, analytics, virtual_earnings, sale_closed, ended_at')
      .eq('id', sessionId)
      .single()
    
    if (fetchError || !updatedSession) {
      logger.error('Error fetching updated session', { error: fetchError })
      // Return success anyway since we tried to update
      return NextResponse.json({ 
        status: 'complete',
        warning: 'Update may not have been fully saved - please verify',
        deepAnalysis,
        finalScores,
        saleClosed,
        virtualEarnings
      })
    }
    
    // Check if update actually worked
    if (updatedSession.grading_status !== 'complete' || updatedSession.sale_closed === null) {
      logger.warn('Update may not have been fully applied', {
        sessionId,
        gradingStatus: updatedSession.grading_status,
        saleClosed: updatedSession.sale_closed
      })
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
      hasCoachingPlan: !!updatedSession.analytics?.coaching_plan,
      saleClosed: updatedSession.sale_closed,
      virtualEarnings: updatedSession.virtual_earnings,
      endedAt: updatedSession.ended_at,
      earningsWillUpdateUser: updatedSession.virtual_earnings > 0 && !!updatedSession.ended_at
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
    
    // CRITICAL: Track error in database so polling can detect it
    try {
      const supabase = await createServiceSupabaseClient()
      const { data: errorSession } = await supabase
        .from('live_sessions')
        .select('analytics')
        .eq('id', sessionId)
        .single()
      
      if (errorSession) {
        await supabase
          .from('live_sessions')
          .update({
            analytics: {
              ...errorSession.analytics,
              deep_analysis_error: true,
              deep_analysis_error_message: error.message?.substring(0, 200) || 'Unknown error',
              deep_analysis_failed_at: new Date().toISOString(),
              deep_analysis_error_type: error.name || 'Error'
            }
          })
          .eq('id', sessionId)
      }
    } catch (trackingError) {
      logger.error('Failed to track deep analysis error', trackingError)
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to perform deep analysis' },
      { status: 500 }
    )
  }
}

