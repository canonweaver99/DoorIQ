'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { TranscriptEntry, FeedbackItem, FeedbackType, FeedbackSeverity, LiveSessionMetrics } from '@/lib/trainer/types'

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

// Technique detection patterns
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
  ]
}

// Check if text contains objection patterns
function detectObjection(text: string): { type: 'price' | 'time' | 'authority' | 'need' } | null {
  const lowerText = text.toLowerCase()
  
  for (const [type, patterns] of Object.entries(OBJECTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        return { type: type as 'price' | 'time' | 'authority' | 'need' }
      }
    }
  }
  
  return null
}

// Check if text contains technique patterns
function detectTechnique(text: string): string | null {
  const lowerText = text.toLowerCase()
  
  // Check for open-ended questions
  if (/^(what|how|why|when|where|tell me|can you explain)/i.test(text.trim())) {
    return 'Open-Ended Question'
  }
  
  // Check other techniques
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
    return { quality: 'ignored', message: 'Objection ignored - 60+ seconds passed without acknowledgment' }
  }
  
  if (timeSinceObjection <= 30000 && hasAddressing && hasSolution) {
    return { quality: 'strong', message: 'Strong rebuttal! Objection addressed with technique and conversation moved forward.' }
  }
  
  if (timeSinceObjection <= 30000 && hasAddressing && !hasSolution) {
    return { quality: 'weak', message: 'Weak response - acknowledged objection but offered no solution' }
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
    return { type: 'trial_close', message: 'Trial close detected!' }
  }
  
  if (directClosePatterns.some(pattern => lowerText.includes(pattern))) {
    return { type: 'direct_close', message: 'Going for the close!' }
  }
  
  if (assumptivePatterns.some(pattern => lowerText.includes(pattern))) {
    return { type: 'assumptive', message: 'Assumptive language!' }
  }
  
  return null
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
  
  // Check for questions from homeowner (engagement signal)
  const questionPatterns = ['?', 'what', 'how', 'why', 'when', 'where', 'tell me', 'explain']
  const hasQuestions = recentHomeownerEntries.some(e => 
    questionPatterns.some(pattern => e.text.toLowerCase().includes(pattern))
  )
  
  // Strong recovery after objection
  if (objectionHandled && currentLength > avgLength * 1.3) {
    return { type: 'strong_recovery', message: 'Strong recovery! Successfully handled objection and regained momentum.' }
  }
  
  // Building rapport - homeowner asking questions or sharing details
  if (hasQuestions && currentLength > 30) {
    return { type: 'building_rapport', message: 'Building rapport! Homeowner is asking questions and sharing details.' }
  }
  
  // Interest growing - responses getting longer
  if (currentLength > avgLength * 1.2 && currentLength > 40) {
    return { type: 'interest_growing', message: 'Interest growing! Homeowner\'s responses getting longer and more engaged.' }
  }
  
  // Losing engagement - responses getting shorter
  if (currentLength < avgLength * 0.7 && currentLength < 20 && recentHomeownerEntries.length >= 3) {
    const dismissivePatterns = ['no', 'not interested', 'maybe later', 'i don\'t think', 'probably not']
    const isDismissive = dismissivePatterns.some(pattern => currentEntry.text.toLowerCase().includes(pattern))
    
    if (isDismissive) {
      return { type: 'losing_engagement', message: 'Losing engagement - homeowner\'s responses getting shorter or more dismissive.' }
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
    return { type: 'discovery', message: 'Great discovery question! Asking about problems/pain points.' }
  }
  
  if (qualifyingPatterns.some(pattern => lowerText.includes(pattern))) {
    return { type: 'qualifying', message: 'Good qualifying question! Determining fit and timeline.' }
  }
  
  if (closedPatterns.some(pattern => pattern.test(text.trim()))) {
    return { type: 'closed', message: 'Closed question used - consider open-ended for better discovery.' }
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
      return { type: 'too_early', message: 'Price mentioned too early! Establish value before discussing price.' }
    }
  }
  
  if (framingPatterns.some(pattern => lowerText.includes(pattern))) {
    return { type: 'great_framing', message: 'Great price framing! Positioned price in terms of value.' }
  }
  
  if (breakdownPatterns.some(pattern => lowerText.includes(pattern))) {
    return { type: 'breakdown_used', message: 'Price breakdown used! Breaking down into smaller amounts helps.' }
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

export function useLiveSessionAnalysis(transcript: TranscriptEntry[]): UseLiveSessionAnalysisReturn {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([])
  const previousTranscriptLengthRef = useRef(0)
  const objectionTimestampsRef = useRef<Map<string, Date>>(new Map())
  const objectionHandledRef = useRef<Map<string, boolean>>(new Map())
  const lastMonologueStartRef = useRef<Date | null>(null)
  const lastMonologueSpeakerRef = useRef<'user' | 'homeowner' | null>(null)
  const recentEntriesRef = useRef<TranscriptEntry[]>([])
  const closedQuestionCountRef = useRef(0)
  const sessionStartTimeRef = useRef<Date | null>(null)
  const valueStatementsCountRef = useRef(0)
  const priceQuestionAskedRef = useRef<Date | null>(null)
  
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
    
    newEntries.forEach(entry => {
      console.log('📝 Processing entry:', { speaker: entry.speaker, text: entry.text.substring(0, 50) })
      
      // Objection detection (only for homeowner)
      if (entry.speaker === 'homeowner') {
        const objection = detectObjection(entry.text)
        console.log('🏠 Homeowner entry - objection check:', objection ? objection.type : 'none')
        if (objection) {
          const objectionKey = `${objection.type}-${entry.id}`
          if (!objectionTimestampsRef.current.has(objectionKey)) {
            objectionTimestampsRef.current.set(objectionKey, entry.timestamp)
            objectionHandledRef.current.set(objectionKey, false)
            
            const objectionMessages = {
              price: 'Price objection detected: "I can\'t afford it" or similar',
              time: 'Time objection detected: "Not right now" or similar',
              authority: 'Authority objection detected: "Need to check with spouse" or similar',
              need: 'Need objection detected: "Don\'t need it" or similar'
            }
            
            addFeedbackItem(
              'objection_detected',
              objectionMessages[objection.type],
              'neutral',
              { objectionType: objection.type }
            )
            
            // Check for objection handling after 30 seconds
            setTimeout(() => {
              const objectionTime = objectionTimestampsRef.current.get(objectionKey)
              if (objectionTime) {
                // Check if there's been a user response since objection
                const userResponses = transcript.filter(
                  t => t.speaker === 'user' && 
                  t.timestamp > objectionTime &&
                  t.timestamp.getTime() - objectionTime.getTime() < 30000
                )
                
                if (userResponses.length === 0) {
                  addFeedbackItem(
                    'objection_handling',
                    'Objection ignored - 60+ seconds passed without acknowledgment',
                    'needs_improvement',
                    {}
                  )
                } else {
                  // Check handling quality
                  const lastResponse = userResponses[userResponses.length - 1]
                  const handling = detectObjectionHandling(lastResponse.text, objectionTime, lastResponse.timestamp)
                  
                  if (handling) {
                    if (handling.quality === 'strong') {
                      objectionHandledRef.current.set(objectionKey, true)
                      addFeedbackItem(
                        'objection_handling',
                        handling.message,
                        'good',
                        {}
                      )
                    } else if (handling.quality === 'weak') {
                      addFeedbackItem(
                        'objection_handling',
                        handling.message,
                        'needs_improvement',
                        {}
                      )
                    }
                  }
                }
                
                // Check again after 60 seconds for ignored
                setTimeout(() => {
                  if (!objectionHandledRef.current.get(objectionKey)) {
                    addFeedbackItem(
                      'objection_handling',
                      'Objection ignored - 60+ seconds passed without acknowledgment',
                      'needs_improvement',
                      {}
                    )
                  }
                  objectionTimestampsRef.current.delete(objectionKey)
                  objectionHandledRef.current.delete(objectionKey)
                }, 30000) // Additional 30 seconds = 60 total
              }
            }, 30000)
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
        
        // Track value statements for price handling
        const valuePatterns = ['value', 'benefit', 'saves', 'protects', 'helps', 'improves', 'solves']
        if (valuePatterns.some(pattern => entry.text.toLowerCase().includes(pattern))) {
          valueStatementsCountRef.current++
        }
        
        // Detect closing behaviors
        const closing = detectClosingBehavior(entry.text)
        if (closing) {
          addFeedbackItem(
            'closing_behavior',
            closing.message,
            'good',
            { closingType: closing.type }
          )
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
              'You\'ve been talking for a while. Consider asking an open-ended question to engage the homeowner.',
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
      
      // Detect buying signals from homeowner
      if (entry.speaker === 'homeowner') {
        const buyingSignals = [
          'when can you', 'how soon', 'how much', 'what\'s included',
          'warranty', 'guarantee', 'install', 'schedule', 'available'
        ]
        const lowerText = entry.text.toLowerCase()
        if (buyingSignals.some(signal => lowerText.includes(signal))) {
          addFeedbackItem(
            'coaching_tip',
            'Buying signal detected! The homeowner is showing interest. Consider moving toward closing.',
            'good'
          )
        }
      }
    })
  }, [transcript, addFeedbackItem])
  
  // Calculate metrics
  const metrics = useMemo((): LiveSessionMetrics => {
    const talkTimeRatio = calculateTalkTimeRatio(transcript)
    
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
    
    // New thresholds:
    // 40-60%: Ideal (no feedback)
    // 35-40% or 60-70%: OK (no feedback)
    // <35%: Warning "Try to listen more and engage"
    // >70%: Warning "Engage more - ask questions"
    
    // Only add feedback if ratio is problematic (avoid spam)
    if (ratio > 70 && feedbackItems.length > 0) {
      const lastWarning = feedbackItems
        .slice()
        .reverse()
        .find(item => item.type === 'warning' && (item.message.includes('Engage more') || item.message.includes('talking too much')))
      
      if (!lastWarning || Date.now() - lastWarning.timestamp.getTime() > 60000) {
        addFeedbackItem(
          'warning',
          `You're talking ${ratio}% of the time. Engage more - ask questions to involve the homeowner.`,
          'needs_improvement'
        )
      }
    } else if (ratio < 35 && feedbackItems.length > 0) {
      const lastWarning = feedbackItems
        .slice()
        .reverse()
        .find(item => item.type === 'warning' && (item.message.includes('Try to listen more') || item.message.includes('talking too little')))
      
      if (!lastWarning || Date.now() - lastWarning.timestamp.getTime() > 60000) {
        addFeedbackItem(
          'warning',
          `You're only talking ${ratio}% of the time. Try to listen more and engage in the conversation.`,
          'needs_improvement'
        )
      }
    }
  }, [metrics.talkTimeRatio, transcript.length, feedbackItems, addFeedbackItem])
  
  return {
    feedbackItems,
    metrics
  }
}

