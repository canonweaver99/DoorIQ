'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Search, Mic, Square } from 'lucide-react'
import SpeechQualitySection from '@/components/analytics/SpeechQualitySection'
import { VoiceAnalysisData, TranscriptEntry } from '@/lib/trainer/types'
import { useVoiceAnalysis } from '@/hooks/useVoiceAnalysis'

// Speech Recognition types
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: (event: any) => void
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: {
    transcript: string
  }
}

// Sample test data
const sampleVoiceAnalysisData: VoiceAnalysisData = {
  sessionId: 'test-session-123',
  timestamp: new Date(),
  avgPitch: 180,
  minPitch: 150,
  maxPitch: 220,
  pitchVariation: 25.5,
  avgVolume: -25,
  volumeConsistency: 15.2,
  avgWPM: 155,
  totalFillerWords: 8,
  fillerWordsPerMinute: 1.2,
  longPausesCount: 2,
  monotonePeriods: 0,
  pitchTimeline: Array.from({ length: 60 }, (_, i) => ({
    time: i * 10,
    value: 150 + Math.sin(i / 10) * 30 + Math.random() * 20
  })),
  volumeTimeline: Array.from({ length: 60 }, (_, i) => ({
    time: i * 10,
    value: -30 + Math.random() * 10
  })),
  wpmTimeline: Array.from({ length: 60 }, (_, i) => ({
    time: i * 10,
    value: 140 + Math.random() * 40
  })),
  issues: {
    tooFast: false,
    tooSlow: false,
    monotone: false,
    lowEnergy: false,
    excessiveFillers: false,
    poorEndings: false
  }
}

export default function TestSpeechAnalysisPage() {
  const [sessionId, setSessionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [voiceAnalysis, setVoiceAnalysis] = useState<VoiceAnalysisData | null>(null)
  const [useSampleData, setUseSampleData] = useState(true)
  const [durationSeconds, setDurationSeconds] = useState(600)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [interimTranscript, setInterimTranscript] = useState<string>('')
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [speechRecognitionError, setSpeechRecognitionError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const sessionStartTimeRef = useRef<number>(0)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRecordingRef = useRef<boolean>(false)

  // Use voice analysis hook
  const { isAnalyzing, getVoiceAnalysisData, error: voiceError } = useVoiceAnalysis({
    enabled: isRecording,
    sessionId: 'test-speech-' + Date.now(),
    transcript: transcript,
    sessionStartTime: sessionStartTimeRef.current || Date.now()
  })

  // Debug: Log transcript changes
  useEffect(() => {
    console.log('📊 Transcript updated:', {
      length: transcript.length,
      entries: transcript.map(t => ({ text: t.text.substring(0, 50), timestamp: t.timestamp }))
    })
  }, [transcript])

  // Load sample data by default
  useEffect(() => {
    if (useSampleData && !isRecording) {
      setVoiceAnalysis(sampleVoiceAnalysisData)
    }
  }, [useSampleData, isRecording])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        console.warn('⚠️ Speech Recognition API not available in this browser. Use Chrome or Edge for best results.')
        return
      }
      
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event: SpeechRecognitionEvent) => {
          console.log('🎤 Speech recognition result:', event.results.length, 'results, index:', event.resultIndex)
          const results: TranscriptEntry[] = []
          let interimText = ''
          
          // Process all results
          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i]
            // Access transcript - try different ways
            let transcriptText = ''
            if (result[0]) {
              transcriptText = result[0].transcript || ''
            } else if ((result as any).transcript) {
              transcriptText = (result as any).transcript
            }
            
            console.log(`Result ${i}: isFinal=${result.isFinal}, transcript="${transcriptText}"`)
            
            if (result.isFinal && transcriptText.trim()) {
              results.push({
                id: `transcript-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 9)}`,
                speaker: 'user',
                text: transcriptText.trim(),
                timestamp: new Date()
              })
            } else if (!result.isFinal && transcriptText.trim()) {
              // Show interim results
              interimText = transcriptText.trim()
            }
          }
          
          // Update interim transcript
          if (interimText) {
            setInterimTranscript(interimText)
          } else {
            setInterimTranscript('')
          }
          
          // Add final results
          if (results.length > 0) {
            console.log('✅ Adding', results.length, 'final transcript entries')
            setTranscript(prev => {
              const updated = [...prev, ...results]
              console.log('📝 Total transcript entries:', updated.length)
              return updated
            })
            setInterimTranscript('') // Clear interim when we get final
          }
      }

      recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error)
        setSpeechRecognitionError(event.error)
        
        if (event.error === 'no-speech') {
          console.warn('⚠️ No speech detected. Make sure you are speaking.')
          // Don't show alert for no-speech, it's common
        } else if (event.error === 'not-allowed') {
          console.error('❌ Microphone permission denied')
          alert('Microphone permission denied. Please allow microphone access and try again.')
        } else if (event.error === 'network') {
          console.error('❌ Network error - Speech Recognition requires internet connection')
          // Don't show alert immediately, let user see the warning banner
        } else if (event.error === 'aborted') {
          console.warn('⚠️ Speech recognition was aborted')
          setSpeechRecognitionError(null) // Clear error on abort
        } else if (event.error === 'audio-capture') {
          console.error('❌ No microphone found')
          alert('No microphone found. Please connect a microphone and try again.')
        } else {
          console.error('❌ Unknown speech recognition error:', event.error)
        }
      }

      recognition.onend = () => {
          console.log('🔚 Speech recognition ended')
          // If still recording, restart recognition
          if (isRecordingRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start()
            } catch (e) {
              console.warn('Could not restart recognition:', e)
            }
          }
      }

      recognitionRef.current = recognition
    }
  }, [])

  // Start recording
  const startRecording = () => {
    setTranscript([])
    setInterimTranscript('')
    setVoiceAnalysis(null)
    setRecordingDuration(0)
    setSpeechRecognitionError(null) // Clear previous errors
    sessionStartTimeRef.current = Date.now()
    isRecordingRef.current = true
    setIsRecording(true)

    // Start speech recognition if available
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
      } catch (e) {
        console.warn('Speech recognition already started or not available')
      }
    }

    // Start duration timer
    durationIntervalRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1)
    }, 1000)
  }

  // Stop recording and analyze
  const stopRecording = () => {
    isRecordingRef.current = false
    setIsRecording(false)

    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        // Ignore errors
      }
    }

    // Stop duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }

    // Wait a bit for analysis to complete, then get results
    setTimeout(() => {
      console.log('🔍 Getting voice analysis data...', {
        transcriptLength: transcript.length,
        recordingDuration,
        sessionStartTime: sessionStartTimeRef.current
      })
      
      const analysisData = getVoiceAnalysisData()
      console.log('📊 Analysis data:', analysisData)
      
      if (analysisData) {
        setVoiceAnalysis(analysisData)
        setDurationSeconds(recordingDuration)
        console.log('✅ Analysis complete:', {
          avgWPM: analysisData.avgWPM,
          totalFillerWords: analysisData.totalFillerWords,
          avgPitch: analysisData.avgPitch,
          avgVolume: analysisData.avgVolume
        })
      } else {
        console.warn('⚠️ No analysis data available')
        alert(`No analysis data available.\n\nTranscript entries: ${transcript.length}\nRecording duration: ${recordingDuration}s\n\nMake sure you spoke during recording and that microphone access was granted.`)
      }
    }, 1000)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore
        }
      }
    }
  }, [])

  const fetchSessionVoiceAnalysis = async () => {
    if (!sessionId.trim()) {
      alert('Please enter a session ID')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/session?id=${sessionId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch session')
      }

      const data = await response.json()
      const voiceData = data.analytics?.voice_analysis

      if (!voiceData) {
        alert('No voice analysis data found for this session')
        setLoading(false)
        return
      }

      // Convert the voice analysis data to match VoiceAnalysisData interface
      const convertedData: VoiceAnalysisData = {
        sessionId: data.id || sessionId,
        timestamp: voiceData.timestamp ? new Date(voiceData.timestamp) : new Date(),
        avgPitch: voiceData.avgPitch || 0,
        minPitch: voiceData.minPitch || 0,
        maxPitch: voiceData.maxPitch || 0,
        pitchVariation: voiceData.pitchVariation || 0,
        avgVolume: voiceData.avgVolume || -60,
        volumeConsistency: voiceData.volumeConsistency || 0,
        avgWPM: voiceData.avgWPM || 0,
        totalFillerWords: voiceData.totalFillerWords || 0,
        fillerWordsPerMinute: voiceData.fillerWordsPerMinute || 0,
        longPausesCount: voiceData.longPausesCount || 0,
        monotonePeriods: voiceData.monotonePeriods || 0,
        pitchTimeline: voiceData.pitchTimeline || [],
        volumeTimeline: voiceData.volumeTimeline || [],
        wpmTimeline: voiceData.wpmTimeline || [],
        issues: voiceData.issues || {
          tooFast: false,
          tooSlow: false,
          monotone: false,
          lowEnergy: false,
          excessiveFillers: false,
          poorEndings: false
        }
      }

      setVoiceAnalysis(convertedData)
      setDurationSeconds(data.duration_seconds || 600)
      setUseSampleData(false)
    } catch (error) {
      console.error('Error fetching session:', error)
      alert('Error fetching session data. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]">
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-12 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link
            href="/sessions"
            className="inline-flex items-center text-gray-500 hover:text-gray-300 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sessions
          </Link>
          <h1 className="text-3xl font-semibold text-white">Speech Analysis Test Page</h1>
          <p className="text-gray-400 text-sm">
            Test the speech quality analysis component independently
          </p>
        </div>

        {/* Recording Controls */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-6">
          <div className="space-y-4">
            {/* Browser Support Warning */}
            {typeof window !== 'undefined' && !((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) && (
              <div className="mb-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-300">
                  ⚠️ Speech Recognition is not available in this browser. Please use Chrome or Edge for transcript functionality.
                  Voice analysis (pitch/volume) will still work.
                </p>
              </div>
            )}

            {/* Speech Recognition Error Warning */}
            {speechRecognitionError && (
              <div className={`mb-4 p-4 rounded-lg border ${
                speechRecognitionError === 'network' 
                  ? 'bg-red-500/10 border-red-500/20' 
                  : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                <p className={`text-sm ${
                  speechRecognitionError === 'network' 
                    ? 'text-red-300' 
                    : 'text-amber-300'
                }`}>
                  {speechRecognitionError === 'network' && (
                    <>⚠️ Network error: Speech Recognition requires an internet connection. 
                    Voice analysis (pitch/volume) will still work, but transcript and WPM calculation may not be available.</>
                  )}
                  {speechRecognitionError === 'not-allowed' && (
                    <>⚠️ Microphone permission denied. Please allow microphone access.</>
                  )}
                  {speechRecognitionError === 'audio-capture' && (
                    <>⚠️ No microphone found. Please connect a microphone.</>
                  )}
                  {speechRecognitionError && !['network', 'not-allowed', 'audio-capture'].includes(speechRecognitionError) && (
                    <>⚠️ Speech recognition error: {speechRecognitionError}</>
                  )}
                </p>
              </div>
            )}

            {/* Record Button */}
            <div className="flex items-center justify-center gap-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-3 px-8 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
                >
                  <Mic className="w-6 h-6" />
                  Start Recording
                </button>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-3 px-8 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-lg transition-all shadow-lg animate-pulse"
                  >
                    <Square className="w-5 h-5 fill-white" />
                    Stop Recording ({recordingDuration}s)
                  </button>
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 text-purple-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Analyzing your speech...</span>
                    </div>
                  )}
                  {voiceError && (
                    <div className="text-amber-400 text-sm">
                      Note: {voiceError} (Analysis will continue with available data)
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Transcript Preview */}
            {(transcript.length > 0 || interimTranscript) && (
              <div className="mt-4 p-4 rounded-lg bg-slate-900/50 border border-slate-700 max-h-32 overflow-y-auto">
                <div className="text-xs text-gray-400 mb-2">
                  Live Transcript ({transcript.length} {transcript.length === 1 ? 'phrase' : 'phrases'}):
                </div>
                <div className="text-sm text-gray-300">
                  {transcript.map((entry, i) => (
                    <span key={entry.id || i}>{entry.text} </span>
                  ))}
                  {interimTranscript && (
                    <span className="text-gray-500 italic">{interimTranscript}</span>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-slate-700 pt-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-white">
                  <input
                    type="checkbox"
                    checked={useSampleData}
                    onChange={(e) => {
                      setUseSampleData(e.target.checked)
                      if (e.target.checked) {
                        setVoiceAnalysis(sampleVoiceAnalysisData)
                        setSessionId('')
                        setIsRecording(false)
                      }
                    }}
                    disabled={isRecording}
                    className="w-4 h-4 rounded border-gray-600 bg-slate-800 text-purple-500 focus:ring-purple-500 disabled:opacity-50"
                  />
                  <span>Use Sample Data</span>
                </label>
              </div>
            </div>

            {!useSampleData && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    placeholder="Enter session ID"
                    className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  onClick={fetchSessionVoiceAnalysis}
                  disabled={loading}
                  className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Load Session
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-400">Duration (seconds):</label>
              <input
                type="number"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(Number(e.target.value))}
                className="w-32 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Speech Quality Section */}
        {voiceAnalysis ? (
          <SpeechQualitySection
            voiceAnalysis={voiceAnalysis}
            durationSeconds={durationSeconds}
          />
        ) : (
          <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-8 text-center">
            <p className="text-gray-400">
              {useSampleData
                ? 'Loading sample data...'
                : 'Enter a session ID or use sample data to test the speech analysis component'}
            </p>
          </div>
        )}

        {/* Live Transcript */}
        {transcript.length > 0 && (
          <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Mic className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Live Transcript</h3>
                <p className="text-sm text-gray-400">
                  {transcript.length} {transcript.length === 1 ? 'phrase' : 'phrases'} captured
                </p>
              </div>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {transcript.map((entry, index) => {
                const time = entry.timestamp instanceof Date 
                  ? entry.timestamp 
                  : new Date(entry.timestamp)
                const timeStr = time.toLocaleTimeString()
                
                return (
                  <div 
                    key={entry.id || index} 
                    className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <span className="text-xs text-gray-400 font-mono">{timeStr}</span>
                      </div>
                    </div>
                    <p className="text-base text-gray-200 leading-relaxed">{entry.text}</p>
                  </div>
                )
              })}
            </div>
            {transcript.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">
                No transcript available yet. Start recording and speak to see your words appear here.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

