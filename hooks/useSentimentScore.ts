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
  elevenLabsSentiment: number // 0-100 from ElevenLabs sentiment_progression
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

// Buying signal patterns (from enhancedPatternAnalyzer)
const BUYING_SIGNAL_PATTERNS = [
  /sounds good/i,
  /that works/i,
  /I'm interested/i,
  /let's do it/i,
  /count me in/i,
  /I'm ready/i,
  /when can you start/i,
  /what's next/i,
  /how do I sign up/i,
  /that makes sense/i,
  /I like that/i,
  /we need that/i,
  /definitely need/i,
  /that's reasonable/i,
  /I can do that/i,
  /I'm okay with that/i,
  /what's included/i,
  /how does it work/i,
  /when can we start/i,
  /coming back (tomorrow|today|at|on)/i,
  /I'll see you/i,
  /see you (tomorrow|then|at)/i,
  /I'll be here/i,
  /I'll be ready/i
]

// Positive language patterns
const POSITIVE_LANGUAGE_PATTERNS = [
  /that's great/i,
  /that's good/i,
  /I understand/i,
  /I see/i,
  /that makes sense/i,
  /you're right/i,
  /fair enough/i,
  /I hear you/i,
  /good point/i,
  /tell me more/i,
  /interesting/i,
  /that's helpful/i,
  /good to know/i,
  /I like that/i,
  /that sounds/i
]

// Negative language patterns
const NEGATIVE_LANGUAGE_PATTERNS = [
  /not interested/i,
  /don't want/i,
  /can't afford/i,
  /too expensive/i,
  /no thanks/i,
  /not for me/i,
  /don't need/i,
  /maybe later/i,
  /I'll think about it/i,
  /not right now/i
]

// Calculate buying signals score from transcript
function calculateBuyingSignalsScore(transcript: TranscriptEntry[]): number {
  if (!transcript || transcript.length === 0) return 0

  const homeownerEntries = transcript.filter(e => e.speaker === 'homeowner')
  if (homeownerEntries.length === 0) return 0

  let signalCount = 0
  homeownerEntries.forEach(entry => {
    BUYING_SIGNAL_PATTERNS.forEach(pattern => {
      if (pattern.test(entry.text)) {
        signalCount++
      }
    })
  })

  // Each buying signal adds 15 points, max 100
  return Math.min(100, signalCount * 15)
}

// Calculate positive language score
function calculatePositiveLanguageScore(transcript: TranscriptEntry[]): number {
  if (!transcript || transcript.length === 0) return 0

  const homeownerEntries = transcript.filter(e => e.speaker === 'homeowner')
  if (homeownerEntries.length === 0) return 0

  let positiveCount = 0
  let negativeCount = 0

  homeownerEntries.forEach(entry => {
    POSITIVE_LANGUAGE_PATTERNS.forEach(pattern => {
      if (pattern.test(entry.text)) {
        positiveCount++
      }
    })
    NEGATIVE_LANGUAGE_PATTERNS.forEach(pattern => {
      if (pattern.test(entry.text)) {
        negativeCount++
      }
    })
  })

  // Calculate ratio: positive / (positive + negative)
  const total = positiveCount + negativeCount
  if (total === 0) return 50 // Neutral if no patterns detected

  const ratio = positiveCount / total
  return Math.round(ratio * 100)
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

// Get latest ElevenLabs sentiment from progression array
function getLatestSentiment(sentimentProgression: number[]): number {
  if (!sentimentProgression || sentimentProgression.length === 0) return 0
  
  // ElevenLabs sentiment_progression is typically 0-1 scale, convert to 0-100
  const latest = sentimentProgression[sentimentProgression.length - 1]
  
  // If already 0-100 scale, return as-is
  if (latest > 1) return Math.min(100, Math.max(0, latest))
  
  // Convert 0-1 scale to 0-100
  return Math.round(latest * 100)
}

  // Calculate sentiment score with progression (starts low, builds over time)
function calculateSentimentScore(
  elevenLabsSentiment: number,
  buyingSignals: number,
  objectionResolution: number,
  positiveLanguage: number,
  sessionDurationSeconds: number,
  startingSentiment: number = 5
): number {
  // Base score from factors (weighted)
  // ElevenLabs: 40%, Buying Signals: 30%, Objection Resolution: 20%, Positive Language: 10%
  const baseScore = 
    (elevenLabsSentiment * 0.40) +
    (buyingSignals * 0.30) +
    (objectionResolution * 0.20) +
    (positiveLanguage * 0.10)

  // Apply time progression: starts at agent's baseline, builds over time
  // First 30 seconds: startingSentiment to startingSentiment + 20% of base score
  // 30-120 seconds: startingSentiment + 20% to startingSentiment + 60% of base score
  // 120+ seconds: startingSentiment + 60% to startingSentiment + 100% of base score
  let timeMultiplier = 0.2 // Start at 20% of base score above starting sentiment
  
  if (sessionDurationSeconds > 120) {
    timeMultiplier = 0.6 + (Math.min(1, (sessionDurationSeconds - 120) / 180) * 0.4) // 60-100% after 2 minutes
  } else if (sessionDurationSeconds > 30) {
    timeMultiplier = 0.2 + ((sessionDurationSeconds - 30) / 90 * 0.4) // 20-60% between 30s-2min
  } else {
    timeMultiplier = (sessionDurationSeconds / 30) * 0.2 // 0-20% in first 30 seconds
  }

  // Calculate score: starting sentiment + (base score * time multiplier)
  const progressionScore = baseScore * timeMultiplier
  const finalScore = startingSentiment + progressionScore

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
    elevenLabsSentiment: 0,
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
  const SMOOTHING_ALPHA = 0.7 // Exponential smoothing factor

  // Update session start time if provided
  useEffect(() => {
    if (sessionStartTime) {
      sessionStartTimeRef.current = sessionStartTime
    }
  }, [sessionStartTime])

  // Fetch ElevenLabs sentiment_progression from session
  const fetchElevenLabsSentiment = useCallback(async (): Promise<number> => {
    if (!sessionId) return 0

    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('live_sessions')
        .select('elevenlabs_metrics')
        .eq('id', sessionId)
        .single()

      if (fetchError || !data) {
        return 0
      }

      const metrics = data.elevenlabs_metrics as any
      const sentimentProgression = metrics?.sentiment_progression || []

      return getLatestSentiment(sentimentProgression)
    } catch (err) {
      console.error('Error fetching ElevenLabs sentiment:', err)
      return 0
    }
  }, [sessionId])

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

      // Fetch ElevenLabs sentiment
      const elevenLabsSentiment = await fetchElevenLabsSentiment()

      // Calculate transcript-based factors
      const buyingSignals = calculateBuyingSignalsScore(transcript)
      const objectionResolution = calculateObjectionResolutionScore(transcript)
      const positiveLanguage = calculatePositiveLanguageScore(transcript)

      // Calculate final sentiment score
      const rawScore = calculateSentimentScore(
        elevenLabsSentiment,
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
        elevenLabsSentiment,
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
  }, [enabled, transcript, fetchElevenLabsSentiment, onScoreUpdate])

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

