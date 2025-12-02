'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { TranscriptEntry, FeedbackItem, FeedbackType, FeedbackSeverity, LiveSessionMetrics } from '@/lib/trainer/types'
import {
  detectObjection as detectEnhancedObjection,
  detectMicroCommitment,
  detectCloseAttempt,
  detectTechnique as detectEnhancedTechnique,
  assessObjectionHandling,
  assessCloseSuccess,
  assessCloseTiming,
  generateConciseFeedback,
  getObjectionApproach,
  calculateObjectionTiming,
  trackObjection,
  getObjectionSequence,
  resetObjectionSequence,
  detectObjectionStacking,
  calculateBuyingTemperature
} from '@/lib/trainer/enhancedPatternAnalyzer'

interface UseLiveSessionAnalysisReturn {
  feedbackItems: FeedbackItem[]
  metrics: LiveSessionMetrics
}

// Objection detection patterns
const OBJECTION_PATTERNS = {
  price: [
    'too expensive', 'can\'t afford', 'price is high', 'costs too much',
    'too much money', 'expensive', 'cheaper', 'lower price', 'budget',
    'can\'t pay', 'out of my price range', 'more than i can spend'
  ],
  time: [
    'not right now', 'maybe later', 'need to think', 'think about it',
    'not ready', 'later', 'some other time', 'not now', 'give me time',
    'need time', 'think it over', 'decide later'
  ],
  authority: [
    'talk to spouse', 'need to discuss', 'not my decision', 'spouse',
    'partner', 'wife', 'husband', 'check with', 'ask my', 'discuss with',
    'run it by', 'get back to you', 'let me check'
  ],
  need: [
    'don\'t need it', 'already have', 'not interested', 'don\'t want',
    'not needed', 'no need', 'already got', 'have one', 'don\'t want it',
    'not for me', 'not what i need'
  ]
}

// Technique detection patterns (legacy - now uses enhancedPatternAnalyzer)
const TECHNIQUE_PATTERNS = {
  feelFeltFound: [
    'i understand how you feel', 'i felt the same way', 'others have felt',
    'i know how you feel', 'i felt that', 'others felt', 'i\'ve felt'
  ],
  socialProof: [
    'other customers', 'neighbors', 'other homeowners', 'many customers',
    'lots of people', 'others have', 'most people', 'customers say',
    'neighbors love', 'everyone says'
  ],
  urgency: [
    'limited time', 'today only', 'special offer', 'act now',
    'don\'t wait', 'limited availability', 'while supplies last',
    'expires soon', 'ending soon', 'last chance'
  ],
  openEndedQuestion: [
    // Will detect questions starting with what/how/why
  ],
  activeListening: [
    'i hear you', 'i understand', 'that makes sense', 'i see',
    'got it', 'i get that', 'absolutely', 'you\'re right',
    'i can see why', 'that\'s understandable'
  ],
  // New techniques added
  tieDowns: [
    'right?', 'wouldn\'t you agree', 'makes sense', 'don\'t you think', 'fair enough'
  ],
  futurePacing: [
    'imagine', 'picture this', 'think about', 'wouldn\'t it be nice', 'what if you could'
  ],
  painDiscovery: [
    'have you noticed', 'what kind of bugs', 'how often do you see', 'what\'s been your experience'
  ],
  takeaway: [
    'might not be for you', 'not for everyone', 'only if', 'no pressure', 'totally understand if'
  ],
  alternativeClose: [
    'morning or afternoon', 'this week or next', 'would you prefer', 'which works better'
  ],
  priceReframe: [
    'less than a dollar', 'cost of a coffee', 'pennies a day', 'compared to', 'cheaper than'
  ],
  thirdPartyStory: [
    'had a customer', 'talked to someone', 'neighbor down the street', 'just last week', 'funny story'
  ],
  patternInterrupt: [
    'before you say no', 'I know what you\'re thinking', 'hear me out', 'quick question'
  ],
  assumptiveLanguage: [
    'when we', 'when my', 'when our', 'when you\'re',
    'once we', 'once you', 'once it',
    'after we', 'after the first', 'after installation',
    'you\'re going to love', 'you\'ll love', 'you will notice',
    'let\'s get', 'let\'s set', 'let\'s schedule',
    'we\'ll have', 'we will',
    'what you\'re going to love', 'best phone', 'best email',
    'confirmation', 'my guy comes', 'first treatment',
    'you\'ll notice', 'never deal with', 'peace of mind'
  ]
}

// Legacy objection detection (kept for metrics calculation)
function detectObjection(text: string): { type: 'price' | 'time' | 'authority' | 'need' } | null {
  const enhanced = detectEnhancedObjection(text)
  if (!enhanced) return null
  
  // Map enhanced types to legacy types for backward compatibility
  const typeMap: Record<string, 'price' | 'time' | 'authority' | 'need'> = {
    price: 'price',
    timing: 'time',
    trust: 'need', // Map trust to need for legacy
    need: 'need',
    authority: 'authority',
    comparison: 'price', // Map comparison to price for legacy
    skepticism: 'need' // Map skepticism to need for legacy
  }
  
  return { type: typeMap[enhanced.type] || 'need' }
}

// Check if text contains technique patterns (uses enhanced analyzer first, falls back to legacy)
function detectTechnique(text: string): string | null {
  // Try enhanced technique detection first
  const enhancedTechnique = detectEnhancedTechnique(text)
  if (enhancedTechnique) {
    return enhancedTechnique
  }
  
  const lowerText = text.toLowerCase()
  
  // Check for open-ended questions
  if (/^(what|how|why|when|where|tell me|can you explain)/i.test(text.trim())) {
    return 'Open-Ended Question'
  }
  
  // Check legacy techniques
  for (const [technique, patterns] of Object.entries(TECHNIQUE_PATTERNS)) {
    if (technique === 'openEndedQuestion') continue // Already checked
    
    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        const formattedName = technique
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim()
        return formattedName === 'Feel Felt Found' ? 'Feel-Felt-Found' : formattedName
      }
    }
  }
  
  return null
}

// Detect objection handling quality
function detectObjectionHandling(
  text: string, 
  objectionTime: Date | null, 
  currentTime: Date
): { quality: 'strong' | 'weak' | 'ignored'; message: string } | null {
  if (!objectionTime) return null
  
  const timeSinceObjection = currentTime.getTime() - objectionTime.getTime()
  const lowerText = text.toLowerCase()
  
  // Addressing language patterns
  const addressingPatterns = [
    'i understand', 'i hear you', 'that makes sense', 'i can see why',
    'let me address', 'let me help', 'here\'s how', 'the way we handle',
    'solution', 'option', 'alternative', 'we can work with'
  ]
  
  const hasAddressing = addressingPatterns.some(pattern => lowerText.includes(pattern))
  
  // Solution language patterns
  const solutionPatterns = [
    'solution', 'option', 'alternative', 'we can', 'here\'s how',
    'what we do', 'the way', 'approach', 'method'
  ]
  const hasSolution = solutionPatterns.some(pattern => lowerText.includes(pattern))
  
  if (timeSinceObjection > 60000) {
    return { quality: 'ignored', message: 'Objection ignored - no response' }
  }
  
  if (timeSinceObjection <= 30000 && hasAddressing && hasSolution) {
    return { quality: 'strong', message: 'Strong rebuttal! Objection handled well.' }
  }
  
  if (timeSinceObjection <= 30000 && hasAddressing && !hasSolution) {
    return { quality: 'weak', message: 'Acknowledged but no solution offered' }
  }
  
  return null
}

// Detect closing behaviors
function detectClosingBehavior(text: string): { type: 'trial_close' | 'direct_close' | 'assumptive'; message: string } | null {
  const lowerText = text.toLowerCase()
  
  // Trial close patterns
  const trialClosePatterns = [
    'does that make sense', 'can you see how', 'would that work', 'does that sound',
    'make sense', 'sound good', 'work for you', 'see how this helps',
    'does this help', 'would this work', 'can you see', 'does that help'
  ]
  
  // Direct close patterns
  const directClosePatterns = [
    'can we schedule', 'let\'s get you started', 'ready to move forward',
    'let\'s set this up', 'can we get started', 'shall we proceed',
    'want to get started', 'ready to begin', 'let\'s move forward',
    'can we book', 'schedule an appointment', 'set up installation'
  ]
  
  // Assumptive language patterns
  const assumptivePatterns = [
    'when we install', 'after we get started', 'once you\'re set up',
    'when we set this up', 'once we install', 'after installation',
    'when we begin', 'once we start', 'after we get going',
    'when you\'re set up', 'once it\'s installed'
  ]
  
  if (trialClosePatterns.some(pattern => lowerText.includes(pattern))) {
    return { type: 'trial_close', message: 'Trial close!' }
  }
  
  if (directClosePatterns.some(pattern => lowerText.includes(pattern))) {
    return { type: 'direct_close', message: 'Going for the close!' }
  }
  
  if (assumptivePatterns.some(pattern => lowerText.includes(pattern))) {
    return { type: 'assumptive', message: 'Assumptive language!' }
  }
  
  return null
}

// Detect personal rapport-building questions from user
function detectPersonalRapportQuestion(text: string): boolean {
  const lowerText = text.toLowerCase()
  
  // Personal life questions
  const personalQuestionPatterns = [
    'how has your day been',
    'how\'s your day',
    'how are you doing',
    'how are things',
    'how\'s it going',
    'how have you been',
    'how\'s life',
    'how\'s everything',
    'how\'s the family',
    'how are the kids',
    'how\'s work',
    'what do you do',
    'where are you from',
    'how long have you lived',
    'tell me about yourself',
    'what brings you here',
    'what\'s your name',
    'nice to meet you',
    'how\'s your weekend',
    'how was your week',
    'enjoying the weather',
    'how\'s the neighborhood',
    'been here long',
    'how do you like living here'
  ]
  
  // Check if it's a question (ends with ? or starts with question words)
  const isQuestion = text.trim().endsWith('?') || /^(how|what|where|tell me)/i.test(text.trim())
  
  // Check if it contains personal rapport patterns
  const hasPersonalPattern = personalQuestionPatterns.some(pattern => lowerText.includes(pattern))
  
  return isQuestion && hasPersonalPattern
}

// Detect momentum shifts
function detectMomentumShift(
  currentEntry: TranscriptEntry,
  recentEntries: TranscriptEntry[],
  objectionHandled: boolean
): { type: 'building_rapport' | 'interest_growing' | 'losing_engagement' | 'strong_recovery'; message: string } | null {
  if (currentEntry.speaker !== 'homeowner') return null
  
  const recentHomeownerEntries = recentEntries
    .filter(e => e.speaker === 'homeowner')
    .slice(-5)
  
  if (recentHomeownerEntries.length < 2) return null
  
  // Check response length trend
  const lengths = recentHomeownerEntries.map(e => e.text.length)
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length
  const currentLength = currentEntry.text.length
  
  // Strong recovery after objection
  if (objectionHandled && currentLength > avgLength * 1.3) {
    return { type: 'strong_recovery', message: 'Strong recovery! Regained momentum.' }
  }
  
  // Interest growing - responses getting longer
  if (currentLength > avgLength * 1.2 && currentLength > 40) {
    return { type: 'interest_growing', message: 'Interest growing! Responses getting longer.' }
  }
  
  // Losing engagement - responses getting shorter
  if (currentLength < avgLength * 0.7 && currentLength < 20 && recentHomeownerEntries.length >= 3) {
    const dismissivePatterns = ['no', 'not interested', 'maybe later', 'i don\'t think', 'probably not']
    const isDismissive = dismissivePatterns.some(pattern => currentEntry.text.toLowerCase().includes(pattern))
    
    if (isDismissive) {
      return { type: 'losing_engagement', message: 'Losing engagement - responses getting shorter.' }
    }
  }
  
  return null
}

// Detect question quality
function detectQuestionQuality(text: string): { type: 'discovery' | 'qualifying' | 'closed'; message: string } | null {
  if (!text.trim().endsWith('?')) return null
  
  const lowerText = text.toLowerCase()
  
  // Discovery question patterns (problems/pain points)
  const discoveryPatterns = [
    'what\'s your biggest concern', 'how often do you deal with', 'what happens when',
    'what problems', 'what challenges', 'what issues', 'what\'s frustrating',
    'what keeps you up', 'what\'s your main', 'what concerns you'
  ]
  
  // Qualifying question patterns (determining fit)
  const qualifyingPatterns = [
    'who makes decisions', 'what\'s your timeline', 'have you looked into',
    'what\'s your budget', 'when are you looking', 'who else is involved',
    'what\'s important to you', 'what are your priorities'
  ]
  
  // Closed question patterns (yes/no)
  const closedPatterns = [
    /^(is|are|do|does|did|can|could|will|would|have|has|had)\s/i,
    /^(do you|are you|is it|can you|will you|would you)\s/i
  ]
  
  if (discoveryPatterns.some(pattern => lowerText.includes(pattern))) {
    return { type: 'discovery', message: 'Great discovery question!' }
  }
  
  if (qualifyingPatterns.some(pattern => lowerText.includes(pattern))) {
    return { type: 'qualifying', message: 'Good qualifying question!' }
  }
  
  if (closedPatterns.some(pattern => pattern.test(text.trim()))) {
    return { type: 'closed', message: 'Use open-ended questions for better discovery.' }
  }
  
  return null
}

// Detect price handling
function detectPriceHandling(
  text: string,
  sessionStartTime: Date | null,
  valueStatements: number
): { type: 'too_early' | 'great_framing' | 'breakdown_used' | 'skipped'; message: string } | null {
  const lowerText = text.toLowerCase()
  
  // Price mention patterns
  const pricePatterns = [
    'price', 'cost', 'how much', 'dollar', '$', 'expensive', 'afford',
    'payment', 'pay', 'charge', 'fee', 'rate'
  ]
  
  const hasPriceMention = pricePatterns.some(pattern => lowerText.includes(pattern))
  if (!hasPriceMention) return null
  
  // Check if price was asked but not answered
  if (text.includes('?')) {
    // This is a question about price - check if it's being answered
    return null // Will be handled by checking if rep responds
  }
  
  // Great price framing patterns
  const framingPatterns = [
    'for just', 'per day', 'per month', 'compared to', 'investment in',
    'worth it', 'value', 'saves you', 'costs less than', 'only'
  ]
  
  // Price breakdown patterns
  const breakdownPatterns = [
    'per day', 'per month', 'per year', 'daily', 'monthly', 'annually',
    'breaks down to', 'comes out to', 'works out to', 'that\'s only'
  ]
  
  // Check timing (first 2 minutes = 120000ms)
  if (sessionStartTime) {
    const sessionDuration = Date.now() - sessionStartTime.getTime()
    if (sessionDuration < 120000 && valueStatements === 0) {
      return { type: 'too_early', message: 'Price mentioned too early - establish value first.' }
    }
  }
  
  if (framingPatterns.some(pattern => lowerText.includes(pattern))) {
    return { type: 'great_framing', message: 'Great price framing!' }
  }
  
  if (breakdownPatterns.some(pattern => lowerText.includes(pattern))) {
    return { type: 'breakdown_used', message: 'Price breakdown used!' }
  }
  
  return null
}

// Calculate talk time ratio
// Returns the percentage of user (sales rep) talk time
// Higher percentage = user talked more, lower percentage = agent talked more
function calculateTalkTimeRatio(transcript: TranscriptEntry[]): number {
  if (transcript.length === 0) return 50 // Default to 50% if no transcript
  
  let userCharCount = 0
  let homeownerCharCount = 0
  
  transcript.forEach(entry => {
    const charCount = entry.text.length
    // Explicitly check for 'user' speaker (sales rep)
    if (entry.speaker === 'user') {
      userCharCount += charCount
    } 
    // Explicitly check for 'homeowner' speaker (AI agent)
    else if (entry.speaker === 'homeowner') {
      homeownerCharCount += charCount
    }
    // Ignore any other speaker values to avoid counting errors
  })
  
  const totalChars = userCharCount + homeownerCharCount
  if (totalChars === 0) return 50
  
  // Calculate user's percentage: (user chars / total chars) * 100
  // This means: more user talk = higher %, more agent talk = lower %
  const userPercentage = Math.round((userCharCount / totalChars) * 100)
  
  console.log('📊 Talk ratio calculation:', {
    userChars: userCharCount,
    homeownerChars: homeownerCharCount,
    totalChars,
    userPercentage: `${userPercentage}%`
  })
  
  return userPercentage
}

// Calculate WPM from transcript entries using actual speaking time
// Uses time between consecutive user entries to calculate actual speaking duration
function calculateWPMFromTranscript(
  transcript: TranscriptEntry[],
  sessionStartTime: Date | null,
  currentTime: Date
): number {
  if (!transcript || transcript.length === 0 || !sessionStartTime) return 0
  
  // Filter to only user/rep entries
  const repEntries = transcript.filter(entry => entry.speaker === 'user')
  if (repEntries.length === 0) return 0
  
  // Calculate total words from all user entries
  const totalWords = repEntries.reduce((sum, entry) => {
    return sum + (entry.text?.split(/\s+/).filter(w => w.length > 0).length || 0)
  }, 0)
  
  if (totalWords === 0) return 0
  
  // Calculate actual speaking time by summing time spans between consecutive user entries
  // This excludes pauses and gives us the actual time spent speaking
  let totalSpeakingTimeMs = 0
  
  if (repEntries.length === 1) {
    // Single entry - estimate speaking time based on word count
    // Average speaking rate: ~150 WPM = ~400ms per word
    const words = totalWords
    const estimatedDuration = words * 400
    
    // If entry was very recent (< 3 seconds), use time since entry
    const entryTime = repEntries[0].timestamp instanceof Date
      ? repEntries[0].timestamp.getTime()
      : typeof repEntries[0].timestamp === 'string'
        ? new Date(repEntries[0].timestamp).getTime()
        : sessionStartTime.getTime()
    
    const timeSinceEntry = currentTime.getTime() - entryTime
    if (timeSinceEntry < 3000) {
      totalSpeakingTimeMs = Math.max(estimatedDuration, timeSinceEntry)
    } else {
      totalSpeakingTimeMs = estimatedDuration
    }
  } else {
    // Multiple entries - calculate time span from first to last user entry
    // This gives us the actual speaking window (excluding pauses between entries)
    const firstEntryTime = repEntries[0].timestamp instanceof Date
      ? repEntries[0].timestamp.getTime()
      : typeof repEntries[0].timestamp === 'string'
        ? new Date(repEntries[0].timestamp).getTime()
        : sessionStartTime.getTime()
    
    const lastEntryTime = repEntries[repEntries.length - 1].timestamp instanceof Date
      ? repEntries[repEntries.length - 1].timestamp.getTime()
      : typeof repEntries[repEntries.length - 1].timestamp === 'string'
        ? new Date(repEntries[repEntries.length - 1].timestamp).getTime()
        : currentTime.getTime()
    
    // Base speaking time is the span from first to last entry
    totalSpeakingTimeMs = lastEntryTime - firstEntryTime
    
    // Add estimated duration for the last entry (since we only know when it started)
    // Average speaking rate: ~150 WPM = ~400ms per word
    const lastEntryWords = (repEntries[repEntries.length - 1].text?.split(/\s+/).filter(w => w.length > 0).length || 0)
    const lastEntryEstimatedDuration = lastEntryWords * 400
    
    // If last entry was very recent (< 2 seconds), add time since it was spoken
    const timeSinceLastEntry = currentTime.getTime() - lastEntryTime
    if (timeSinceLastEntry < 2000) {
      totalSpeakingTimeMs += Math.min(timeSinceLastEntry, lastEntryEstimatedDuration)
    } else {
      totalSpeakingTimeMs += lastEntryEstimatedDuration
    }
    
    // Filter out pauses: if gap between consecutive entries is > 3 seconds, 
    // subtract the pause time (only count up to 3 seconds as speaking time)
    for (let i = 1; i < repEntries.length; i++) {
      const prevTime = repEntries[i - 1].timestamp instanceof Date
        ? repEntries[i - 1].timestamp.getTime()
        : typeof repEntries[i - 1].timestamp === 'string'
          ? new Date(repEntries[i - 1].timestamp).getTime()
          : sessionStartTime.getTime()
      
      const currTime = repEntries[i].timestamp instanceof Date
        ? repEntries[i].timestamp.getTime()
        : typeof repEntries[i].timestamp === 'string'
          ? new Date(repEntries[i].timestamp).getTime()
          : currentTime.getTime()
      
      const gap = currTime - prevTime
      
      // If gap is > 3 seconds, subtract the excess (pause time)
      if (gap > 3000) {
        totalSpeakingTimeMs -= (gap - 3000)
      }
    }
  }
  
  // Ensure minimum duration for calculation stability
  const minDurationMs = 1000 // At least 1 second
  const actualDurationMs = Math.max(minDurationMs, totalSpeakingTimeMs)
  const durationMinutes = actualDurationMs / 60000
  
  // Calculate WPM: words / speaking time in minutes
  const wpm = Math.round(totalWords / durationMinutes)
  
  // Cap at reasonable limits (0-250 WPM)
  return Math.max(0, Math.min(250, wpm))
}

export function useLiveSessionAnalysis(transcript: TranscriptEntry[]): UseLiveSessionAnalysisReturn {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([])
  const previousTranscriptLengthRef = useRef(0)
  const objectionIndicesRef = useRef<Map<string, number>>(new Map()) // Track objection indices for assessment
  const objectionHandledRef = useRef<Map<string, boolean>>(new Map())
  const objectionResolvedRef = useRef<Map<string, boolean>>(new Map()) // Track if objection is fully resolved
  const objectionTypesRef = useRef<Map<string, string>>(new Map()) // Track objection types for re-objection detection
  const objectionLastCheckedRef = useRef<Map<string, number>>(new Map()) // Track last check index for each objection
  const closeAttemptIndicesRef = useRef<number[]>([]) // Track close attempts for timing
  const unhandledObjectionIndicesRef = useRef<number[]>([]) // Track unhandled objections
  const lastMonologueStartRef = useRef<Date | null>(null)
  const lastMonologueSpeakerRef = useRef<'user' | 'homeowner' | null>(null)
  const recentEntriesRef = useRef<TranscriptEntry[]>([])
  const closedQuestionCountRef = useRef(0)
  const sessionStartTimeRef = useRef<Date | null>(null)
  const valueStatementsCountRef = useRef(0)
  const priceQuestionAskedRef = useRef<Date | null>(null)
  const lastTalkTimeWarningRef = useRef<{ threshold: 'high' | 'low' | null; timestamp: Date | null }>({ threshold: null, timestamp: null })
  const recentObjectionsRef = useRef<Array<{ timestamp: Date; type: 'price' | 'timing' | 'trust' | 'need' | 'authority' | 'comparison' | 'skepticism' | 'renter_ownership' | 'existing_service' | 'no_problem' | 'contract_fear' | 'door_policy' | 'brush_off' | 'bad_experience' | 'just_moved' }>>([]) // For stacking detection
  const commitmentHistoryRef = useRef<Array<{ timestamp: Date; level: 'minimal' | 'moderate' | 'strong' | 'buying' }>>([]) // For buying temperature
  
  // Reset objection sequence on new session
  useEffect(() => {
    if (transcript.length === 0) {
      resetObjectionSequence()
      recentObjectionsRef.current = []
      commitmentHistoryRef.current = []
    }
  }, [transcript.length])
  
  // Generate feedback item
  const addFeedbackItem = useCallback((
    type: FeedbackType,
    message: string,
    severity: FeedbackSeverity,
    metadata?: FeedbackItem['metadata']
  ) => {
    const newItem: FeedbackItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
      type,
      message,
      severity,
      metadata
    }
    
    console.log('➕ Adding feedback item:', { type, message: message.substring(0, 50), severity })
    
    setFeedbackItems(prev => {
      const updated = [...prev, newItem]
      console.log('📋 Total feedback items:', updated.length)
      // Keep max 50 items
      return updated.slice(-50)
    })
  }, [])
  
  // Initialize session start time
  useEffect(() => {
    if (transcript.length > 0 && !sessionStartTimeRef.current) {
      sessionStartTimeRef.current = transcript[0].timestamp
    }
  }, [transcript.length])

  // Analyze transcript for new entries
  useEffect(() => {
    if (transcript.length <= previousTranscriptLengthRef.current) {
      return // No new entries
    }
    
    const newEntries = transcript.slice(previousTranscriptLengthRef.current)
    previousTranscriptLengthRef.current = transcript.length
    
    // Update recent entries (keep last 10 for momentum tracking)
    recentEntriesRef.current = [...recentEntriesRef.current, ...newEntries].slice(-10)
    
    console.log('🔍 Analyzing new transcript entries:', newEntries.length, 'entries')
    
    newEntries.forEach((entry, relativeIndex) => {
      const entryIndex = previousTranscriptLengthRef.current + relativeIndex
      console.log('📝 Processing entry:', { speaker: entry.speaker, text: entry.text.substring(0, 50), index: entryIndex })
      
      // Enhanced objection detection (only for homeowner) with context awareness
      if (entry.speaker === 'homeowner') {
        // Use context-aware detection
        const objection = detectEnhancedObjection(entry.text, transcript, entryIndex)
        console.log('🏠 Homeowner entry - objection check:', objection ? objection.type : 'none')
        if (objection) {
          const objectionKey = `${objection.type}-${entry.id}`
          
          if (!objectionIndicesRef.current.has(objectionKey)) {
            objectionIndicesRef.current.set(objectionKey, entryIndex)
            objectionHandledRef.current.set(objectionKey, false)
            unhandledObjectionIndicesRef.current.push(entryIndex)
            
            // Calculate timing
            const timing = sessionStartTimeRef.current 
              ? calculateObjectionTiming(entry.timestamp, sessionStartTimeRef.current)
              : 'mid'
            
            // Track objection for sequence and stacking
            trackObjection(objection.type, timing, entry.timestamp)
            recentObjectionsRef.current.push({ timestamp: entry.timestamp, type: objection.type })
            recentObjectionsRef.current = recentObjectionsRef.current.slice(-10) // Keep last 10
            
            // Check for stacking
            const isStacked = detectObjectionStacking(recentObjectionsRef.current)
            
            // Generate concise feedback message with sub-category
            let message = generateConciseFeedback('objection', {
              objectionType: objection.type,
              severity: objection.severity,
              subCategory: objection.subCategory,
              confidence: objection.confidence
            })
            
            // Add timing and stacking info to message
            if (timing === 'early') {
              message += ' (Early - possible brush-off)'
            } else if (timing === 'late') {
              message += ' (Late - genuine concern)'
            }
            
            if (isStacked) {
              message += ' [Stacked - multiple objections]'
            }
            
            // Map timing to 'time' for backward compatibility
            const objectionType = objection.type === 'timing' ? 'time' : objection.type
            
            addFeedbackItem(
              'objection_detected',
              message,
              objection.severity === 'critical' || isStacked ? 'needs_improvement' : 'neutral',
              { 
                objectionType: objectionType as any,
                handlingQuality: undefined
              }
            )
            
            // Store objection type for re-objection detection
            objectionTypesRef.current.set(objectionKey, objection.type)
            objectionLastCheckedRef.current.set(objectionKey, entryIndex)
            objectionResolvedRef.current.set(objectionKey, false)
          }
        }
        
        // Enhanced micro-commitment detection with context awareness
        const commitment = detectMicroCommitment(entry.text, transcript, entryIndex)
        if (commitment) {
          // Track for buying temperature
          commitmentHistoryRef.current.push({ timestamp: entry.timestamp, level: commitment })
          commitmentHistoryRef.current = commitmentHistoryRef.current.slice(-20) // Keep last 20
          
          // Calculate buying temperature
          const temperature = calculateBuyingTemperature(commitmentHistoryRef.current, entry.timestamp)
          
          // Only show moderate+ commitments to avoid spam
          if (commitment === 'moderate' || commitment === 'strong' || commitment === 'buying') {
            let message = generateConciseFeedback('micro_commitment', { level: commitment })
            
            // Add temperature trend info
            if (temperature.trend === 'warming_up') {
              message += ' - Temperature rising!'
            } else if (temperature.trend === 'cooling_off') {
              message += ' - Temperature cooling'
            }
            
            addFeedbackItem(
              'coaching_tip',
              message,
              commitment === 'buying' ? 'good' : 'neutral',
              { commitmentLevel: commitment }
            )
          }
        }
        
        // Check for price questions
        const lowerText = entry.text.toLowerCase()
        if ((lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('how much')) && entry.text.includes('?')) {
          priceQuestionAskedRef.current = entry.timestamp
        }
        
        // Detect momentum shifts
        const momentum = detectMomentumShift(entry, recentEntriesRef.current, false)
        if (momentum) {
          addFeedbackItem(
            'momentum_shift',
            momentum.message,
            momentum.type === 'losing_engagement' ? 'needs_improvement' : 'good',
            { momentumType: momentum.type }
          )
        }
      }
      
      // Technique detection (only for user/rep)
      if (entry.speaker === 'user') {
        const technique = detectTechnique(entry.text)
        console.log('👤 User entry - technique check:', technique || 'none')
        if (technique) {
          addFeedbackItem(
            'technique_used',
            `Great use of ${technique} technique!`,
            'good',
            { techniqueName: technique }
          )
        }
        
        // Building rapport - only when user asks personal questions
        const isPersonalRapportQuestion = detectPersonalRapportQuestion(entry.text)
        if (isPersonalRapportQuestion) {
          // Check if we've shown this recently (avoid spam) - use setFeedbackItems callback to access current state
          setFeedbackItems(prev => {
            const lastRapportFeedback = prev
              .slice()
              .reverse()
              .find((item: FeedbackItem) => item.type === 'momentum_shift' && item.message.includes('Building rapport'))
            
            if (!lastRapportFeedback || Date.now() - lastRapportFeedback.timestamp.getTime() > 30000) {
              const newItem: FeedbackItem = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                timestamp: new Date(),
                type: 'momentum_shift',
                message: 'Building rapport! Getting to know the homeowner.',
                severity: 'good',
                metadata: { momentumType: 'building_rapport' }
              }
              return [...prev, newItem]
            }
            return prev
          })
        }
        
        // Track value statements for price handling
        const valuePatterns = ['value', 'benefit', 'saves', 'protects', 'helps', 'improves', 'solves']
        if (valuePatterns.some(pattern => entry.text.toLowerCase().includes(pattern))) {
          valueStatementsCountRef.current++
        }
        
        // Enhanced close attempt detection
        const closeType = detectCloseAttempt(entry.text)
        if (closeType) {
          closeAttemptIndicesRef.current.push(entryIndex)
          
          // Assess close timing
          const timing = assessCloseTiming(
            entryIndex,
            transcript,
            unhandledObjectionIndicesRef.current
          )
          
          // Assess close success after short delay
          setTimeout(() => {
            const wasSuccessful = assessCloseSuccess(entryIndex, transcript)
            const message = generateConciseFeedback('close_attempt', {
              closeType,
              wasSuccessful
            })
            
            addFeedbackItem(
              'closing_behavior',
              message,
              wasSuccessful ? 'good' : 'neutral',
              { 
                closingType: closeType as any,
                closeTiming: timing
              }
            )
            
            // If timing is inappropriate, provide feedback
            if (timing === 'too_early' || timing === 'too_late') {
              const timingMessage = generateConciseFeedback('close_timing', { timing })
              addFeedbackItem(
                'coaching_tip',
                timingMessage,
                'needs_improvement',
                { closeTiming: timing }
              )
            }
          }, 3000) // Check after 3 seconds
        } else {
          // Legacy closing behavior detection (fallback)
          const closing = detectClosingBehavior(entry.text)
          if (closing) {
            addFeedbackItem(
              'closing_behavior',
              closing.message,
              'good',
              { closingType: closing.type }
            )
          }
        }
        
        // Detect question quality
        const questionQuality = detectQuestionQuality(entry.text)
        if (questionQuality) {
          if (questionQuality.type === 'closed') {
            closedQuestionCountRef.current++
            // Only flag if 3+ closed questions in a row
            if (closedQuestionCountRef.current >= 3) {
              addFeedbackItem(
                'question_quality',
                questionQuality.message,
                'needs_improvement',
                { questionType: questionQuality.type }
              )
              closedQuestionCountRef.current = 0 // Reset
            }
          } else {
            closedQuestionCountRef.current = 0 // Reset on good question
            addFeedbackItem(
              'question_quality',
              questionQuality.message,
              'good',
              { questionType: questionQuality.type }
            )
          }
        }
        
        // Detect price handling
        const priceHandling = detectPriceHandling(
          entry.text,
          sessionStartTimeRef.current,
          valueStatementsCountRef.current
        )
        if (priceHandling) {
          addFeedbackItem(
            'price_handling',
            priceHandling.message,
            priceHandling.type === 'too_early' || priceHandling.type === 'skipped' ? 'needs_improvement' : 'good',
            { priceHandlingType: priceHandling.type }
          )
        }
        
        // Check if price question was answered
        if (priceQuestionAskedRef.current) {
          const timeSinceQuestion = entry.timestamp.getTime() - priceQuestionAskedRef.current.getTime()
          if (timeSinceQuestion < 10000) { // Within 10 seconds
            priceQuestionAskedRef.current = null // Answered
          }
        }
        
        // Check for long monologues (>45 seconds of continuous talking)
        if (lastMonologueSpeakerRef.current === 'user' && lastMonologueStartRef.current) {
          const timeSinceStart = entry.timestamp.getTime() - lastMonologueStartRef.current.getTime()
          if (timeSinceStart > 45000) {
            addFeedbackItem(
              'coaching_tip',
              'Talking too long - ask an open-ended question.',
              'needs_improvement'
            )
            lastMonologueStartRef.current = null // Reset to avoid spam
          }
        } else {
          lastMonologueStartRef.current = entry.timestamp
          lastMonologueSpeakerRef.current = 'user'
        }
      } else {
        // Reset monologue tracking when homeowner speaks
        if (lastMonologueSpeakerRef.current === 'user') {
          lastMonologueStartRef.current = null
          lastMonologueSpeakerRef.current = null
        }
        
        // Reset closed question count when homeowner responds
        closedQuestionCountRef.current = 0
      }
      
      // Buying signals are now handled by micro-commitment detection above
    })
  }, [transcript, addFeedbackItem])
  
  // Continuous objection monitoring - check resolution status on every transcript update
  useEffect(() => {
    // Check all pending objections for resolution status
    objectionIndicesRef.current.forEach((objectionIndex, objectionKey) => {
      const isResolved = objectionResolvedRef.current.get(objectionKey)
      const lastChecked = objectionLastCheckedRef.current.get(objectionKey) || objectionIndex
      
      // Only check if not already resolved and transcript has grown
      if (!isResolved && transcript.length > lastChecked) {
        const objectionType = objectionTypesRef.current.get(objectionKey)
        const handling = assessObjectionHandling(
          objectionIndex, 
          transcript,
          objectionType as any
        )
        
        // Update last checked index
        objectionLastCheckedRef.current.set(objectionKey, transcript.length - 1)
        
        // Check if objection is now handled
        if (handling.wasHandled && !objectionHandledRef.current.get(objectionKey)) {
          objectionHandledRef.current.set(objectionKey, true)
          
          // Remove from unhandled list
          const unhandledIdx = unhandledObjectionIndicesRef.current.indexOf(objectionIndex)
          if (unhandledIdx > -1) {
            unhandledObjectionIndicesRef.current.splice(unhandledIdx, 1)
          }
          
          let message = generateConciseFeedback('objection_handling', {
            quality: handling.quality,
            wasHandled: true
          })
          
          // Add resolution signals to message if available
          if (handling.resolutionSignals && handling.resolutionSignals.length > 0) {
            message += ` (${handling.resolutionSignals.slice(0, 2).join(', ')})`
          }
          
          addFeedbackItem(
            'objection_handling',
            message,
            handling.quality === 'poor' || handling.quality === 'adequate' ? 'needs_improvement' : 'good',
            { 
              handlingQuality: handling.quality || undefined,
              resolutionSignals: handling.resolutionSignals
            }
          )
        }
        
        // Check if objection is fully resolved
        if (handling.isResolved && !isResolved) {
          objectionResolvedRef.current.set(objectionKey, true)
          
          let message = 'Objection resolved! '
          if (handling.resolutionSignals && handling.resolutionSignals.length > 0) {
            message += handling.resolutionSignals.join(', ')
          } else {
            message += 'Homeowner accepted the solution.'
          }
          
          addFeedbackItem(
            'objection_handling',
            message,
            'good',
            { 
              handlingQuality: handling.quality || undefined,
              isResolved: true,
              resolutionSignals: handling.resolutionSignals
            }
          )
        }
        
        // Check if handling quality is poor
        if (handling.quality === 'poor' && !objectionHandledRef.current.get(objectionKey)) {
          const message = generateConciseFeedback('objection_handling', {
            quality: handling.quality,
            wasHandled: false
          })
          
          addFeedbackItem(
            'objection_handling',
            message,
            'needs_improvement',
            { handlingQuality: handling.quality || undefined }
          )
        }
      }
    })
  }, [transcript, addFeedbackItem])
  
  // Re-objection detection - check if homeowner raises same objection again
  useEffect(() => {
    if (transcript.length <= previousTranscriptLengthRef.current) {
      return
    }
    
    const newEntries = transcript.slice(previousTranscriptLengthRef.current)
    
    newEntries.forEach((entry, relativeIndex) => {
      if (entry.speaker === 'homeowner') {
        const entryIndex = previousTranscriptLengthRef.current + relativeIndex
        const objection = detectEnhancedObjection(entry.text, transcript, entryIndex)
        
        if (objection) {
          // Check if we've seen this objection type before
          objectionIndicesRef.current.forEach((previousIndex, objectionKey) => {
            const previousType = objectionTypesRef.current.get(objectionKey)
            const wasResolved = objectionResolvedRef.current.get(objectionKey)
            
            // Same objection type and it was previously handled/resolved
            if (previousType === objection.type && (objectionHandledRef.current.get(objectionKey) || wasResolved)) {
              // Check if this is a re-objection (not the same entry)
              if (previousIndex !== entryIndex && entryIndex > previousIndex + 2) {
                // Re-objection detected - mark previous as not resolved
                objectionResolvedRef.current.set(objectionKey, false)
                objectionHandledRef.current.set(objectionKey, false)
                
                // Add back to unhandled if not already there
                if (!unhandledObjectionIndicesRef.current.includes(previousIndex)) {
                  unhandledObjectionIndicesRef.current.push(previousIndex)
                }
                
                // Map objection type for backward compatibility
                const mappedObjectionType = objection.type === 'timing' ? 'time' : objection.type
                
                addFeedbackItem(
                  'objection_detected',
                  `Re-objection: ${objection.type} concern raised again - previous resolution may not have been effective`,
                  'needs_improvement',
                  {
                    objectionType: mappedObjectionType as any,
                    isReObjection: true,
                    previousObjectionIndex: previousIndex
                  }
                )
              }
            }
          })
        }
      }
    })
  }, [transcript, addFeedbackItem])
  
  // Calculate metrics
  const metrics = useMemo((): LiveSessionMetrics => {
    const talkTimeRatio = calculateTalkTimeRatio(transcript)
    
    // Calculate WPM
    const currentTime = new Date()
    const wordsPerMinute = calculateWPMFromTranscript(
      transcript,
      sessionStartTimeRef.current,
      currentTime
    )
    
    console.log('📊 Calculating metrics for transcript length:', transcript.length)
    
    // Count objections
    const homeownerEntries = transcript.filter(entry => entry.speaker === 'homeowner')
    console.log('🏠 Homeowner entries:', homeownerEntries.length)
    
    const objectionCount = homeownerEntries
      .filter(entry => {
        const hasObjection = detectObjection(entry.text) !== null
        if (hasObjection) {
          console.log('✅ Objection detected in:', entry.text.substring(0, 50))
        }
        return hasObjection
      })
      .length
    
    // Collect unique techniques used
    const userEntries = transcript.filter(entry => entry.speaker === 'user')
    console.log('👤 User entries:', userEntries.length)
    
    const techniquesSet = new Set<string>()
    userEntries.forEach(entry => {
      const technique = detectTechnique(entry.text)
      if (technique) {
        console.log('✅ Technique detected:', technique, 'in:', entry.text.substring(0, 50))
        techniquesSet.add(technique)
      }
    })
    
    const metricsResult = {
      talkTimeRatio,
      wordsPerMinute,
      objectionCount,
      techniquesUsed: Array.from(techniquesSet)
    }
    
    console.log('📊 Final metrics:', metricsResult)
    
    return metricsResult
  }, [transcript])
  
  // Check talk time ratio and provide feedback
  useEffect(() => {
    if (transcript.length < 3) return // Need at least a few exchanges
    
    const ratio = metrics.talkTimeRatio
    const now = new Date()
    
    // New thresholds:
    // 20-80%: Acceptable range (no feedback)
    // <20%: Warning "Try to listen more and engage"
    // >80%: Warning "Engage more - ask questions"
    
    // Only show one warning at a time - check if we need to show a new one
    if (ratio > 80) {
      // High ratio warning
      const timeSinceLastWarning = lastTalkTimeWarningRef.current.timestamp 
        ? now.getTime() - lastTalkTimeWarningRef.current.timestamp.getTime()
        : Infinity
      
      // Only show if:
      // 1. We haven't shown a high warning yet, OR
      // 2. We showed a low warning before (threshold changed), OR
      // 3. It's been more than 2 minutes since the last warning
      if (lastTalkTimeWarningRef.current.threshold !== 'high' || timeSinceLastWarning > 120000) {
        // Remove any existing talk time warnings and add new one in one operation
        setFeedbackItems(prev => {
          const filtered = prev.filter(item => 
            !(item.type === 'warning' && (item.message.includes('Talking') && item.message.includes('%')))
          )
          
          const newItem: FeedbackItem = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            timestamp: now,
            type: 'warning',
            message: `Talking ${ratio}% - ask more questions.`,
            severity: 'needs_improvement'
          }
          
          const updated = [...filtered, newItem]
          return updated.slice(-50) // Keep max 50 items
        })
        
        lastTalkTimeWarningRef.current = { threshold: 'high', timestamp: now }
      }
    } else if (ratio < 20) {
      // Low ratio warning
      const timeSinceLastWarning = lastTalkTimeWarningRef.current.timestamp 
        ? now.getTime() - lastTalkTimeWarningRef.current.timestamp.getTime()
        : Infinity
      
      // Only show if:
      // 1. We haven't shown a low warning yet, OR
      // 2. We showed a high warning before (threshold changed), OR
      // 3. It's been more than 2 minutes since the last warning
      if (lastTalkTimeWarningRef.current.threshold !== 'low' || timeSinceLastWarning > 120000) {
        // Remove any existing talk time warnings and add new one in one operation
        setFeedbackItems(prev => {
          const filtered = prev.filter(item => 
            !(item.type === 'warning' && (item.message.includes('Talking') && item.message.includes('%')))
          )
          
          const newItem: FeedbackItem = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            timestamp: now,
            type: 'warning',
            message: `Talking ${ratio}% - engage more.`,
            severity: 'needs_improvement'
          }
          
          const updated = [...filtered, newItem]
          return updated.slice(-50) // Keep max 50 items
        })
        
        lastTalkTimeWarningRef.current = { threshold: 'low', timestamp: now }
      }
    } else {
      // Ratio is in acceptable range - reset the warning ref
      lastTalkTimeWarningRef.current = { threshold: null, timestamp: null }
    }
  }, [metrics.talkTimeRatio, transcript.length, setFeedbackItems])
  
  return {
    feedbackItems,
    metrics
  }
}

