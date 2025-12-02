import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export const maxDuration = 10 // 10 seconds max for instant metrics
export const dynamic = 'force-dynamic'

interface InstantMetrics {
  // From existing voice analysis (already calculated)
  wordsPerMinute: number
  fillerWords: number
  pauseFrequency: number
  
  // New instant calculations
  conversationBalance: number // talk time ratio (rep %)
  objectionCount: number // pattern matched
  closeAttempts: number // keyword detected
  safetyMentions: number // pets/kids mentioned
  
  // From ElevenLabs webhook
  elevenLabsMetrics?: {
    sentimentProgression: number[]
    interruptionCount: number
    conversationId: string
    audioQuality: number
  }
  
  // Estimated scores (70-90% accurate)
  estimatedScore: number
  estimatedScores: {
    rapport: number
    discovery: number
    objectionHandling: number
    closing: number
    safety: number
  }
}

// Pattern matching for instant analysis (no AI needed)
function analyzeTranscriptPatterns(transcript: any[]) {
  const patterns = {
    objections: [
      /already have/i,
      /too expensive/i,
      /not interested/i,
      /need to think/i,
      /speak to (spouse|partner)/i,
      /can't afford/i,
      /maybe later/i,
      /not right now/i,
      /don't need/i
    ],
    closeAttempts: [
      // Original patterns
      /let's get you (started|scheduled)/i,
      /I can offer/i,
      /special pricing/i,
      /today only/i,
      /shall we proceed/i,
      /ready to (start|begin)/i,
      /can we schedule/i,
      /would you like to/i,
      /let's set up/i,
      /when can we/i,
      // Hard closes - collecting information
      /what is your name/i,
      /what's your name/i,
      /what is your phone/i,
      /what's your phone/i,
      /what is your email/i,
      /what's your email/i,
      /what is.*address/i,
      /what's.*address/i,
      /what is your house number/i,
      /anything else.*special notes/i,
      /are you using.*credit.*debit/i,
      /credit or debit/i,
      /payment method/i,
      /how would you like to pay/i,
      // Urgency closes
      /best time to (service|treat)/i,
      /bug activity.*going to get worse/i,
      /never have a bug issue/i,
      // Option closes
      /do you want.*front yard.*back yard/i,
      /front yard or back yard/i,
      /would you like.*park/i,
      /does morning.*evening work/i,
      /morning or evening/i,
      /which.*would you/i,
      // Responsibility closes
      /can you make sure.*dog/i,
      /put your dog away/i,
      /can you open the garage/i,
      /gate.*unlocked/i,
      // Sincerity/Pride closes
      /let me prove.*love/i,
      /give me.*honest try/i,
      /give me a shot/i,
      /give me a chance/i,
      /take.*pride in my work/i,
      // Bandwagon closes
      /if I can get you done.*neighbor/i,
      /your neighbor.*how does that sound/i,
      // Light bulb closes
      /you're going to be here.*today/i,
      /you'll be here.*right/i
    ],
    safetyKeywords: [
      /pets?/i,
      /dogs?/i,
      /cats?/i,
      /children/i,
      /kids?/i,
      /baby/i,
      /infant/i,
      /toddler/i
    ]
  }
  
  const analysis = {
    objectionCount: 0,
    closeAttempts: 0,
    safetyMentions: 0,
    keyMoments: [] as Array<{
      index: number
      type: 'objection' | 'close_attempt' | 'safety'
      text: string
      timestamp?: string
    }>
  }
  
  transcript.forEach((line, index) => {
    const text = (line.text || line.message || '').toLowerCase()
    const speaker = line.speaker || ''
    
    // Only analyze rep/user lines
    if (speaker !== 'rep' && speaker !== 'user') return
    
    // Check objection patterns
    for (const pattern of patterns.objections) {
      if (pattern.test(text)) {
        analysis.objectionCount++
        analysis.keyMoments.push({
          index,
          type: 'objection',
          text: (line.text || line.message || '').slice(0, 100),
          timestamp: line.timestamp
        })
        break // Only count once per line
      }
    }
    
    // Check close attempt patterns (only for rep/user)
    if (speaker === 'rep' || speaker === 'user') {
      for (const pattern of patterns.closeAttempts) {
        if (pattern.test(text)) {
          analysis.closeAttempts++
          analysis.keyMoments.push({
            index,
            type: 'close_attempt',
            text: (line.text || line.message || '').slice(0, 100),
            timestamp: line.timestamp
          })
          break
        }
      }
    }
    
    // Check safety keywords
    for (const pattern of patterns.safetyKeywords) {
      if (pattern.test(text)) {
        analysis.safetyMentions++
        analysis.keyMoments.push({
          index,
          type: 'safety',
          text: (line.text || line.message || '').slice(0, 100),
          timestamp: line.timestamp
        })
        break
      }
    }
  })
  
  return analysis
}

// Get voice metrics from analytics
function getVoiceMetrics(analytics: any) {
  const voiceAnalysis = analytics?.voice_analysis || {}
  
  return {
    wordsPerMinute: voiceAnalysis.avgWPM || 0,
    fillerWords: voiceAnalysis.totalFillerWords || 0,
    pauseFrequency: voiceAnalysis.longPausesCount || 0,
    avgPitch: voiceAnalysis.avgPitch || 0,
    avgVolume: voiceAnalysis.avgVolume || -60
  }
}

// Calculate conversation balance (rep talk time %) using character count
// This matches the live session's calculateTalkTimeRatio calculation
function calculateConversationBalance(transcript: any[], durationSeconds: number): number {
  if (!transcript || transcript.length === 0) return 50 // Default to 50% if no transcript
  
  let userCharCount = 0
  let homeownerCharCount = 0
  
  transcript.forEach((entry: any) => {
    const charCount = (entry.text || '').length
    // Explicitly check for 'user' or 'rep' speaker (sales rep)
    if (entry.speaker === 'user' || entry.speaker === 'rep') {
      userCharCount += charCount
    } 
    // Explicitly check for 'homeowner' or 'agent' speaker (AI agent)
    else if (entry.speaker === 'homeowner' || entry.speaker === 'agent') {
      homeownerCharCount += charCount
    }
    // Ignore any other speaker values to avoid counting errors
  })
  
  const totalChars = userCharCount + homeownerCharCount
  if (totalChars === 0) return 50
  
  // Calculate user's percentage: (user chars / total chars) * 100
  // This means: more user talk = higher %, more agent talk = lower %
  return Math.round((userCharCount / totalChars) * 100)
}

// Fetch ElevenLabs metrics if conversation ID exists
async function fetchElevenLabsMetrics(conversationId: string, supabase: any) {
  try {
    const { data, error } = await supabase
      .from('elevenlabs_conversations')
      .select('*')
      .eq('conversation_id', conversationId)
      .single()
    
    if (error || !data) {
      logger.warn('ElevenLabs conversation not found', { conversationId, error })
      return null
    }
    
    return {
      sentimentProgression: data.analysis?.sentiment_progression || [],
      interruptionCount: data.metadata?.interruptions_count || 0,
      conversationId: data.conversation_id,
      audioQuality: data.metadata?.audio_quality || 85, // Default if not available
      duration: data.duration_seconds,
      messageCount: data.message_count
    }
  } catch (error) {
    logger.error('Error fetching ElevenLabs metrics', error)
    return null
  }
}

// Calculate instant scores based on metrics and patterns
function calculateInstantScores(data: {
  voiceMetrics: any
  instantAnalysis: any
  elevenLabsData: any
  conversationBalance: number
  durationSeconds: number
}): InstantMetrics['estimatedScores'] & { estimatedScore: number } {
  const { voiceMetrics, instantAnalysis, elevenLabsData, conversationBalance, durationSeconds } = data
  
  // Base scores (start at 70, adjust based on metrics)
  let rapportScore = 70
  let discoveryScore = 70
  let objectionHandlingScore = 70
  let closingScore = 70
  let safetyScore = 70
  
  // Rapport scoring (conversation balance, speaking pace)
  if (conversationBalance >= 40 && conversationBalance <= 60) {
    rapportScore += 10 // Good balance
  } else if (conversationBalance < 30) {
    rapportScore -= 15 // Too much talking
  } else if (conversationBalance > 70) {
    rapportScore -= 10 // Not enough customer engagement
  }
  
  if (voiceMetrics.wordsPerMinute >= 140 && voiceMetrics.wordsPerMinute <= 160) {
    rapportScore += 5 // Good pace
  } else if (voiceMetrics.wordsPerMinute < 120) {
    rapportScore -= 5 // Too slow
  } else if (voiceMetrics.wordsPerMinute > 180) {
    rapportScore -= 10 // Too fast
  }
  
  // Discovery scoring (questions asked, conversation balance)
  const questionCount = instantAnalysis.keyMoments.filter((m: any) => 
    (m.text || '').includes('?')
  ).length
  
  if (questionCount >= 3) {
    discoveryScore += 10
  } else if (questionCount === 0) {
    discoveryScore -= 15
  }
  
  // Objection handling scoring
  if (instantAnalysis.objectionCount > 0) {
    // Having objections is normal, but need to see if they were handled
    // For instant metrics, assume neutral (will be refined in deep analysis)
    objectionHandlingScore = 70
  } else {
    objectionHandlingScore = 75 // No objections = easier conversation
  }
  
  // Closing scoring
  if (instantAnalysis.closeAttempts >= 2) {
    closingScore += 15 // Multiple close attempts
  } else if (instantAnalysis.closeAttempts === 1) {
    closingScore += 5 // One attempt
  } else {
    closingScore -= 20 // No close attempts
  }
  
  // Safety scoring
  if (instantAnalysis.safetyMentions > 0) {
    safetyScore += 20 // Safety mentioned
  } else {
    safetyScore -= 10 // Safety not mentioned
  }
  
  // Penalties for filler words
  const fillerPenalty = Math.min(voiceMetrics.fillerWords * 2, 15)
  rapportScore -= fillerPenalty
  discoveryScore -= fillerPenalty
  
  // Penalties for pauses
  if (voiceMetrics.pauseFrequency > 5) {
    rapportScore -= 5
  }
  
  // Clamp scores to 0-100
  rapportScore = Math.max(0, Math.min(100, rapportScore))
  discoveryScore = Math.max(0, Math.min(100, discoveryScore))
  objectionHandlingScore = Math.max(0, Math.min(100, objectionHandlingScore))
  closingScore = Math.max(0, Math.min(100, closingScore))
  safetyScore = Math.max(0, Math.min(100, safetyScore))
  
  // Calculate overall estimated score
  const estimatedScore = Math.round(
    (rapportScore + discoveryScore + objectionHandlingScore + closingScore + safetyScore) / 5
  )
  
  return {
    estimatedScore,
    rapport: rapportScore,
    discovery: discoveryScore,
    objectionHandling: objectionHandlingScore,
    closing: closingScore,
    safety: safetyScore
  }
}

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
      logger.error('Session not found', { sessionId, error: sessionError })
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    // Get transcript if not provided
    const sessionTranscript = transcript || session.full_transcript || []
    if (!Array.isArray(sessionTranscript) || sessionTranscript.length === 0) {
      logger.warn('No transcript available for instant metrics', { sessionId })
      return NextResponse.json({ error: 'No transcript available' }, { status: 400 })
    }
    
    // Step 1: Get pre-computed metrics from analytics
    const voiceMetrics = getVoiceMetrics(session.analytics)
    
    // Step 2: Quick pattern matching (no AI needed)
    const instantAnalysis = analyzeTranscriptPatterns(sessionTranscript)
    
    // Step 3: Calculate conversation balance
    const conversationBalance = calculateConversationBalance(
      sessionTranscript,
      session.duration_seconds || 0
    )
    
    // Step 4: Fetch ElevenLabs conversation data (parallel if conversation ID exists)
    const conversationId = elevenLabsConversationId || session.elevenlabs_conversation_id
    let elevenLabsData = null
    let speechGradingError = false
    
    if (conversationId) {
      elevenLabsData = await fetchElevenLabsMetrics(conversationId, supabase)
      // If we expected ElevenLabs data but got null, mark as error
      if (!elevenLabsData && conversationId) {
        speechGradingError = true
        logger.warn('ElevenLabs speech grading failed - no metrics returned', { sessionId, conversationId })
      }
    }
    
    // Step 5: Calculate instant scores
    const scores = calculateInstantScores({
      voiceMetrics,
      instantAnalysis,
      elevenLabsData,
      conversationBalance,
      durationSeconds: session.duration_seconds || 0
    })
    
    // Build instant metrics object
    const instantMetrics: InstantMetrics = {
      wordsPerMinute: voiceMetrics.wordsPerMinute,
      fillerWords: voiceMetrics.fillerWords,
      pauseFrequency: voiceMetrics.pauseFrequency,
      conversationBalance,
      objectionCount: instantAnalysis.objectionCount,
      closeAttempts: instantAnalysis.closeAttempts,
      safetyMentions: instantAnalysis.safetyMentions,
      elevenLabsMetrics: elevenLabsData ? {
        sentimentProgression: elevenLabsData.sentimentProgression,
        interruptionCount: elevenLabsData.interruptionCount,
        conversationId: elevenLabsData.conversationId,
        audioQuality: elevenLabsData.audioQuality
      } : undefined,
      estimatedScore: scores.estimatedScore,
      estimatedScores: {
        rapport: scores.rapport,
        discovery: scores.discovery,
        objectionHandling: scores.objectionHandling,
        closing: scores.closing,
        safety: scores.safety
      }
    }
    
    // Step 6: Save instantly
    const updateData: any = {
      instant_metrics: instantMetrics,
      grading_status: 'instant_complete',
      overall_score: scores.estimatedScore, // 70-90% accurate estimate
      grading_version: '2.0',
      ...(conversationId && !session.elevenlabs_conversation_id ? {
        elevenlabs_conversation_id: conversationId,
        elevenlabs_metrics: elevenLabsData
      } : {})
    }
    
    // Store speech grading error if it failed
    if (speechGradingError) {
      updateData.analytics = {
        ...session.analytics,
        speech_grading_error: true
      }
    }
    
    const { error: updateError } = await supabase
      .from('live_sessions')
      .update(updateData)
      .eq('id', sessionId)
    
    if (updateError) {
      logger.error('Error updating session with instant metrics', updateError)
      return NextResponse.json({ 
        error: 'Failed to save instant metrics',
        details: updateError.message || updateError.code || 'Unknown database error',
        hint: 'Make sure migration 085_add_new_grading_system.sql has been run'
      }, { status: 500 })
    }
    
    const timeElapsed = Date.now() - startTime
    logger.info('Instant metrics calculated', {
      sessionId,
      timeElapsed: `${timeElapsed}ms`,
      estimatedScore: scores.estimatedScore,
      objectionCount: instantAnalysis.objectionCount,
      closeAttempts: instantAnalysis.closeAttempts
    })
    
    return NextResponse.json({ 
      metrics: instantMetrics,
      scores,
      status: 'instant_complete',
      timeElapsed 
    })
  } catch (error: any) {
    logger.error('Error calculating instant metrics', error)
    return NextResponse.json(
      { error: error.message || 'Failed to calculate instant metrics' },
      { status: 500 }
    )
  }
}

