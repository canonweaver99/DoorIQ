import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { TranscriptEntry } from '../lib/types'
import { FeedbackItem } from '../components/trainer/LiveFeedbackFeed'

export interface LiveSessionMetrics {
  talkTimeRatio: number
  objectionCount: number
  techniquesUsed: string[]
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
  activeListening: [
    'i hear you', 'i understand', 'that makes sense', 'i see',
    'got it', 'i get that', 'absolutely', 'you\'re right',
    'i can see why', 'that\'s understandable'
  ]
}

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

function detectTechnique(text: string): string | null {
  const lowerText = text.toLowerCase()
  
  // Check for open-ended questions
  if (/^(what|how|why|when|where|tell me|can you explain)/i.test(text.trim())) {
    return 'Open-Ended Question'
  }
  
  // Check other techniques
  for (const [technique, patterns] of Object.entries(TECHNIQUE_PATTERNS)) {
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

function calculateTalkTimeRatio(transcript: TranscriptEntry[]): number {
  if (transcript.length === 0) return 50
  
  let userCharCount = 0
  let homeownerCharCount = 0
  
  transcript.forEach(entry => {
    const charCount = entry.text.length
    if (entry.speaker === 'user') {
      userCharCount += charCount
    } else if (entry.speaker === 'homeowner') {
      homeownerCharCount += charCount
    }
  })
  
  const totalChars = userCharCount + homeownerCharCount
  if (totalChars === 0) return 50
  
  const userPercentage = Math.round((userCharCount / totalChars) * 100)
  return userPercentage
}

export function useLiveSessionAnalysis(transcript: TranscriptEntry[]) {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([])
  const previousTranscriptLengthRef = useRef(0)
  const objectionTimestampsRef = useRef<Map<string, Date>>(new Map())
  const objectionHandledRef = useRef<Map<string, boolean>>(new Map())
  const recentEntriesRef = useRef<TranscriptEntry[]>([])
  const sessionStartTimeRef = useRef<Date | null>(null)
  
  const addFeedbackItem = useCallback((
    type: string,
    message: string,
    severity: 'good' | 'neutral' | 'needs_improvement'
  ) => {
    const newItem: FeedbackItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
      type,
      message,
      severity,
    }
    
    setFeedbackItems(prev => {
      const updated = [...prev, newItem]
      return updated.slice(-50) // Keep max 50 items
    })
  }, [])
  
  useEffect(() => {
    if (transcript.length > 0 && !sessionStartTimeRef.current) {
      sessionStartTimeRef.current = transcript[0].timestamp
    }
  }, [transcript.length])

  useEffect(() => {
    if (transcript.length <= previousTranscriptLengthRef.current) {
      return
    }
    
    const newEntries = transcript.slice(previousTranscriptLengthRef.current)
    previousTranscriptLengthRef.current = transcript.length
    recentEntriesRef.current = [...recentEntriesRef.current, ...newEntries].slice(-10)
    
    newEntries.forEach(entry => {
      // Objection detection (only for homeowner)
      if (entry.speaker === 'homeowner') {
        const objection = detectObjection(entry.text)
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
              'neutral'
            )
          }
        }
      }
      
      // Technique detection (only for user/rep)
      if (entry.speaker === 'user') {
        const technique = detectTechnique(entry.text)
        if (technique) {
          addFeedbackItem(
            'technique_used',
            `Great use of ${technique} technique!`,
            'good'
          )
        }
      }
    })
  }, [transcript, addFeedbackItem])
  
  const metrics = useMemo((): LiveSessionMetrics => {
    const talkTimeRatio = calculateTalkTimeRatio(transcript)
    
    const homeownerEntries = transcript.filter(entry => entry.speaker === 'homeowner')
    const objectionCount = homeownerEntries
      .filter(entry => detectObjection(entry.text) !== null)
      .length
    
    const userEntries = transcript.filter(entry => entry.speaker === 'user')
    const techniquesSet = new Set<string>()
    userEntries.forEach(entry => {
      const technique = detectTechnique(entry.text)
      if (technique) {
        techniquesSet.add(technique)
      }
    })
    
    return {
      talkTimeRatio,
      objectionCount,
      techniquesUsed: Array.from(techniquesSet)
    }
  }, [transcript])
  
  useEffect(() => {
    if (transcript.length < 3) return
    
    const ratio = metrics.talkTimeRatio
    
    if (ratio > 70 && feedbackItems.length > 0) {
      const lastWarning = feedbackItems
        .slice()
        .reverse()
        .find(item => item.type === 'warning' && item.message.includes('Engage more'))
      
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
        .find(item => item.type === 'warning' && item.message.includes('Try to listen more'))
      
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

