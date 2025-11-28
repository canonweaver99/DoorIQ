'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { TranscriptEntry } from '@/lib/trainer/types'

interface UseEnergyScoreOptions {
  /** Optional MediaStream from WebRTC (e.g., ElevenLabs). If not provided, will use getUserMedia */
  mediaStream?: MediaStream | null
  /** Whether the hook is enabled */
  enabled?: boolean
  /** Update interval in milliseconds (default: 500ms) */
  updateInterval?: number
  /** Transcript entries for calculating speaking pace (optional) */
  transcript?: TranscriptEntry[]
  /** Session start time for calculating WPM from transcript */
  sessionStartTime?: number
  /** Callback when energy score updates */
  onScoreUpdate?: (score: number) => void
}

interface EnergyScoreFactors {
  volume: number // 0-100 normalized score
  pitchVariation: number // 0-100 normalized score
  speakingPace: number // 0-100 normalized score
  silenceRatio: number // 0-100 normalized score (inverted - lower silence = higher score)
}

interface UseEnergyScoreReturn {
  /** Current energy score (0-100) */
  energyScore: number
  /** Energy level category */
  energyLevel: 'low' | 'good' | 'high'
  /** Individual factor scores */
  factors: EnergyScoreFactors
  /** Whether baseline calibration is in progress */
  isCalibrating: boolean
  /** Error message if any */
  error: string | null
  /** Whether analysis is active */
  isActive: boolean
}

// Pitch detection using autocorrelation (reused from useVoiceAnalysis)
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

// Calculate RMS volume in dB
function calculateVolumeRMS(buffer: Float32Array): number {
  let sumSquares = 0
  for (let i = 0; i < buffer.length; i++) {
    sumSquares += buffer[i] * buffer[i]
  }
  const rms = Math.sqrt(sumSquares / buffer.length)
  // Convert to dB, clamp to reasonable range
  const dB = 20 * Math.log10(rms + 1e-10) // Add small epsilon to avoid log(0)
  return Math.max(-60, Math.min(0, dB))
}

// Calculate pitch variation (coefficient of variation as percentage)
function calculatePitchVariation(pitchHistory: number[]): number {
  if (pitchHistory.length < 2) return 0
  
  const validPitches = pitchHistory.filter(p => p > 0)
  if (validPitches.length < 2) return 0
  
  const mean = validPitches.reduce((a, b) => a + b, 0) / validPitches.length
  const variance = validPitches.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / validPitches.length
  const stdDev = Math.sqrt(variance)
  
  // Return coefficient of variation as percentage
  return mean > 0 ? (stdDev / mean) * 100 : 0
}

// Calculate WPM from transcript entries using rolling window
function calculateWPMFromTranscript(
  transcript: TranscriptEntry[],
  sessionStartTime: number,
  currentTime: number
): number {
  if (!transcript || transcript.length === 0) return 0
  
  // Filter to only user/rep entries
  const repEntries = transcript.filter(entry => entry.speaker === 'user')
  if (repEntries.length === 0) return 0
  
  // Use rolling window: last 15 seconds for more accurate real-time WPM
  const WINDOW_SECONDS = 15
  const windowStartTime = currentTime - (WINDOW_SECONDS * 1000)
  
  // Filter entries within the rolling window
  const recentEntries = repEntries.filter(entry => {
    try {
      const entryTime = entry.timestamp instanceof Date 
        ? entry.timestamp.getTime()
        : typeof entry.timestamp === 'string'
          ? new Date(entry.timestamp).getTime()
          : sessionStartTime
      return entryTime >= windowStartTime
    } catch {
      return false
    }
  })
  
  if (recentEntries.length === 0) {
    // Fallback: if no recent entries, use all entries but with minimum duration
    const totalWords = repEntries.reduce((sum, entry) => {
      return sum + (entry.text?.split(/\s+/).filter(w => w.length > 0).length || 0)
    }, 0)
    
    // Use actual session duration with reasonable minimum
    const durationMinutes = Math.max(0.5, (currentTime - sessionStartTime) / 60000)
    const wpm = totalWords / durationMinutes
    
    // Cap at reasonable maximum to prevent early-session inflation
    return Math.min(200, wpm)
  }
  
  // Count words in recent window
  const recentWords = recentEntries.reduce((sum, entry) => {
    return sum + (entry.text?.split(/\s+/).filter(w => w.length > 0).length || 0)
  }, 0)
  
  // Calculate WPM based on window duration
  const windowDurationMinutes = WINDOW_SECONDS / 60
  const wpm = recentWords / windowDurationMinutes
  
  // Cap at reasonable maximum
  return Math.min(200, Math.max(0, wpm))
}

// Estimate speaking pace from audio activity (when transcript unavailable)
function estimateSpeakingPaceFromAudio(
  volumeHistory: number[],
  silenceRatio: number
): number {
  // Use volume activity and silence ratio to estimate pace
  // More activity + less silence = faster pace
  const avgVolume = volumeHistory.length > 0
    ? volumeHistory.reduce((a, b) => a + b, 0) / volumeHistory.length
    : -60
  
  // Normalize volume to 0-1 scale (-60dB to 0dB)
  const volumeNormalized = Math.max(0, Math.min(1, (avgVolume + 60) / 60))
  
  // Combine volume activity with inverse silence ratio
  // Higher volume activity and lower silence = higher pace estimate
  const activityScore = volumeNormalized * (1 - silenceRatio / 100)
  
  // Map to WPM estimate (rough range: 100-180 WPM)
  return 100 + (activityScore * 80)
}

export function useEnergyScore(options: UseEnergyScoreOptions = {}): UseEnergyScoreReturn {
  const {
    mediaStream: providedStream = null,
    enabled = false,
    updateInterval = 500,
    transcript = [],
    sessionStartTime,
    onScoreUpdate
  } = options

  const [energyScore, setEnergyScore] = useState<number>(50) // Start at neutral
  const [energyLevel, setEnergyLevel] = useState<'low' | 'good' | 'high'>('good')
  const [factors, setFactors] = useState<EnergyScoreFactors>({
    volume: 50,
    pitchVariation: 50,
    speakingPace: 50,
    silenceRatio: 50
  })
  const [isCalibrating, setIsCalibrating] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)

  // Audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // History buffers for calculations
  const volumeHistoryRef = useRef<number[]>([]) // dB values
  const pitchHistoryRef = useRef<number[]>([]) // Hz values
  const volumeSamplesRef = useRef<number[]>([]) // For silence detection

  // Baseline calibration data
  const baselineCalibrationRef = useRef<{
    volumeMean: number
    volumeStd: number
    volumeMin: number
    volumeMax: number
    samples: number
  } | null>(null)
  const calibrationStartTimeRef = useRef<number | null>(null)
  const CALIBRATION_DURATION = 5000 // 5 seconds

  // Smoothing
  const smoothedScoreRef = useRef<number>(50)
  const SMOOTHING_ALPHA = 0.7 // Exponential smoothing factor

  // Session tracking
  const sessionStartTimeRef = useRef<number>(sessionStartTime || Date.now())

  // Weight factors (as specified)
  const WEIGHTS = {
    volume: 0.25,
    pitchVariation: 0.30,
    speakingPace: 0.25,
    silenceRatio: 0.20
  }

  // Thresholds
  const THRESHOLDS = {
    low: 40,
    high: 70
  }

  // Update session start time if provided
  useEffect(() => {
    if (sessionStartTime) {
      sessionStartTimeRef.current = sessionStartTime
    }
  }, [sessionStartTime])

  // Normalize volume to 0-100 scale with baseline calibration
  const normalizeVolume = useCallback((volumeDb: number): number => {
    if (!baselineCalibrationRef.current) {
      return 50 // Default neutral score during calibration
    }

    const { volumeMean, volumeStd, volumeMin, volumeMax } = baselineCalibrationRef.current

    // Normalize based on baseline
    // If volume is at baseline mean, score = 50
    // If volume is 1 std above mean, score increases
    // If volume is below baseline, score decreases but not too harshly
    
    const deviation = volumeDb - volumeMean
    
    // Use std deviation for normalization, but cap extremes
    const normalized = 50 + (deviation / Math.max(volumeStd, 5)) * 25 // Scale by std dev
    
    // Clamp to reasonable range, but allow for dynamic range
    return Math.max(0, Math.min(100, normalized))
  }, [])

  // Normalize pitch variation to 0-100 scale
  const normalizePitchVariation = useCallback((variationPercent: number): number => {
    // Typical pitch variation: 10-30% is good, <10% is monotone, >40% is very dynamic
    // Map: 0% = 0, 15% = 50, 30% = 75, 50%+ = 100
    if (variationPercent === 0) return 0
    
    if (variationPercent < 10) {
      // Monotone - linear from 0-10% maps to 0-30
      return (variationPercent / 10) * 30
    } else if (variationPercent < 30) {
      // Good range - linear from 10-30% maps to 30-75
      return 30 + ((variationPercent - 10) / 20) * 45
    } else {
      // Very dynamic - 30%+ maps to 75-100
      return Math.min(100, 75 + ((variationPercent - 30) / 20) * 25)
    }
  }, [])

  // Normalize speaking pace (WPM) to 0-100 scale
  const normalizeSpeakingPace = useCallback((wpm: number): number => {
    // Ideal speaking pace: 140-160 WPM
    // Too slow: <120 WPM
    // Too fast: >180 WPM
    // Map: 100 WPM = 30, 140 WPM = 70, 160 WPM = 85, 180 WPM = 70, 200+ WPM = 40
    
    if (wpm < 100) {
      // Very slow
      return (wpm / 100) * 30
    } else if (wpm < 140) {
      // Slow to good
      return 30 + ((wpm - 100) / 40) * 40
    } else if (wpm < 160) {
      // Ideal range
      return 70 + ((wpm - 140) / 20) * 15
    } else if (wpm < 180) {
      // Fast but acceptable
      return 85 - ((wpm - 160) / 20) * 15
    } else {
      // Too fast - penalize
      return Math.max(40, 70 - ((wpm - 180) / 20) * 30)
    }
  }, [])

  // Calculate silence ratio (percentage of time spent in silence)
  const calculateSilenceRatio = useCallback((): number => {
    if (volumeSamplesRef.current.length < 10) return 0

    const SILENCE_THRESHOLD = -45 // dB threshold for silence
    let silenceSamples = 0

    for (const volume of volumeSamplesRef.current) {
      if (volume < SILENCE_THRESHOLD) {
        silenceSamples++
      }
    }

    return (silenceSamples / volumeSamplesRef.current.length) * 100
  }, [])

  // Normalize silence ratio to 0-100 scale (inverted - lower silence = higher score)
  const normalizeSilenceRatio = useCallback((silencePercent: number): number => {
    // Lower silence ratio = higher energy score
    // 0% silence = 100, 50% silence = 50, 100% silence = 0
    return 100 - silencePercent
  }, [])

  // Check if rep (user) is currently speaking based on transcript
  const isRepSpeaking = useCallback((currentTime: number): boolean => {
    if (!transcript || transcript.length === 0) {
      // If no transcript, assume rep might be speaking (fallback to audio analysis)
      return true
    }

    // Get the most recent transcript entry
    const lastEntry = transcript[transcript.length - 1]
    if (!lastEntry) return false

    // Check if the last entry is from the rep (user)
    if (lastEntry.speaker !== 'user') {
      return false
    }

    // Check if the last rep entry is recent (within last 3 seconds)
    // This accounts for the agent potentially speaking right after the rep
    try {
      const entryTime = lastEntry.timestamp instanceof Date 
        ? lastEntry.timestamp.getTime()
        : typeof lastEntry.timestamp === 'string'
          ? new Date(lastEntry.timestamp).getTime()
          : currentTime
      
      const timeSinceLastRepEntry = currentTime - entryTime
      // If rep spoke within last 3 seconds, consider them still speaking
      // This is a heuristic - adjust based on typical response patterns
      return timeSinceLastRepEntry < 3000
    } catch {
      // If timestamp parsing fails, assume rep might be speaking
      return true
    }
  }, [transcript])

  // Main analysis function
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Float32Array(bufferLength)
    analyser.getFloatTimeDomainData(dataArray)

    const currentTime = Date.now()
    const sessionElapsed = currentTime - sessionStartTimeRef.current

    // Calculate volume (RMS) - always collect for baseline and history
    const volumeDb = calculateVolumeRMS(dataArray)
    volumeHistoryRef.current.push(volumeDb)
    if (volumeHistoryRef.current.length > 100) {
      volumeHistoryRef.current.shift()
    }

    // Store volume samples for silence detection
    volumeSamplesRef.current.push(volumeDb)
    if (volumeSamplesRef.current.length > 200) { // Keep ~10 seconds at 500ms intervals
      volumeSamplesRef.current.shift()
    }

    // Detect pitch only if volume is above threshold (speech detected)
    let pitch = 0
    if (volumeDb > -50) {
      const sampleRate = audioContextRef.current?.sampleRate || 44100
      pitch = detectPitch(dataArray, sampleRate)

      if (pitch > 0) {
        pitchHistoryRef.current.push(pitch)
        if (pitchHistoryRef.current.length > 100) {
          pitchHistoryRef.current.shift()
        }
      }
    }

    // Baseline calibration (first 5 seconds)
    const isCalibratingNow = sessionElapsed < CALIBRATION_DURATION
    setIsCalibrating(isCalibratingNow)

    if (isCalibratingNow) {
      // Collect baseline data
      if (!baselineCalibrationRef.current) {
        baselineCalibrationRef.current = {
          volumeMean: volumeDb,
          volumeStd: 0,
          volumeMin: volumeDb,
          volumeMax: volumeDb,
          samples: 1
        }
        calibrationStartTimeRef.current = currentTime
      } else {
        const baseline = baselineCalibrationRef.current
        baseline.samples++
        
        // Update running mean
        const oldMean = baseline.volumeMean
        baseline.volumeMean = oldMean + (volumeDb - oldMean) / baseline.samples
        
        // Update min/max
        baseline.volumeMin = Math.min(baseline.volumeMin, volumeDb)
        baseline.volumeMax = Math.max(baseline.volumeMax, volumeDb)
        
        // Calculate running std dev (simplified)
        const variance = volumeHistoryRef.current.reduce((sum, v) => {
          return sum + Math.pow(v - baseline.volumeMean, 2)
        }, 0) / volumeHistoryRef.current.length
        baseline.volumeStd = Math.sqrt(variance)
      }
      
      // During calibration, return early (don't calculate score yet)
      return
    }

    // CRITICAL: Only calculate energy score when rep is speaking
    // Don't update score when agent is speaking
    const repIsSpeaking = isRepSpeaking(currentTime)
    if (!repIsSpeaking) {
      // Agent is speaking - don't update energy score
      // Keep the last calculated score (it's already in state)
      return
    }

    // Calculate individual factors (only when rep is speaking)
    const volumeScore = normalizeVolume(volumeDb)
    const pitchVariationPercent = calculatePitchVariation(pitchHistoryRef.current)
    const pitchVariationScore = normalizePitchVariation(pitchVariationPercent)

    // Calculate speaking pace
    let speakingPaceScore = 50 // Default
    if (transcript.length > 0 && sessionStartTimeRef.current) {
      const wpm = calculateWPMFromTranscript(transcript, sessionStartTimeRef.current, currentTime)
      speakingPaceScore = normalizeSpeakingPace(wpm)
    } else {
      // Estimate from audio activity
      const silenceRatio = calculateSilenceRatio()
      const estimatedWPM = estimateSpeakingPaceFromAudio(volumeHistoryRef.current, silenceRatio)
      speakingPaceScore = normalizeSpeakingPace(estimatedWPM)
    }

    // Calculate silence ratio
    const silenceRatio = calculateSilenceRatio()
    const silenceRatioScore = normalizeSilenceRatio(silenceRatio)

    // Calculate weighted energy score
    const rawScore =
      volumeScore * WEIGHTS.volume +
      pitchVariationScore * WEIGHTS.pitchVariation +
      speakingPaceScore * WEIGHTS.speakingPace +
      silenceRatioScore * WEIGHTS.silenceRatio

    // Apply exponential smoothing
    smoothedScoreRef.current =
      smoothedScoreRef.current * SMOOTHING_ALPHA +
      rawScore * (1 - SMOOTHING_ALPHA)

    const finalScore = Math.round(Math.max(0, Math.min(100, smoothedScoreRef.current)))

    // Determine energy level
    let level: 'low' | 'good' | 'high'
    if (finalScore < THRESHOLDS.low) {
      level = 'low'
    } else if (finalScore >= THRESHOLDS.high) {
      level = 'high'
    } else {
      level = 'good'
    }

    // Update state (only when rep is speaking)
    setEnergyScore(finalScore)
    setEnergyLevel(level)
    setFactors({
      volume: Math.round(volumeScore),
      pitchVariation: Math.round(pitchVariationScore),
      speakingPace: Math.round(speakingPaceScore),
      silenceRatio: Math.round(silenceRatioScore)
    })

    // Call callback if provided
    onScoreUpdate?.(finalScore)
  }, [transcript, normalizeVolume, normalizePitchVariation, normalizeSpeakingPace, normalizeSilenceRatio, calculateSilenceRatio, isRepSpeaking, onScoreUpdate])

  // Start analysis
  const startAnalysis = useCallback(async () => {
    if (isActive) return

    try {
      setError(null)

      let stream: MediaStream | null = null

      // Use provided stream or get microphone access
      if (providedStream) {
        stream = providedStream
        console.log('🎤 Using provided MediaStream for energy score analysis')
      } else {
        console.log('🎤 Requesting microphone access for energy score analysis...')
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        console.log('✅ Microphone access granted for energy score analysis')
      }

      mediaStreamRef.current = stream

      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext

      // Create analyser node
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.8
      analyserRef.current = analyser

      // Connect stream to analyser
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // Reset calibration
      baselineCalibrationRef.current = null
      calibrationStartTimeRef.current = null
      volumeHistoryRef.current = []
      pitchHistoryRef.current = []
      volumeSamplesRef.current = []
      smoothedScoreRef.current = 50
      sessionStartTimeRef.current = sessionStartTime || Date.now()

      setIsActive(true)
      setIsCalibrating(true)

      console.log('✅ Energy score analysis started - calibrating baseline...')

      // Start analysis loop
      const runAnalysis = () => {
        analyzeAudio()
        analysisIntervalRef.current = setTimeout(runAnalysis, updateInterval)
      }
      runAnalysis()
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to access audio stream'
      console.error('❌ Energy score analysis failed:', errorMsg)
      setError(errorMsg)
      setIsActive(false)
    }
  }, [isActive, providedStream, updateInterval, analyzeAudio, sessionStartTime])

  // Stop analysis
  const stopAnalysis = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearTimeout(analysisIntervalRef.current)
      analysisIntervalRef.current = null
    }

    // Only stop tracks if we created the stream ourselves
    if (mediaStreamRef.current && !providedStream) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
    }
    mediaStreamRef.current = null

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error)
      audioContextRef.current = null
    }

    analyserRef.current = null
    setIsActive(false)
    setIsCalibrating(false)

    // Reset state
    setEnergyScore(50)
    setEnergyLevel('good')
    setFactors({
      volume: 50,
      pitchVariation: 50,
      speakingPace: 50,
      silenceRatio: 50
    })
  }, [providedStream])

  // Start/stop analysis based on enabled prop
  useEffect(() => {
    if (enabled && !isActive) {
      startAnalysis()
    } else if (!enabled && isActive) {
      stopAnalysis()
    }

    return () => {
      if (!enabled) {
        stopAnalysis()
      }
    }
  }, [enabled, isActive, startAnalysis, stopAnalysis])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnalysis()
    }
  }, [stopAnalysis])

  // Handle provided stream changes
  useEffect(() => {
    if (providedStream && enabled && isActive) {
      // Stream changed - restart analysis
      stopAnalysis()
      setTimeout(() => {
        if (enabled) {
          startAnalysis()
        }
      }, 100)
    }
  }, [providedStream, enabled, isActive, startAnalysis, stopAnalysis])

  return {
    energyScore,
    energyLevel,
    factors,
    isCalibrating,
    error,
    isActive
  }
}

