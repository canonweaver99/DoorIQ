'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { TranscriptEntry } from '@/lib/trainer/types'
import { detectObjection, assessObjectionHandling } from '@/lib/trainer/enhancedPatternAnalyzer'
import { createClient } from '@/lib/supabase/client'

interface UseSentimentScoreOptions {
  /** Session ID to fetch ElevenLabs metrics */
  sessionId?: string | null
  /** Whether the hook is enabled */
  enabled?: boolean
  /** Update interval in milliseconds (default: 2000ms) */
  updateInterval?: number
  /** Transcript entries for analyzing buying signals and objections */
  transcript?: TranscriptEntry[]
  /** Session start time for calculating progression */
  sessionStartTime?: number
  /** Starting sentiment score based on agent personality (default: 5) */
  startingSentiment?: number
  /** Callback when sentiment score updates */
  onScoreUpdate?: (score: number) => void
}

interface SentimentScoreFactors {
  transcriptSentiment: number // 0-100 from transcript analysis (replaces ElevenLabs)
  buyingSignals: number // 0-100 based on buying signals detected
  objectionResolution: number // 0-100 based on objections resolved
  positiveLanguage: number // 0-100 based on positive language patterns
}

interface UseSentimentScoreReturn {
  /** Current sentiment score (0-100) */
  sentimentScore: number
  /** Sentiment level category */
  sentimentLevel: 'low' | 'building' | 'positive'
  /** Individual factor scores */
  factors: SentimentScoreFactors
  /** Whether data is being fetched */
  isLoading: boolean
  /** Error message if any */
  error: string | null
  /** Whether analysis is active */
  isActive: boolean
}

// Strong buying signal patterns - HIGH impact (+15-20 points each)
const STRONG_BUYING_SIGNALS = [
  /let's do it/i,
  /count me in/i,
  /I'm ready/i,
  /when can you start/i,
  /how do I sign up/i,
  /we need that/i,
  /definitely need/i,
  /I can do that/i,
  /when can we start/i,
  /coming back (tomorrow|today|at|on)/i,
  /I'll see you/i,
  /see you (tomorrow|then|at)/i,
  /I'll be here/i,
  /I'll be ready/i,
  /let's schedule/i,
  /sign me up/i,
  /I want to move forward/i,
  /let's get started/i,
  /I'm sold/i,
  /you've convinced me/i,
  /where do I sign/i,
  /what do you need from me/i,
  /I'll take it/i,
  /we'll do it/i
]

// Moderate buying signals - MEDIUM impact (+8-12 points each)
const MODERATE_BUYING_SIGNALS = [
  /sounds good/i,
  /that works/i,
  /I'm interested/i,
  /that makes sense/i,
  /I like that/i,
  /that's reasonable/i,
  /I'm okay with that/i,
  /what's included/i,
  /how does it work/i,
  /what's the process/i,
  /how long does it take/i,
  /what do you recommend/i,
  /that's not bad/i,
  /I could see that/i,
  /that might work/i,
  /we've been thinking about/i,
  /we've been meaning to/i
]

// Engagement signals - Shows they're listening and interested (+5-8 points)
const ENGAGEMENT_SIGNALS = [
  /tell me more/i,
  /go on/i,
  /interesting/i,
  /really\?/i,
  /oh yeah\?/i,
  /is that right/i,
  /how so/i,
  /what do you mean/i,
  /can you explain/i,
  /I didn't know that/i,
  /that's new to me/i,
  /huh/i,
  /hmm/i,
  /okay/i,
  /I see/i,
  /right/i,
  /uh huh/i,
  /yeah/i,
  /sure/i
]

// Rapport building signals - Conversation is going well (+5-10 points)
const RAPPORT_SIGNALS = [
  /that's great/i,
  /that's good/i,
  /I understand/i,
  /you're right/i,
  /fair enough/i,
  /I hear you/i,
  /good point/i,
  /that's helpful/i,
  /good to know/i,
  /I appreciate/i,
  /thanks for/i,
  /that's nice/i,
  /you seem/i,
  /I trust/i,
  /you know what you're doing/i,
  /you're being honest/i,
  /I like your/i,
  /ha ha/i,
  /haha/i,
  /lol/i,
  /that's funny/i,
  /\*laughs\*/i,
  /\*chuckles\*/i
]

// Soft positive language - Mild positive indicators (+3-5 points)
const SOFT_POSITIVE_PATTERNS = [
  /that sounds/i,
  /maybe/i,
  /possibly/i,
  /we might/i,
  /I guess/i,
  /I suppose/i,
  /not terrible/i,
  /could be worse/i,
  /alright/i,
  /fine/i
]

// Strong negative language - HIGH negative impact (-15-20 points)
const STRONG_NEGATIVE_PATTERNS = [
  /not interested/i,
  /don't want/i,
  /no thanks/i,
  /not for me/i,
  /don't need/i,
  /leave me alone/i,
  /go away/i,
  /get out/i,
  /I said no/i,
  /stop/i,
  /don't call/i,
  /don't come back/i,
  /waste of time/i,
  /scam/i,
  /rip off/i,
  /too pushy/i,
  /I'm done/i,
  /goodbye/i,
  /have a good day/i  // Dismissive goodbye
]

// Moderate negative language - MEDIUM negative impact (-8-12 points)
const MODERATE_NEGATIVE_PATTERNS = [
  /can't afford/i,
  /too expensive/i,
  /maybe later/i,
  /I'll think about it/i,
  /not right now/i,
  /bad timing/i,
  /not a good time/i,
  /busy right now/i,
  /call back later/i,
  /I don't know/i,
  /I'm not sure/i,
  /need to talk to/i,
  /my (spouse|wife|husband|partner)/i,
  /we'll see/i,
  /let me think/i
]

// Hesitation signals - Mild negative (-3-5 points)
const HESITATION_PATTERNS = [
  /umm/i,
  /well\.\.\./i,
  /I don't know if/i,
  /that's a lot/i,
  /seems like a lot/i,
  /kind of expensive/i,
  /a bit much/i,
  /not sure about/i
]

// Question patterns - Indicates engagement (neutral to positive)
const QUESTION_PATTERNS = [
  /\?$/,  // Ends with question mark
  /^(what|how|why|when|where|who|which|can|could|would|will|do|does|is|are)/i
]

// Calculate buying signals score from transcript with weighted signals
function calculateBuyingSignalsScore(transcript: TranscriptEntry[]): number {
  if (!transcript || transcript.length === 0) return 0

  const homeownerEntries = transcript.filter(e => e.speaker === 'homeowner')
  if (homeownerEntries.length === 0) return 0

  let score = 0
  const recentWindow = Math.max(1, Math.floor(homeownerEntries.length * 0.4)) // Last 40%
  
  homeownerEntries.forEach((entry, index) => {
    const isRecent = index >= homeownerEntries.length - recentWindow
    const recencyMultiplier = isRecent ? 1.5 : 1.0 // Recent signals count more
    
    // Strong buying signals (+18 points each)
    STRONG_BUYING_SIGNALS.forEach(pattern => {
      if (pattern.test(entry.text)) {
        score += 18 * recencyMultiplier
      }
    })
    
    // Moderate buying signals (+10 points each)
    MODERATE_BUYING_SIGNALS.forEach(pattern => {
      if (pattern.test(entry.text)) {
        score += 10 * recencyMultiplier
      }
    })
    
    // Engagement signals (+6 points each)
    ENGAGEMENT_SIGNALS.forEach(pattern => {
      if (pattern.test(entry.text)) {
        score += 6 * recencyMultiplier
      }
    })
  })

  return Math.min(100, Math.round(score))
}

// Calculate positive language score with weighted patterns - NOW ANALYZES BOTH SIDES
function calculatePositiveLanguageScore(transcript: TranscriptEntry[]): number {
  if (!transcript || transcript.length === 0) return 50 // Start neutral

  // Analyze BOTH sides
  const homeownerEntries = transcript.filter(e => e.speaker === 'homeowner')
  const userEntries = transcript.filter(e => e.speaker === 'user' || e.speaker === 'rep')
  const allEntries = [...homeownerEntries, ...userEntries].sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  )
  
  if (allEntries.length === 0) return 50

  let positiveScore = 0
  let negativeScore = 0
  const recentWindow = Math.max(1, Math.floor(allEntries.length * 0.4))

  allEntries.forEach((entry, index) => {
    const isHomeowner = entry.speaker === 'homeowner'
    const isUser = entry.speaker === 'user' || entry.speaker === 'rep'
    const isRecent = index >= allEntries.length - recentWindow
    const recencyMultiplier = isRecent ? 1.3 : 1.0
    
    // HOMEOWNER signals
    if (isHomeowner) {
      // Rapport signals (+8 points)
      RAPPORT_SIGNALS.forEach(pattern => {
        if (pattern.test(entry.text)) {
          positiveScore += 8 * recencyMultiplier
        }
      })
      
      // Soft positive (+4 points)
      SOFT_POSITIVE_PATTERNS.forEach(pattern => {
        if (pattern.test(entry.text)) {
          positiveScore += 4 * recencyMultiplier
        }
      })
      
      // Questions indicate engagement (+3 points)
      QUESTION_PATTERNS.forEach(pattern => {
        if (pattern.test(entry.text)) {
          positiveScore += 3 * recencyMultiplier
        }
      })
      
      // Strong negative (-15 points)
      STRONG_NEGATIVE_PATTERNS.forEach(pattern => {
        if (pattern.test(entry.text)) {
          negativeScore += 15 * recencyMultiplier
        }
      })
      
      // Moderate negative (-8 points)
      MODERATE_NEGATIVE_PATTERNS.forEach(pattern => {
        if (pattern.test(entry.text)) {
          negativeScore += 8 * recencyMultiplier
        }
      })
      
      // Hesitation (-4 points)
      HESITATION_PATTERNS.forEach(pattern => {
        if (pattern.test(entry.text)) {
          negativeScore += 4 * recencyMultiplier
        }
      })
    }
    
    // USER/REP signals - negative language from user hurts sentiment
    if (isUser) {
      // Positive signals (less weight)
      RAPPORT_SIGNALS.forEach(pattern => {
        if (pattern.test(entry.text)) {
          += 4 * recencyMultiplier
        }
      })
      
      // Negative signals (HIGH penalty for user being negative)
      STRONG_NEGATIVE_PATTERNS.forEach(pattern => {
        if (pattern.test(entry.text)) {
          negativeScore += 20 * recencyMultiplier // Higher penalty for user
        }
      })
      
      MODERATE_NEGATIVE_PATTERNS.forEach(pattern => {
        if (pattern.test(entry.text)) {
          negativeScore += 12 * recencyMultiplier
        }
      })
    }
  })

  // Calculate net score: 50 (neutral) + positive - negative
  const netScore = 50 + positiveScore - negativeScore
  return Math.round(Math.max(0, Math.min(100, netScore)))
}

// Calculate objection resolution score
function calculateObjectionResolutionScore(transcript: TranscriptEntry[]): number {
  if (!transcript || transcript.length === 0) return 0

  const homeownerEntries = transcript.filter(e => e.speaker === 'homeowner')
  const objections: Array<{ index: number; type: string | null }> = []

  // Find all objections
  homeownerEntries.forEach((entry, index) => {
    const objection = detectObjection(entry.text)
    if (objection) {
      objections.push({ index, type: objection.type })
    }
  })

  if (objections.length === 0) return 100 // No objections = perfect score

  let resolvedCount = 0
  objections.forEach(obj => {
    const assessment = assessObjectionHandling(obj.index, transcript, obj.type as any)
    if (assessment.isResolved || assessment.wasHandled) {
      resolvedCount++
    }
  })

  // Score based on resolution rate
  const resolutionRate = resolvedCount / objections.length
  return Math.round(resolutionRate * 100)
}

// Calculate sentiment from transcript progression over time - IMPROVED VERSION
// NOW ANALYZES BOTH USER (rep) AND HOMEOWNER (customer) for comprehensive sentiment
function calculateTranscriptSentiment(transcript: TranscriptEntry[], sessionDurationSeconds: number): number {
  if (!transcript || transcript.length === 0) return 50 // Neutral baseline
  
  // Analyze BOTH sides of the conversation
  const homeownerEntries = transcript.filter(e => e.speaker === 'homeowner')
  const userEntries = transcript.filter(e => e.speaker === 'user' || e.speaker === 'rep')
  
  if (homeownerEntries.length === 0 && userEntries.length === 0) return 50
  
  // More granular windows for better responsiveness
  // Use ALL entries (both homeowner and user) for sentiment analysis
  const allEntries = [...homeownerEntries, ...userEntries].sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  )
  
  const totalEntries = allEntries.length
  const recentWindow = Math.max(1, Math.floor(totalEntries * 0.35)) // Last 35%
  const middleStart = Math.max(1, Math.floor(totalEntries * 0.3))
  const middleEnd = Math.max(middleStart + 1, totalEntries - recentWindow)
  
  const earlyEntries = allEntries.slice(0, middleStart)
  const middleEntries = allEntries.slice(middleStart, middleEnd)
  const recentEntries = allEntries.slice(-recentWindow)
  
  // Calculate weighted scores for each window - analyzes BOTH sides
  const calculateWindowScore = (entries: TranscriptEntry[]): number => {
    let positive = 0
    let negative = 0
    
    entries.forEach(entry => {
      const isHomeowner = entry.speaker === 'homeowner'
      const isUser = entry.speaker === 'user' || entry.speaker === 'rep'
      
      // HOMEOWNER signals (buying intent, engagement)
      if (isHomeowner) {
        // Strong buying signals
        STRONG_BUYING_SIGNALS.forEach(pattern => {
          if (pattern.test(entry.text)) positive += 20
        })
        // Moderate buying signals
        MODERATE_BUYING_SIGNALS.forEach(pattern => {
          if (pattern.test(entry.text)) positive += 12
        })
        // Engagement signals
        ENGAGEMENT_SIGNALS.forEach(pattern => {
          if (pattern.test(entry.text)) positive += 6
        })
        // Rapport signals
        RAPPORT_SIGNALS.forEach(pattern => {
          if (pattern.test(entry.text)) positive += 8
        })
        // Soft positive
        SOFT_POSITIVE_PATTERNS.forEach(pattern => {
          if (pattern.test(entry.text)) positive += 4
        })
        // Strong negative
        STRONG_NEGATIVE_PATTERNS.forEach(pattern => {
          if (pattern.test(entry.text)) negative += 18
        })
        // Moderate negative
        MODERATE_NEGATIVE_PATTERNS.forEach(pattern => {
          if (pattern.test(entry.text)) negative += 10
        })
        // Hesitation
        HESITATION_PATTERNS.forEach(pattern => {
          if (pattern.test(entry.text)) negative += 4
        })
      }
      
      // USER/REP signals (professionalism, tone, negative language)
      if (isUser) {
        // Positive: Professional, helpful language
        RAPPORT_SIGNALS.forEach(pattern => {
          if (pattern.test(entry.text)) positive += 5 // Less weight than homeowner
        })
        SOFT_POSITIVE_PATTERNS.forEach(pattern => {
          if (pattern.test(entry.text)) positive += 3
        })
        
        // NEGATIVE: Unprofessional, rude, or inappropriate language from user
        STRONG_NEGATIVE_PATTERNS.forEach(pattern => {
          if (pattern.test(entry.text)) negative += 25 // HIGH penalty for user being negative
        })
        MODERATE_NEGATIVE_PATTERNS.forEach(pattern => {
          if (pattern.test(entry.text)) negative += 15
        })
        
        // Detect "roasting" or mocking language from user
        const roastingPatterns = [
          /\broast\b/i,
          /\bmock\b/i,
          /\bmake fun\b/i,
          /\btease\b/i,
          /\bjoke.*about\b/i,
          /\binsult\b/i,
          /\bdisrespect\b/i,
          /\brude\b/i,
          /\bmean\b/i,
          /\bharsh\b/i,
          /\bcruel\b/i,
          /\bdisgusting\b/i,
          /\bgross\b/i,
          /\bweird\b/i,
          /\bstupid\b/i,
          /\bdumb\b/i,
          /\bidiot\b/i,
          /\bmoron\b/i,
          /\bpathetic\b/i,
          /\byou.*suck\b/i,
          /\byou.*stupid\b/i,
          /\byou.*dumb\b/i,
          /\byou.*idiot\b/i,
          /\byou.*wrong\b/i,
          /\byou.*bad\b/i,
          /\byou.*terrible\b/i,
          /\byou.*awful\b/i,
          /\byou.*horrible\b/i,
          /\byou.*worst\b/i,
          /\byou.*pathetic\b/i,
          /\byou.*disgusting\b/i,
          /\byou.*gross\b/i,
          /\byou.*weird\b/i,
          /\byou.*crazy\b/i,
          /\byou.*insane\b/i,
          /\byou.*ridiculous\b/i,
          /\byou.*absurd\b/i,
          /\byou.*nonsense\b/i,
          /\byou.*bullshit\b/i,
          /\byou.*crap\b/i,
          /\byou.*trash\b/i,
          /\byou.*garbage\b/i,
          /\byou.*useless\b/i,
          /\byou.*worthless\b/i,
          /\byou.*lie\b/i,
          /\byou.*lying\b/i,
          /\byou.*liar\b/i,
          /\byou.*cheat\b/i,
          /\byou.*scam\b/i,
          /\byou.*fraud\b/i,
          /\byou.*rip.*off\b/i,
          /\byou.*steal\b/i,
          /\byou.*don't.*know\b/i,
          /\byou.*don't.*understand\b/i,
          /\byou.*don't.*care\b/i,
          /\byou.*don't.*listen\b/i
        ]
        
        // Check for roasting patterns
        roastingPatterns.forEach(pattern => {
          if (pattern.test(entry.text)) {
            negative += 20 // High penalty for user being negative/unprofessional
          }
        })
      }
    })
    
    // Normalize to 0-100 scale
    const total = positive + negative
    if (total === 0) return 50
    return Math.round((positive / total) * 100)
  }
  
  const earlyScore = earlyEntries.length > 0 ? calculateWindowScore(earlyEntries) : 50
  const middleScore = middleEntries.length > 0 ? calculateWindowScore(middleEntries) : earlyScore
  const recentScore = recentEntries.length > 0 ? calculateWindowScore(recentEntries) : middleScore
  
  // Calculate progression trend
  const earlyToMiddle = middleScore - earlyScore
  const middleToRecent = recentScore - middleScore
  const overallTrend = recentScore - earlyScore
  
  // Base score: heavily weighted towards recent (60% recent, 25% middle, 15% early)
  const baseScore = (earlyScore * 0.15) + (middleScore * 0.25) + (recentScore * 0.60)
  
  // Progression bonus/penalty
  let progressionModifier = 0
  if (overallTrend > 0) {
    // Improving: bonus up to +15 points
    progressionModifier = Math.min(15, overallTrend * 0.3)
  } else if (overallTrend < 0) {
    // Declining: penalty up to -10 points
    progressionModifier = Math.max(-10, overallTrend * 0.2)
  }
  
  // Momentum bonus: if recent trend is positive, extra bonus
  if (middleToRecent > 10) {
    progressionModifier += Math.min(8, middleToRecent * 0.2)
  }
  
  // CRITICAL: Apply objection penalties - sentiment should go DOWN when objections occur
  let objectionPenalty = 0
  
  // Detect all objections and apply penalties based on severity and recency
  homeownerEntries.forEach((entry, index) => {
    const transcriptIndex = transcript.findIndex(e => e === entry)
    const objection = detectObjection(entry.text, transcript, transcriptIndex >= 0 ? transcriptIndex : undefined)
    
    if (objection) {
      // Recency multiplier: recent objections hurt more
      const isRecent = index >= homeownerEntries.length - recentWindow
      const isMiddle = index >= middleStart && index < middleEnd
      const recencyMultiplier = isRecent ? 1.2 : (isMiddle ? 0.8 : 0.5)
      
      let penalty = 0
      switch (objection.severity) {
        case 'critical': penalty = 22; break
        case 'high': penalty = 16; break
        case 'medium': penalty = 10; break
        case 'low': penalty = 5; break
      }
      
      penalty *= recencyMultiplier
      
      // Check if objection was resolved - recovery if handled well
      if (transcriptIndex >= 0) {
        const assessment = assessObjectionHandling(transcriptIndex, transcript, objection.type)
        if (assessment.isResolved) {
          // Fully resolved: 70% recovery
          penalty *= 0.3
        } else if (assessment.wasHandled && assessment.quality === 'excellent') {
          // Handled excellently: 60% recovery
          penalty *= 0.4
        } else if (assessment.wasHandled && assessment.quality === 'good') {
          // Handled well: 50% recovery
          penalty *= 0.5
        } else if (assessment.wasHandled) {
          // Handled adequately: 30% recovery
          penalty *= 0.7
        }
        // If not handled, full penalty applies
      }
      
      objectionPenalty += penalty
    }
  })
  
  // Calculate final score
  const finalScore = baseScore + progressionModifier - objectionPenalty
  
  return Math.round(Math.max(0, Math.min(100, finalScore)))
}

  // Calculate sentiment score with progression (starts low, builds over time)
// IMPROVED: More responsive to conversation dynamics
function calculateSentimentScore(
  transcriptSentiment: number,
  buyingSignals: number,
  objectionResolution: number,
  positiveLanguage: number,
  sessionDurationSeconds: number,
  startingSentiment: number = 5
): number {
  // Base score from factors (weighted) - IMPROVED weighting
  // Transcript Sentiment: 45% (most comprehensive)
  // Buying Signals: 30% (strong indicator of success)
  // Positive Language: 15% (rapport indicator)
  // Objection Resolution: 10% (quality indicator)
  const baseScore = 
    (transcriptSentiment * 0.45) +
    (buyingSignals * 0.30) +
    (positiveLanguage * 0.15) +
    (objectionResolution * 0.10)

  // IMPROVED time progression: faster ramp-up, more responsive
  // First 10 seconds: 40% of base score (faster start)
  // 10-30 seconds: 40-70% of base score
  // 30-90 seconds: 70-90% of base score
  // 90+ seconds: 90-100% of base score
  let timeMultiplier = 0.4 // Start at 40% for faster response
  
  if (sessionDurationSeconds > 90) {
    timeMultiplier = 0.9 + (Math.min(1, (sessionDurationSeconds - 90) / 60) * 0.1) // 90-100%
  } else if (sessionDurationSeconds > 30) {
    timeMultiplier = 0.7 + ((sessionDurationSeconds - 30) / 60 * 0.2) // 70-90%
  } else if (sessionDurationSeconds > 10) {
    timeMultiplier = 0.4 + ((sessionDurationSeconds - 10) / 20 * 0.3) // 40-70%
  } else {
    timeMultiplier = 0.2 + (sessionDurationSeconds / 10 * 0.2) // 20-40% in first 10 seconds
  }

  // Calculate score: starting sentiment + (base score * time multiplier)
  const progressionScore = baseScore * timeMultiplier
  let finalScore = startingSentiment + progressionScore

  // BONUS: If buying signals are high (>50), add extra boost
  if (buyingSignals > 50) {
    finalScore += (buyingSignals - 50) * 0.15 // Up to +7.5 bonus
  }

  // PENALTY: If objection resolution is low (<50), apply penalty
  if (objectionResolution < 50) {
    finalScore -= (50 - objectionResolution) * 0.1 // Up to -5 penalty
  }

  return Math.round(Math.max(0, Math.min(100, finalScore)))
}

export function useSentimentScore(options: UseSentimentScoreOptions = {}): UseSentimentScoreReturn {
  const {
    sessionId = null,
    enabled = false,
    updateInterval = 2000,
    transcript = [],
    sessionStartTime,
    startingSentiment = 5,
    onScoreUpdate
  } = options

  const [sentimentScore, setSentimentScore] = useState<number>(startingSentiment) // Start based on agent personality
  const [sentimentLevel, setSentimentLevel] = useState<'low' | 'building' | 'positive'>('low')
  const [factors, setFactors] = useState<SentimentScoreFactors>({
    transcriptSentiment: 50,
    buyingSignals: 0,
    objectionResolution: 100,
    positiveLanguage: 50
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)

  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const sessionStartTimeRef = useRef<number>(sessionStartTime || Date.now())
  const smoothedScoreRef = useRef<number>(startingSentiment) // Start based on agent personality
  const SMOOTHING_ALPHA = 0.2 // Exponential smoothing factor (lower = more responsive to changes)

  // Update session start time if provided
  useEffect(() => {
    if (sessionStartTime) {
      sessionStartTimeRef.current = sessionStartTime
    }
  }, [sessionStartTime])

  // Calculate transcript-based sentiment (no longer depends on ElevenLabs)
  const calculateTranscriptSentimentScore = useCallback((transcript: TranscriptEntry[], sessionDurationSeconds: number): number => {
    return calculateTranscriptSentiment(transcript, sessionDurationSeconds)
  }, [])

  // Calculate sentiment score
  const calculateScore = useCallback(async () => {
    if (!enabled) return

    setIsLoading(true)
    setError(null)

    try {
      // Calculate session duration
      const currentTime = Date.now()
      const sessionDurationMs = currentTime - sessionStartTimeRef.current
      const sessionDurationSeconds = sessionDurationMs / 1000

      // Calculate transcript-based sentiment (replaces ElevenLabs)
      const transcriptSentiment = calculateTranscriptSentimentScore(transcript, sessionDurationSeconds)

      // Calculate transcript-based factors
      const buyingSignals = calculateBuyingSignalsScore(transcript)
      const objectionResolution = calculateObjectionResolutionScore(transcript)
      const positiveLanguage = calculatePositiveLanguageScore(transcript)

      // Calculate final sentiment score
      const rawScore = calculateSentimentScore(
        transcriptSentiment,
        buyingSignals,
        objectionResolution,
        positiveLanguage,
        sessionDurationSeconds,
        startingSentiment
      )

      // Apply exponential smoothing
      smoothedScoreRef.current =
        smoothedScoreRef.current * SMOOTHING_ALPHA +
        rawScore * (1 - SMOOTHING_ALPHA)

      const finalScore = Math.round(Math.max(0, Math.min(100, smoothedScoreRef.current)))

      // Determine sentiment level
      let level: 'low' | 'building' | 'positive'
      if (finalScore < 30) {
        level = 'low'
      } else if (finalScore >= 30 && finalScore < 60) {
        level = 'building'
      } else {
        level = 'positive'
      }

      // Update state
      setSentimentScore(finalScore)
      setSentimentLevel(level)
      setFactors({
        transcriptSentiment,
        buyingSignals,
        objectionResolution,
        positiveLanguage
      })

      // Call callback if provided
      onScoreUpdate?.(finalScore)
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to calculate sentiment score'
      console.error('Error calculating sentiment score:', errorMsg)
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [enabled, transcript, calculateTranscriptSentimentScore, startingSentiment, onScoreUpdate])

  // Recalculate immediately when transcript changes (new entries added)
  const previousTranscriptLengthRef = useRef<number>(0)
  useEffect(() => {
    if (enabled && transcript.length > previousTranscriptLengthRef.current) {
      // Transcript has new entries, recalculate immediately
      previousTranscriptLengthRef.current = transcript.length
      calculateScore()
    } else if (transcript.length !== previousTranscriptLengthRef.current) {
      // Update ref even if length decreased (session reset)
      previousTranscriptLengthRef.current = transcript.length
    }
  }, [enabled, transcript, calculateScore]) // Watch transcript array directly

  // Start analysis loop
  useEffect(() => {
    if (enabled && !isActive) {
      setIsActive(true)
      // Initial calculation
      calculateScore()
      // Set up interval
      updateIntervalRef.current = setInterval(calculateScore, updateInterval)
    } else if (!enabled && isActive) {
      setIsActive(false)
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = null
      }
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = null
      }
    }
  }, [enabled, isActive, calculateScore, updateInterval])

  // Reset on unmount
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
      setSentimentScore(startingSentiment)
      setSentimentLevel('low')
      setIsActive(false)
    }
  }, [startingSentiment])

  return {
    sentimentScore,
    sentimentLevel,
    factors,
    isLoading,
    error,
    isActive
  }
}

