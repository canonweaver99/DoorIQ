'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { VoiceMetrics, VoiceAnalysisData, TranscriptEntry } from '@/lib/trainer/types'

interface UseVoiceAnalysisOptions {
  enabled?: boolean
  analysisInterval?: number // ms
  sessionId?: string | null
  transcript?: TranscriptEntry[]
  sessionStartTime?: number // timestamp when session started
}

interface UseVoiceAnalysisReturn {
  metrics: VoiceMetrics
  feedbackItems: [] // Empty array - no feedback during live session
  isAnalyzing: boolean
  error: string | null
  voiceAnalysisData: VoiceAnalysisData | null
  getVoiceAnalysisData: () => VoiceAnalysisData | null
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

// Calculate volume consistency (coefficient of variation)
function calculateVolumeConsistency(volumeHistory: number[]): number {
  if (volumeHistory.length < 2) return 0
  
  const mean = volumeHistory.reduce((a, b) => a + b, 0) / volumeHistory.length
  const variance = volumeHistory.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / volumeHistory.length
  const stdDev = Math.sqrt(variance)
  
  return mean !== 0 ? Math.abs((stdDev / mean) * 100) : 0
}

// Calculate WPM from transcript entries
function calculateWPMFromTranscript(
  transcript: TranscriptEntry[],
  sessionStartTime: number,
  currentTime: number
): number {
  if (!transcript || transcript.length === 0) return 0
  
  // Filter to only user/rep entries
  const repEntries = transcript.filter(entry => entry.speaker === 'user')
  if (repEntries.length === 0) return 0
  
  // Count total words
  const totalWords = repEntries.reduce((sum, entry) => {
    return sum + (entry.text?.split(/\s+/).filter(w => w.length > 0).length || 0)
  }, 0)
  
  // Calculate duration in minutes
  const durationMinutes = Math.max(1, (currentTime - sessionStartTime) / 60000)
  
  return Math.round(totalWords / durationMinutes)
}

// Detect filler words in text
function detectFillerWords(text: string): number {
  // Only count: um, uh, uhh, erm, err, hmm (NOT "like")
  const fillerPattern = /\b(um|uhh?|uh|erm|err|hmm)\b/gi
  const matches = text.match(fillerPattern)
  return matches ? matches.length : 0
}

// Detect pauses >2 seconds between transcript entries
function detectLongPauses(transcript: TranscriptEntry[]): number {
  if (transcript.length < 2) return 0
  
  let pauseCount = 0
  for (let i = 1; i < transcript.length; i++) {
    const prev = transcript[i - 1]
    const curr = transcript[i]
    
    // Only check pauses between user entries (rep speaking)
    if (prev.speaker === 'user' && curr.speaker === 'user') {
      try {
        const prevTime = prev.timestamp instanceof Date 
          ? prev.timestamp.getTime() 
          : typeof prev.timestamp === 'string' 
            ? new Date(prev.timestamp).getTime()
            : Date.now()
        const currTime = curr.timestamp instanceof Date 
          ? curr.timestamp.getTime() 
          : typeof curr.timestamp === 'string'
            ? new Date(curr.timestamp).getTime()
            : Date.now()
        const pauseDuration = currTime - prevTime
        
        if (pauseDuration > 2000) { // >2 seconds
          pauseCount++
        }
      } catch (e) {
        // Skip if timestamp parsing fails
        continue
      }
    }
  }
  
  return pauseCount
}

export function useVoiceAnalysis(options: UseVoiceAnalysisOptions = {}): UseVoiceAnalysisReturn {
  const { enabled = false, analysisInterval = 100, sessionId = null, transcript = [], sessionStartTime } = options
  
  const [metrics, setMetrics] = useState<VoiceMetrics>({
    currentPitch: 0,
    averagePitch: 0,
    volume: -60,
    speechRate: 0,
    pitchVariation: 0,
  })
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // History buffers for calculations
  const pitchHistoryRef = useRef<number[]>([])
  const volumeHistoryRef = useRef<number[]>([])
  
  // Timeline data (stored every 500ms)
  const pitchTimelineRef = useRef<{ time: number; value: number }[]>([])
  const volumeTimelineRef = useRef<{ time: number; value: number }[]>([])
  const wpmTimelineRef = useRef<{ time: number; value: number }[]>([])
  
  // Session tracking
  const sessionStartTimeRef = useRef<number>(sessionStartTime || Date.now())
  const lastTimelineUpdateRef = useRef<number>(0)
  const TIMELINE_INTERVAL = 500 // Update timeline every 500ms
  
  // Smoothing for pitch
  const pitchSmoothingRef = useRef<number>(0)
  const SMOOTHING_FACTOR = 0.7
  
  // Update session start time if provided
  useEffect(() => {
    if (sessionStartTime) {
      sessionStartTimeRef.current = sessionStartTime
    }
  }, [sessionStartTime])
  
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return
    
    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Float32Array(bufferLength)
    analyser.getFloatTimeDomainData(dataArray)
    
    const currentTime = Date.now()
    const sessionElapsed = currentTime - sessionStartTimeRef.current
    
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
    
    // Update timeline data every 500ms
    if (currentTime - lastTimelineUpdateRef.current >= TIMELINE_INTERVAL) {
      const timeSeconds = sessionElapsed / 1000
      
      if (pitch > 0) {
        pitchTimelineRef.current.push({ time: timeSeconds, value: pitch })
      }
      volumeTimelineRef.current.push({ time: timeSeconds, value: volume })
      
      // Calculate WPM from transcript
      const wpm = calculateWPMFromTranscript(transcript, sessionStartTimeRef.current, currentTime)
      wpmTimelineRef.current.push({ time: timeSeconds, value: wpm })
      
      lastTimelineUpdateRef.current = currentTime
    }
    
    // Calculate metrics
    const validPitches = pitchHistoryRef.current.filter(p => p > 0)
    const averagePitch = validPitches.length > 0
      ? validPitches.reduce((a, b) => a + b, 0) / validPitches.length
      : 0
    
    const pitchVariation = calculatePitchVariation(pitchHistoryRef.current)
    
    // Calculate WPM from transcript
    const wpm = calculateWPMFromTranscript(transcript, sessionStartTimeRef.current, currentTime)
    
    // Update metrics (for LiveMetricsPanel display)
    setMetrics({
      currentPitch: Math.round(pitch),
      averagePitch: Math.round(averagePitch),
      volume: Math.round(volume),
      speechRate: wpm,
      pitchVariation,
    })
  }, [transcript])
  
  const getVoiceAnalysisData = useCallback((): VoiceAnalysisData | null => {
    if (!sessionId) {
      console.log('🎤 getVoiceAnalysisData: No sessionId')
      return null
    }
    
    // Calculate WPM from transcript (always available if we have transcript)
    const currentTime = Date.now()
    const avgWPM = calculateWPMFromTranscript(transcript, sessionStartTimeRef.current, currentTime)
    
    // Count filler words from transcript
    const repEntries = transcript.filter(entry => entry.speaker === 'user')
    const totalFillerWords = repEntries.reduce((sum, entry) => {
      return sum + detectFillerWords(entry.text || '')
    }, 0)
    
    const durationMinutes = Math.max(1, (currentTime - sessionStartTimeRef.current) / 60000)
    const fillerWordsPerMinute = totalFillerWords / durationMinutes
    
    // Detect long pauses
    const longPausesCount = detectLongPauses(transcript)
    
    // Check if we have pitch/volume data from audio analysis
    const hasPitchData = pitchHistoryRef.current.length > 0
    const validPitches = hasPitchData ? pitchHistoryRef.current.filter(p => p > 0) : []
    const hasValidPitches = validPitches.length > 0
    
    // Calculate pitch metrics if available
    let avgPitch = 0
    let minPitch = 0
    let maxPitch = 0
    let pitchVariation = 0
    let avgVolume = -60
    let volumeConsistency = 0
    let monotonePeriods = 0
    
    if (hasValidPitches) {
      avgPitch = validPitches.reduce((a, b) => a + b, 0) / validPitches.length
      minPitch = Math.min(...validPitches)
      maxPitch = Math.max(...validPitches)
      pitchVariation = calculatePitchVariation(pitchHistoryRef.current)
      
      if (volumeHistoryRef.current.length > 0) {
        avgVolume = volumeHistoryRef.current.reduce((a, b) => a + b, 0) / volumeHistoryRef.current.length
        volumeConsistency = calculateVolumeConsistency(volumeHistoryRef.current)
      }
      
      // Detect monotone periods (low pitch variation for >10 seconds)
      if (pitchTimelineRef.current.length > 20) { // Need at least 10 seconds of data (20 * 500ms)
        const windowSize = 20 // 10 seconds worth of samples
        for (let i = windowSize; i < pitchTimelineRef.current.length; i++) {
          const window = pitchTimelineRef.current.slice(i - windowSize, i)
          const windowPitches = window.map(p => p.value).filter(p => p > 0)
          if (windowPitches.length > 10) {
            const windowVariation = calculatePitchVariation(windowPitches)
            if (windowVariation < 10) { // Low variation
              monotonePeriods++
              i += windowSize // Skip ahead to avoid double counting
            }
          }
        }
      }
    }
    
    // Return data even if pitch/volume isn't available - at least show WPM and filler words
    // Only require transcript data (which should always be available)
    if (transcript.length === 0 && !hasValidPitches) {
      console.log('🎤 getVoiceAnalysisData: No transcript or pitch data available')
      return null
    }
    
    console.log('🎤 getVoiceAnalysisData: Returning data', {
      hasPitchData: hasValidPitches,
      hasTranscript: transcript.length > 0,
      avgWPM,
      totalFillerWords
    })
    
    // Detect issues (use defaults for pitch/volume if not available)
    const issues = {
      tooFast: avgWPM > 180,
      tooSlow: avgWPM < 120,
      monotone: hasValidPitches ? pitchVariation < 15 : false,
      lowEnergy: hasValidPitches ? avgVolume < -35 : false,
      excessiveFillers: fillerWordsPerMinute > 2,
      poorEndings: false // Would need more sophisticated analysis
    }
    
    return {
      sessionId,
      timestamp: new Date(),
      avgPitch: Math.round(avgPitch),
      minPitch: Math.round(minPitch),
      maxPitch: Math.round(maxPitch),
      pitchVariation,
      avgVolume: Math.round(avgVolume),
      volumeConsistency: Math.round(volumeConsistency * 100) / 100,
      avgWPM,
      totalFillerWords,
      fillerWordsPerMinute: Math.round(fillerWordsPerMinute * 10) / 10,
      longPausesCount,
      monotonePeriods,
      pitchTimeline: [...pitchTimelineRef.current],
      volumeTimeline: [...volumeTimelineRef.current],
      wpmTimeline: [...wpmTimelineRef.current],
      issues,
    }
  }, [sessionId, transcript])
  
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
      sessionStartTimeRef.current = Date.now()
      lastTimelineUpdateRef.current = Date.now()
      
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
    
    // Note: Don't clear timeline data - it's needed for final analysis
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
    feedbackItems: [], // No feedback during live session
    isAnalyzing,
    error,
    voiceAnalysisData: getVoiceAnalysisData(),
    getVoiceAnalysisData,
  }
}
