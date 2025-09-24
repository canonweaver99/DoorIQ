'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mic, MicOff, Clock, Volume2, VolumeX } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MetricCard } from '@/components/trainer/MetricCard'
import { KeyMomentFlag } from '@/components/trainer/KeyMomentFlag'
import { TranscriptEntry, SessionMetrics } from '@/lib/trainer/types'
import { AlertCircle, MessageSquare, Target, TrendingUp } from 'lucide-react'
import { ElevenLabsWebSocket } from '@/lib/elevenlabs/websocket'

export default function TrainerPage() {
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [metrics, setMetrics] = useState<SessionMetrics>({
    duration: 0,
    sentimentScore: 50,
    interruptionCount: 0,
    objectionCount: 0,
    keyMomentFlags: {
      priceDiscussed: false,
      safetyAddressed: false,
      closeAttempted: false,
    }
  })
  const [isRecording, setIsRecording] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const durationInterval = useRef<NodeJS.Timeout | null>(null)
  const elevenLabsWs = useRef<ElevenLabsWebSocket | null>(null)
  const audioContext = useRef<AudioContext | null>(null)
  const mediaStream = useRef<MediaStream | null>(null)

  useEffect(() => {
    fetchUser()
    
    // Auto-start if coming from pre-session
    if (searchParams.get('autostart') === 'true') {
      setTimeout(() => startSession(), 500)
    }
    
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current)
      }
      if (elevenLabsWs.current) {
        elevenLabsWs.current.disconnect()
      }
      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      setUser(profile)
    }
  }

  const initializeElevenLabs = async () => {
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStream.current = stream

      // Initialize audio context
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Connect to ElevenLabs
      elevenLabsWs.current = new ElevenLabsWebSocket({
        agentId: 'agent_7001k5jqfjmtejvs77jvhjf254tz',
        apiKey: 'sk_2780613e5cc01420407c1aeb054ee19d285752d379046ff2'
      })

      elevenLabsWs.current.connect({
        onConnect: () => {
          console.log('Connected to Austin!')
          setIsRecording(true)
        },
        onMessage: (message) => {
          console.log('Austin message:', message)
          if (message.type === 'audio' && message.data) {
            // Play Austin's audio response
            playAudioFromBase64(message.data)
          }
          if (message.type === 'transcript' && message.text) {
            addToTranscript('austin', message.text)
          }
        },
        onDisconnect: () => {
          console.log('Austin disconnected')
          setIsRecording(false)
        }
      })

      // Start capturing and sending audio
      startAudioCapture(stream)
    } catch (error) {
      console.error('Error initializing ElevenLabs:', error)
    }
  }

  const startAudioCapture = (stream: MediaStream) => {
    if (!audioContext.current) return

    const source = audioContext.current.createMediaStreamSource(stream)
    const processor = audioContext.current.createScriptProcessor(4096, 1, 1)

    processor.onaudioprocess = (event) => {
      if (elevenLabsWs.current && isRecording) {
        const inputData = event.inputBuffer.getChannelData(0)
        const audioData = new Float32Array(inputData)
        elevenLabsWs.current.sendAudio(audioData.buffer)
      }
    }

    source.connect(processor)
    processor.connect(audioContext.current.destination)
  }

  const playAudioFromBase64 = (base64Audio: string) => {
    try {
      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`)
      audio.play()
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }

  const addToTranscript = (speaker: 'user' | 'austin', text: string) => {
    const entry: TranscriptEntry = {
      speaker,
      text,
      timestamp: new Date(),
      sentiment: 'neutral'
    }
    setTranscript(prev => [...prev, entry])
  }

  const startSession = async () => {
    setLoading(true)
    try {
      let createdSessionId: string | null = null
      if (user?.id) {
        const { data: session, error } = await (supabase as any)
          .from('training_sessions')
          .insert({
            user_id: user.id,
            scenario_type: 'standard',
          } as any)
          .select()
          .single()
        if (error) throw error
        createdSessionId = (session as any).id
      } else {
        createdSessionId = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
          ? (crypto as any).randomUUID()
          : `${Date.now()}`
      }

      setSessionId(createdSessionId)
      setSessionActive(true)

      durationInterval.current = setInterval(() => {
        setMetrics(prev => ({ ...prev, duration: prev.duration + 1 }))
      }, 1000)

      // Initialize ElevenLabs connection
      await initializeElevenLabs()
    } catch (error) {
      console.error('Error starting session:', error)
    } finally {
      setLoading(false)
    }
  }

  const endSession = async () => {
    setLoading(true)
    
    if (durationInterval.current) {
      clearInterval(durationInterval.current)
    }

    try {
      if (user?.id && sessionId) {
        await (supabase as any)
          .from('training_sessions')
          .update({
            ended_at: new Date().toISOString(),
            duration_seconds: metrics.duration,
            overall_score: 75,
            transcript: transcript,
          } as any)
          .eq('id', sessionId as string)

        router.push(`/trainer/analytics/${sessionId}`)
      } else {
        router.push('/trainer/pre-session')
      }
    } catch (error) {
      console.error('Error ending session:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!sessionActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sales Training Session</h1>
          <p className="text-xl text-gray-600 mb-8">Practice your pitch with Austin</p>
          <button
            onClick={startSession}
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50"
          >
            {loading ? 'Starting...' : 'Start Training Session'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Left Panel - ElevenLabs Agent */}
        <div className="w-2/5 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Austin Rodriguez</h2>
                <p className="text-sm opacity-90">Suburban Homeowner</p>
              </div>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex-1 bg-gray-100 relative flex items-center justify-center">
            {sessionActive ? (
              <div className="text-center">
                <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <div className={`w-24 h-24 bg-white rounded-full flex items-center justify-center ${isRecording ? 'animate-pulse' : ''}`}>
                    {isRecording ? (
                      <Mic className="w-12 h-12 text-blue-500" />
                    ) : (
                      <MicOff className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Austin Rodriguez</h3>
                <p className="text-gray-500">
                  {isRecording ? 'Listening...' : 'Connection ready'}
                </p>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Volume2 className="w-12 h-12" />
                </div>
                <p>Click Start to begin conversation</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Metrics */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <span className="text-2xl font-mono font-semibold">{formatDuration(metrics.duration)}</span>
                </div>
              </div>
              <button
                onClick={endSession}
                disabled={loading}
                className="px-6 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Ending...' : 'End Session'}
              </button>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-4 gap-4">
              <MetricCard
                title="Interruptions"
                value={metrics.interruptionCount}
                icon={<AlertCircle className="w-5 h-5" />}
                color="green"
              />
              <MetricCard
                title="Objections"
                value={metrics.objectionCount}
                icon={<MessageSquare className="w-5 h-5" />}
                color="yellow"
              />
              <MetricCard
                title="Key Moments"
                value="0/3"
                icon={<Target className="w-5 h-5" />}
                color="yellow"
              />
              <MetricCard
                title="Trend"
                value="Neutral"
                icon={<TrendingUp className="w-5 h-5" />}
                color="yellow"
              />
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Transcript</h3>
            <div className="space-y-3">
              <AnimatePresence>
                {transcript.map((entry, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        entry.speaker === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{entry.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {transcript.length === 0 && sessionActive && (
                <p className="text-gray-500 text-center">Conversation will appear here...</p>
              )}
              {!sessionActive && (
                <p className="text-gray-500 text-center">Start a session to see the conversation</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}