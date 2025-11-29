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
  volumeLevel: number // 0-100 normalized score (actual RMS volume)
  pitchVariation: number // 0-100 normalized score
  speakingPace: number // 0-100 normalized score
  speakingRatio: number // 0-100 normalized score (% of time speaking vs silent)
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

// Calculate WPM from transcript entries using actual speaking time
// More accurate: uses time between first and last entry in window, not fixed window duration
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
  
  // Filter entries within the rolling window and parse timestamps
  const recentEntriesWithTimes = repEntries
    .map(entry => {
      try {
        const entryTime = entry.timestamp instanceof Date 
          ? entry.timestamp.getTime()
          : typeof entry.timestamp === 'string'
            ? new Date(entry.timestamp).getTime()
            : null
        
        if (!entryTime || entryTime < windowStartTime) {
          return null
        }
        
        return {
          entry,
          time: entryTime,
          words: (entry.text?.split(/\s+/).filter(w => w.length > 0).length || 0)
        }
      } catch {
        return null
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
  
  if (recentEntriesWithTimes.length === 0) {
    // No recent entries in the last 15 seconds = not speaking recently
    return 0
  }
  
  // Count total words
  const totalWords = recentEntriesWithTimes.reduce((sum, item) => sum + item.words, 0)
  
  if (totalWords === 0) return 0
  
  // Calculate actual speaking duration: time from first to last entry
  // This is more accurate than using fixed window duration
  const firstEntryTime = recentEntriesWithTimes[0].time
  const lastEntryTime = recentEntriesWithTimes[recentEntriesWithTimes.length - 1].time
  const actualSpeakingDurationMs = lastEntryTime - firstEntryTime
  
  // If all entries happened in < 1 second, use minimum duration of 1 second
  // This prevents division by zero and unrealistic WPM spikes
  const minDurationMs = 1000 // 1 second minimum
  const speakingDurationMs = Math.max(minDurationMs, actualSpeakingDurationMs)
  
  // Calculate WPM based on actual speaking time
  const speakingDurationMinutes = speakingDurationMs / 60000
  const wpm = totalWords / speakingDurationMinutes
  
  // Cap at reasonable maximum (200 WPM is very fast, 250+ is unrealistic)
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

  const [energyScore, setEnergyScore] = useState<number>(0) // Start at 0%
  const [energyLevel, setEnergyLevel] = useState<'low' | 'good' | 'high'>('good')
  const [factors, setFactors] = useState<EnergyScoreFactors>({
    volumeLevel: 0,
    pitchVariation: 0,
    speakingPace: 0,
    speakingRatio: 0
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
  
  // Speaking ratio tracking
  const speakingFramesRef = useRef<number>(0) // Count of frames where user was speaking
  const totalFramesRef = useRef<number>(0) // Total frames processed

  // Baseline calibration data
  const baselineCalibrationRef = useRef<{
    volumeMean: number  // dB mean
    volumeStd: number   // dB std dev
    volumeMin: number   // dB min
    volumeMax: number   // dB max
    rmsMean: number     // RMS mean for volume normalization
    samples: number
  } | null>(null)
  const calibrationStartTimeRef = useRef<number | null>(null)
  const CALIBRATION_DURATION = 5000 // 5 seconds

  // Smoothing
  const smoothedScoreRef = useRef<number>(0) // Start at 0%
  const SMOOTHING_ALPHA = 0.7 // Exponential smoothing factor

  // Session tracking
  const sessionStartTimeRef = useRef<number>(sessionStartTime || Date.now())

  // Weight factors (updated as specified)
  const WEIGHTS = {
    speakingPace: 0.35,      // WPM - 35%
    pitchVariation: 0.30,    // Vocal dynamics - 30%
    volumeLevel: 0.20,       // How loud (RMS) - 20%
    speakingRatio: 0.15       // % of time speaking - 15%
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

  // Normalize volume level (actual RMS) to 0-100 scale with baseline calibration
  // Updated: Normalize against user's baseline (calibrate first 5 seconds)
  const normalizeVolumeLevel = useCallback((rms: number, volumeDb: number): number => {
    if (!baselineCalibrationRef.current) {
      return 50 // Default neutral score during calibration
    }

    const { rmsMean } = baselineCalibrationRef.current
    
    // Normalize: Speaking at baseline = 70, louder = higher
    const ratio = rms / Math.max(rmsMean, 0.001) // Avoid division by zero
    const normalized = Math.min(100, ratio * 70)
    
    return Math.max(0, normalized)
  }, [])

  // Normalize pitch variation to 0-100 scale
  // Updated: 5-30% coefficient of variation is typical
  const normalizePitchVariation = useCallback((variationPercent: number): number => {
    if (variationPercent === 0) return 0
    
    if (variationPercent < 5) {
      // Monotone = low score
      return variationPercent * 10
    } else if (variationPercent > 30) {
      // Very dynamic = max score
      return 100
    } else {
      // 5-30 maps to 50-100
      return 50 + ((variationPercent - 5) / 25) * 50
    }
  }, [])

  // Normalize speaking pace (WPM) to 0-100 scale
  // Updated: 80-200 is normal speech, 120-160 is energetic
  const normalizeSpeakingPace = useCallback((wpm: number): number => {
    if (wpm < 80) {
      // Slow = low score
      return (wpm / 80) * 50
    } else if (wpm > 200) {
      // Too fast = drops score
      return Math.max(50, 100 - (wpm - 200) / 2)
    } else {
      // 80-200 maps to 50-100
      return 50 + ((wpm - 80) / 120) * 50
    }
  }, [])

  // Calculate speaking ratio (percentage of time spent speaking vs silent)
  // Uses frame-based tracking for accurate ratio
  const calculateSpeakingRatio = useCallback((): number => {
    if (totalFramesRef.current === 0) return 0
    
    // Return percentage of time speaking (0-100)
    return (speakingFramesRef.current / totalFramesRef.current) * 100
  }, [])

  // Normalize speaking ratio to 0-100 scale
  // Higher speaking ratio = higher energy score
  // This directly maps: 0% speaking = 0 score, 100% speaking = 100 score
  const normalizeSpeakingRatio = useCallback((speakingPercent: number): number => {
    return Math.max(0, Math.min(100, speakingPercent))
  }, [])

  // Voice Activity Detection (VAD) - checks if user is currently speaking
  // Returns boolean speaking status (RMS is passed in to avoid recalculation)
  const detectVoiceActivity = useCallback((dataArray: Float32Array, volumeDb: number, rms: number): { isSpeaking: boolean } => {
    // Dual threshold check for more reliable VAD:
    // 1. RMS > 0.01 indicates audio activity
    // 2. Volume dB > -45 indicates speech-level volume
    // Both must be true to consider it speech
    const RMS_THRESHOLD = 0.01  // Threshold for speech detection
    const VOLUME_DB_THRESHOLD = -45  // Threshold for speech-level volume
    
    const isSpeaking = rms > RMS_THRESHOLD && volumeDb > VOLUME_DB_THRESHOLD
    
    return { isSpeaking }
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

    // Calculate RMS once for both calibration and VAD
    let sumSquares = 0
    for (let i = 0; i < dataArray.length; i++) {
      sumSquares += dataArray[i] * dataArray[i]
    }
    const rms = Math.sqrt(sumSquares / dataArray.length)
    
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
          rmsMean: rms,
          samples: 1
        }
        calibrationStartTimeRef.current = currentTime
      } else {
        const baseline = baselineCalibrationRef.current
        baseline.samples++
        
        // Update running mean for dB
        const oldMean = baseline.volumeMean
        baseline.volumeMean = oldMean + (volumeDb - oldMean) / baseline.samples
        
        // Update running mean for RMS
        const oldRmsMean = baseline.rmsMean
        baseline.rmsMean = oldRmsMean + (rms - oldRmsMean) / baseline.samples
        
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

    // CRITICAL: VAD check - gate everything behind voice activity detection
    // First check: Is the user currently speaking (VAD on current buffer)?
    const vadResult = detectVoiceActivity(dataArray, volumeDb, rms)
    const { isSpeaking: isCurrentlySpeaking } = vadResult
    
    // Second check: Is the rep speaking (not the agent)?
    const repIsSpeaking = isRepSpeaking(currentTime)
    
    // Track speaking frames for speaking ratio calculation
    totalFramesRef.current++
    if (isCurrentlySpeaking && repIsSpeaking) {
      speakingFramesRef.current++
    }
    
    // Calculate speaking ratio (always, even during silence)
    const speakingRatio = calculateSpeakingRatio()
    const speakingRatioScore = normalizeSpeakingRatio(speakingRatio)
    
    // Gate all metrics behind VAD - only calculate when actually speaking
    if (!isCurrentlySpeaking || !repIsSpeaking) {
      // User is not speaking - decay energy score slowly
      smoothedScoreRef.current = Math.max(0, smoothedScoreRef.current * 0.95) // Slow decay
      const finalScore = Math.round(Math.max(0, Math.min(100, smoothedScoreRef.current)))
      
      // Update state with decayed score and zeroed metrics
      setEnergyScore(finalScore)
      const level: 'low' | 'good' | 'high' = finalScore < THRESHOLDS.low ? 'low' : finalScore >= THRESHOLDS.high ? 'high' : 'good'
      setEnergyLevel(level)
      
      // All metrics zero except speakingRatio (which shows actual ratio)
      setFactors({
        volumeLevel: 0,
        pitchVariation: 0,
        speakingPace: 0,  // WPM should be 0 when silent
        speakingRatio: Math.round(speakingRatioScore)  // Show actual speaking ratio
      })
      
      // Don't call callback during silence decay
      return
    }

    // User IS speaking - calculate all metrics
    const volumeLevelScore = normalizeVolumeLevel(rms, volumeDb)
    const pitchVariationPercent = calculatePitchVariation(pitchHistoryRef.current)
    const pitchVariationScore = normalizePitchVariation(pitchVariationPercent)

    // Calculate speaking pace
    // CRITICAL: Only calculate WPM if user is actually speaking (VAD confirmed)
    // If not speaking, WPM should be 0
    let speakingPaceScore = 0 // Start at 0, only increase if actually speaking
    if (transcript.length > 0 && sessionStartTimeRef.current) {
      const wpm = calculateWPMFromTranscript(transcript, sessionStartTimeRef.current, currentTime)
      // Only use WPM if it's > 0 (meaning there was recent speech)
      // If wpm is 0, speakingPaceScore stays at 0
      if (wpm > 0) {
        speakingPaceScore = normalizeSpeakingPace(wpm)
      }
    } else {
      // Estimate from audio activity only if actually speaking
      const speakingRatio = calculateSpeakingRatio()
      if (speakingRatio > 0) {
        const estimatedWPM = estimateSpeakingPaceFromAudio(volumeHistoryRef.current, 100 - speakingRatio)
        if (estimatedWPM > 0) {
          speakingPaceScore = normalizeSpeakingPace(estimatedWPM)
        }
      }
    }

    // Calculate weighted energy score (only when VAD detects speech)
    const rawScore =
      speakingPaceScore * WEIGHTS.speakingPace +
      pitchVariationScore * WEIGHTS.pitchVariation +
      volumeLevelScore * WEIGHTS.volumeLevel +
      speakingRatioScore * WEIGHTS.speakingRatio

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

    // Update state (only when VAD detects speech and rep is speaking)
    setEnergyScore(finalScore)
    setEnergyLevel(level)
    setFactors({
      volumeLevel: Math.round(volumeLevelScore),
      pitchVariation: Math.round(pitchVariationScore),
      speakingPace: Math.round(speakingPaceScore),
      speakingRatio: Math.round(speakingRatioScore)
    })

    // Call callback if provided
    onScoreUpdate?.(finalScore)
  }, [transcript, normalizeVolumeLevel, normalizePitchVariation, normalizeSpeakingPace, normalizeSpeakingRatio, calculateSpeakingRatio, detectVoiceActivity, isRepSpeaking, onScoreUpdate])

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
      smoothedScoreRef.current = 0 // Reset to 0%
      sessionStartTimeRef.current = sessionStartTime || Date.now()
      speakingFramesRef.current = 0
      totalFramesRef.current = 0

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
      volumeLevel: 50,
      pitchVariation: 50,
      speakingPace: 50,
      speakingRatio: 50
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

