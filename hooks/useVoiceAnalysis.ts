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
    // Always return data if we have transcript OR pitch data
    const hasTranscriptData = transcript.length > 0
    const hasAudioData = hasValidPitches
    
    // Only return null if we have absolutely no data
    if (!hasTranscriptData && !hasAudioData) {
      console.warn('⚠️ getVoiceAnalysisData: No transcript or pitch data available - cannot generate voice analysis', {
        transcriptLength: transcript.length,
        hasValidPitches,
        pitchHistoryLength: pitchHistoryRef.current.length
      })
      return null
    }
    
    console.log('🎤 getVoiceAnalysisData: Returning data', {
      hasPitchData: hasAudioData,
      hasTranscript: hasTranscriptData,
      transcriptLength: transcript.length,
      avgWPM: avgWPM || 0,
      totalFillerWords: totalFillerWords || 0,
      fillerWordsPerMinute: fillerWordsPerMinute || 0,
      pitchHistoryLength: pitchHistoryRef.current.length,
      volumeHistoryLength: volumeHistoryRef.current.length,
      isAnalyzing,
      error: error || null
    })
    
    // Warn if we don't have audio data but should still return transcript-based metrics
    if (!hasAudioData && hasTranscriptData) {
      console.log('ℹ️ Voice analysis: Using transcript-only data (WPM, filler words) - microphone data unavailable')
    }
    
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
      console.log('🎤 Starting voice analysis - requesting microphone access...')
      
      // Request microphone access
      // Note: This may fail if microphone is already in use by ElevenLabs
      // That's okay - we'll still calculate WPM and filler words from transcript
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      console.log('✅ Microphone access granted for voice analysis')
      
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
      
      console.log('✅ Voice analysis started successfully - pitch/volume data will be collected')
      
      // Start analysis loop
      const runAnalysis = () => {
        analyzeAudio()
        analysisIntervalRef.current = setTimeout(runAnalysis, analysisInterval)
      }
      runAnalysis()
      
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to access microphone'
      console.warn('⚠️ Voice analysis microphone access failed:', errorMsg)
      console.warn('⚠️ This is okay - voice analysis will still calculate WPM and filler words from transcript')
      console.warn('⚠️ Error details:', {
        name: err.name,
        message: err.message,
        constraint: err.constraint,
        sessionId
      })
      setError(errorMsg)
      setIsAnalyzing(false)
      // Don't throw - we can still analyze transcript data even without microphone
    }
  }, [isAnalyzing, analyzeAudio, analysisInterval, sessionId])
  
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
  
  // Periodically save voice analysis data to database during session
  // IMPORTANT: Run even if isAnalyzing is false - we can still calculate WPM/filler words from transcript
  useEffect(() => {
    if (!enabled || !sessionId) return
    
    const saveInterval = setInterval(async () => {
      const voiceData = getVoiceAnalysisData()
      if (!voiceData) {
        console.log('⚠️ Voice analysis: No data available yet (transcript may be empty)')
        return
      }
      
      // Only save if we have meaningful data (WPM > 0 or filler words detected)
      // Allow saving even without transcript if we have pitch/volume data
      const hasTranscriptData = transcript.length > 0 && (voiceData.avgWPM > 0 || voiceData.totalFillerWords > 0)
      const hasAudioData = voiceData.avgPitch > 0 || voiceData.avgVolume > -60
      
      if (!hasTranscriptData && !hasAudioData) {
        console.log('⚠️ Voice analysis: No meaningful data to save yet', {
          transcriptLength: transcript.length,
          avgWPM: voiceData.avgWPM,
          totalFillerWords: voiceData.totalFillerWords,
          avgPitch: voiceData.avgPitch,
          avgVolume: voiceData.avgVolume
        })
        return
      }
      
      console.log('💾 Attempting to save voice analysis incrementally:', {
        sessionId,
        hasTranscriptData,
        hasAudioData,
        avgWPM: voiceData.avgWPM,
        totalFillerWords: voiceData.totalFillerWords,
        wpmTimelineLength: voiceData.wpmTimeline?.length || 0,
        pitchTimelineLength: voiceData.pitchTimeline?.length || 0
      })
      
      try {
        const response = await fetch('/api/session/voice-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            voice_analysis: voiceData
          })
        })
        
        if (response.ok) {
          const result = await response.json().catch(() => ({}))
          console.log('✅ Voice analysis saved incrementally:', {
            avgWPM: voiceData.avgWPM,
            totalFillerWords: voiceData.totalFillerWords,
            wpmTimelineLength: voiceData.wpmTimeline?.length || 0,
            confirmedSaved: result.voiceAnalysisSaved
          })
        } else {
          const errorText = await response.text().catch(() => 'Unknown error')
          console.warn('⚠️ Failed to save voice analysis incrementally:', {
            status: response.status,
            error: errorText
          })
        }
      } catch (error) {
        console.warn('⚠️ Error saving voice analysis incrementally:', error)
        // Don't throw - this is non-critical, data will be saved at session end
      }
    }, 15000) // Save every 15 seconds
    
    return () => {
      clearInterval(saveInterval)
    }
  }, [enabled, sessionId, transcript.length, getVoiceAnalysisData])
  
  return {
    metrics,
    feedbackItems: [], // No feedback during live session
    isAnalyzing,
    error,
    voiceAnalysisData: getVoiceAnalysisData(),
    getVoiceAnalysisData,
  }
}
