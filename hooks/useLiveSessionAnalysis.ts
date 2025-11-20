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

// Calculate talk time ratio
function calculateTalkTimeRatio(transcript: TranscriptEntry[]): number {
  if (transcript.length === 0) return 50 // Default to 50% if no transcript
  
  let userCharCount = 0
  let homeownerCharCount = 0
  
  transcript.forEach(entry => {
    const charCount = entry.text.length
    if (entry.speaker === 'user') {
      userCharCount += charCount
    } else {
      homeownerCharCount += charCount
    }
  })
  
  const totalChars = userCharCount + homeownerCharCount
  if (totalChars === 0) return 50
  
  return Math.round((userCharCount / totalChars) * 100)
}

export function useLiveSessionAnalysis(transcript: TranscriptEntry[]): UseLiveSessionAnalysisReturn {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([])
  const previousTranscriptLengthRef = useRef(0)
  const objectionTimestampsRef = useRef<Map<string, Date>>(new Map())
  const lastMonologueStartRef = useRef<Date | null>(null)
  const lastMonologueSpeakerRef = useRef<'user' | 'homeowner' | null>(null)
  
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
  
  // Analyze transcript for new entries
  useEffect(() => {
    if (transcript.length <= previousTranscriptLengthRef.current) {
      return // No new entries
    }
    
    const newEntries = transcript.slice(previousTranscriptLengthRef.current)
    previousTranscriptLengthRef.current = transcript.length
    
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
            
            // Set timer to check if objection is handled within 30 seconds
            setTimeout(() => {
              const objectionTime = objectionTimestampsRef.current.get(objectionKey)
              if (objectionTime) {
                // Check if there's been a user response since objection
                const hasResponse = transcript.some(
                  t => t.speaker === 'user' && 
                  t.timestamp > objectionTime &&
                  t.timestamp.getTime() - objectionTime.getTime() < 30000
                )
                
                if (!hasResponse) {
                  addFeedbackItem(
                    'coaching_tip',
                    `Consider addressing the ${objection.type} objection. Try acknowledging their concern and offering a solution.`,
                    'needs_improvement'
                  )
                }
                
                objectionTimestampsRef.current.delete(objectionKey)
              }
            }, 30000)
          }
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

