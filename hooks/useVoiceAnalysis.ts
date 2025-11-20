'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { FeedbackItem, FeedbackType, FeedbackSeverity } from '@/lib/trainer/types'
import { VoiceMetrics } from '@/lib/trainer/types'

interface UseVoiceAnalysisOptions {
  enabled?: boolean
  analysisInterval?: number // ms
}

interface UseVoiceAnalysisReturn {
  metrics: VoiceMetrics
  feedbackItems: FeedbackItem[]
  isAnalyzing: boolean
  error: string | null
}

// Pitch detection using autocorrelation
function detectPitch(buffer: Float32Array, sampleRate: number): number {
  const minPeriod = Math.floor(sampleRate / 300) // Max pitch ~300Hz
  const maxPeriod = Math.floor(sampleRate / 80) // Min pitch ~80Hz
  
  let maxCorrelation = 0
  let bestPeriod = 0
  
  // Autocorrelation
  for (let period = minPeriod; period < maxPeriod && period < buffer.length / 2; period++) {
    let correlation = 0
    for (let i = 0; i < buffer.length - period; i++) {
      correlation += buffer[i] * buffer[i + period]
    }
    
    if (correlation > maxCorrelation) {
      maxCorrelation = correlation
      bestPeriod = period
    }
  }
  
  if (bestPeriod === 0) return 0
  return sampleRate / bestPeriod
}

// Calculate RMS volume
function calculateVolume(buffer: Float32Array): number {
  let sumSquares = 0
  for (let i = 0; i < buffer.length; i++) {
    sumSquares += buffer[i] * buffer[i]
  }
  const rms = Math.sqrt(sumSquares / buffer.length)
  // Convert to dB, clamp to reasonable range
  const dB = 20 * Math.log10(rms + 1e-10) // Add small epsilon to avoid log(0)
  return Math.max(-60, Math.min(0, dB))
}

// Estimate speech rate (simplified - detects speech activity)
function estimateSpeechRate(
  volumeHistory: number[],
  timeWindow: number,
  volumeThreshold: number = -40
): number {
  // Count samples above threshold (speech activity)
  const activeSamples = volumeHistory.filter(v => v > volumeThreshold).length
  const activityRatio = activeSamples / volumeHistory.length
  
  // Rough estimate: average person speaks ~150 WPM, adjust by activity ratio
  // This is a simplified estimation - real WPM would require word detection
  const baseWPM = 150
  return Math.round(baseWPM * activityRatio * 1.2) // Adjust multiplier based on testing
}

// Calculate pitch variation percentage
function calculatePitchVariation(pitchHistory: number[]): number {
  if (pitchHistory.length < 2) return 0
  
  const validPitches = pitchHistory.filter(p => p > 0)
  if (validPitches.length < 2) return 0
  
  const mean = validPitches.reduce((a, b) => a + b, 0) / validPitches.length
  const variance = validPitches.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / validPitches.length
  const stdDev = Math.sqrt(variance)
  
  // Return coefficient of variation as percentage
  return mean > 0 ? Math.round((stdDev / mean) * 100) : 0
}

export function useVoiceAnalysis(options: UseVoiceAnalysisOptions = {}): UseVoiceAnalysisReturn {
  const { enabled = false, analysisInterval = 100 } = options
  
  const [metrics, setMetrics] = useState<VoiceMetrics>({
    currentPitch: 0,
    averagePitch: 0,
    volume: -60,
    speechRate: 0,
    pitchVariation: 0,
  })
  
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // History buffers for calculations
  const pitchHistoryRef = useRef<number[]>([])
  const volumeHistoryRef = useRef<number[]>([])
  const speechActivityRef = useRef<{ start: number; end: number }[]>([])
  const lastFeedbackTimeRef = useRef<Map<string, number>>(new Map())
  
  // Smoothing for pitch
  const pitchSmoothingRef = useRef<number>(0)
  const SMOOTHING_FACTOR = 0.7
  
  const addFeedbackItem = useCallback((
    type: FeedbackType,
    message: string,
    severity: FeedbackSeverity,
    cooldownMs: number = 10000
  ) => {
    const now = Date.now()
    const lastTime = lastFeedbackTimeRef.current.get(message) || 0
    
    // Cooldown to prevent spam
    if (now - lastTime < cooldownMs) return
    
    lastFeedbackTimeRef.current.set(message, now)
    
    const newItem: FeedbackItem = {
      id: `voice-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
      type,
      message,
      severity,
    }
    
    setFeedbackItems(prev => {
      const updated = [...prev, newItem]
      // Keep max 20 voice feedback items
      return updated.slice(-20)
    })
  }, [])
  
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return
    
    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Float32Array(bufferLength)
    analyser.getFloatTimeDomainData(dataArray)
    
    // Calculate volume
    const volume = calculateVolume(dataArray)
    volumeHistoryRef.current.push(volume)
    if (volumeHistoryRef.current.length > 50) {
      volumeHistoryRef.current.shift()
    }
    
    // Detect pitch only if volume is above threshold (speech detected)
    let pitch = 0
    if (volume > -50) {
      const sampleRate = audioContextRef.current?.sampleRate || 44100
      pitch = detectPitch(dataArray, sampleRate)
      
      // Smooth pitch
      if (pitch > 0) {
        pitchSmoothingRef.current = pitchSmoothingRef.current === 0
          ? pitch
          : pitchSmoothingRef.current * SMOOTHING_FACTOR + pitch * (1 - SMOOTHING_FACTOR)
        pitch = pitchSmoothingRef.current
      }
      
      pitchHistoryRef.current.push(pitch)
      if (pitchHistoryRef.current.length > 50) {
        pitchHistoryRef.current.shift()
      }
    }
    
    // Calculate metrics
    const validPitches = pitchHistoryRef.current.filter(p => p > 0)
    const averagePitch = validPitches.length > 0
      ? validPitches.reduce((a, b) => a + b, 0) / validPitches.length
      : 0
    
    const pitchVariation = calculatePitchVariation(pitchHistoryRef.current)
    
    // Estimate speech rate over last 5 seconds
    const speechRate = estimateSpeechRate(
      volumeHistoryRef.current.slice(-50),
      5000,
      -40
    )
    
    // Update metrics
    setMetrics({
      currentPitch: Math.round(pitch),
      averagePitch: Math.round(averagePitch),
      volume: Math.round(volume),
      speechRate,
      pitchVariation,
    })
    
    // Generate feedback
    // Pitch feedback
    if (pitch > 0 && volume > -50) {
      // Check if pitch is too monotone
      if (pitchVariation < 15 && volumeHistoryRef.current.length > 20) {
        addFeedbackItem(
          'voice_coaching',
          'Try varying your pitch more - you\'re sounding a bit monotone',
          'needs_improvement',
          15000
        )
      }
      
      // Check if pitch is too high (nervous indicator)
      if (pitch > 255) {
        addFeedbackItem(
          'voice_coaching',
          'Your pitch is quite high - try to relax and lower your voice slightly',
          'needs_improvement',
          20000
        )
      }
      
      // Check if pitch is too low
      if (pitch < 85 && pitch > 0) {
        addFeedbackItem(
          'voice_coaching',
          'Your voice is quite low - try speaking with more energy',
          'needs_improvement',
          20000
        )
      }
      
      // Positive feedback for good pitch variation
      if (pitchVariation >= 15 && pitchVariation <= 30 && volumeHistoryRef.current.length > 20) {
        addFeedbackItem(
          'voice_coaching',
          'Great pitch variation! Your voice sounds engaging.',
          'good',
          30000
        )
      }
    }
    
    // Volume feedback
    if (volume < -30 && volume > -60) {
      addFeedbackItem(
        'voice_coaching',
        'Speak up! Your volume is too low.',
        'needs_improvement',
        15000
      )
    } else if (volume > -10) {
      addFeedbackItem(
        'voice_coaching',
        'Your volume is quite loud - consider speaking a bit softer',
        'needs_improvement',
        15000
      )
    } else if (volume >= -30 && volume <= -10) {
      addFeedbackItem(
        'voice_coaching',
        'Great energy! Your voice sounds confident.',
        'good',
        30000
      )
    }
    
    // Speech rate feedback
    if (speechRate > 180 && volumeHistoryRef.current.length > 30) {
      addFeedbackItem(
        'voice_coaching',
        `Slow down - you're speaking too fast (${speechRate} WPM)`,
        'needs_improvement',
        20000
      )
    } else if (speechRate < 120 && speechRate > 0 && volumeHistoryRef.current.length > 30) {
      addFeedbackItem(
        'voice_coaching',
        `Speed up slightly - you're speaking too slowly (${speechRate} WPM)`,
        'needs_improvement',
        20000
      )
    } else if (speechRate >= 140 && speechRate <= 160 && volumeHistoryRef.current.length > 30) {
      addFeedbackItem(
        'voice_coaching',
        'Perfect pace! Your speech rate is ideal for sales.',
        'good',
        30000
      )
    }
  }, [addFeedbackItem])
  
  const startAnalysis = useCallback(async () => {
    if (isAnalyzing) return
    
    try {
      setError(null)
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext
      
      // Create analyser node
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.8
      analyserRef.current = analyser
      
      // Connect microphone to analyser
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      
      setIsAnalyzing(true)
      
      // Start analysis loop
      const runAnalysis = () => {
        analyzeAudio()
        analysisIntervalRef.current = setTimeout(runAnalysis, analysisInterval)
      }
      runAnalysis()
      
    } catch (err: any) {
      console.error('Error starting voice analysis:', err)
      setError(err.message || 'Failed to access microphone')
      setIsAnalyzing(false)
    }
  }, [isAnalyzing, analyzeAudio, analysisInterval])
  
  const stopAnalysis = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearTimeout(analysisIntervalRef.current)
      analysisIntervalRef.current = null
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error)
      audioContextRef.current = null
    }
    
    analyserRef.current = null
    setIsAnalyzing(false)
    
    // Reset metrics
    setMetrics({
      currentPitch: 0,
      averagePitch: 0,
      volume: -60,
      speechRate: 0,
      pitchVariation: 0,
    })
    
    // Clear history
    pitchHistoryRef.current = []
    volumeHistoryRef.current = []
    speechActivityRef.current = []
  }, [])
  
  // Start/stop analysis based on enabled prop
  useEffect(() => {
    if (enabled && !isAnalyzing) {
      startAnalysis()
    } else if (!enabled && isAnalyzing) {
      stopAnalysis()
    }
    
    return () => {
      if (!enabled) {
        stopAnalysis()
      }
    }
  }, [enabled, isAnalyzing, startAnalysis, stopAnalysis])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnalysis()
    }
  }, [stopAnalysis])
  
  return {
    metrics,
    feedbackItems,
    isAnalyzing,
    error,
  }
}

