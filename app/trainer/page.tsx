'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'
import { Mic, MicOff, Clock, Volume2, VolumeX } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MetricCard } from '@/components/trainer/MetricCard'
import { KeyMomentFlag } from '@/components/trainer/KeyMomentFlag'
import { TranscriptEntry, SessionMetrics } from '@/lib/trainer/types'
import { AlertCircle, MessageSquare, Target, TrendingUp } from 'lucide-react'
// ElevenLabs ConvAI widget will be embedded directly in the left panel

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
  const [micPermissionGranted, setMicPermissionGranted] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [user, setUser] = useState<any>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const durationInterval = useRef<NodeJS.Timeout | null>(null)
  const audioContext = useRef<AudioContext | null>(null)
  const mediaStream = useRef<MediaStream | null>(null)
  // elevenLabsWs removed in favor of @elevenlabs/react; guard audio capture

  useEffect(() => {
    fetchUser()
    
    // Auto-start if coming from pre-session
    if (searchParams.get('autostart') === 'true') {
      setTimeout(() => initializeSession(), 500)
    }
    
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current)
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

  const initializeSession = async () => {
    setIsInitializing(true)
    try {
      // Request microphone permission early for smoother widget experience
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaStream.current = stream
        setMicPermissionGranted(true)
      } catch {}

      // Create session record and show conversation UI (metrics timer)
      const newId = await createSessionRecord()
      setSessionId(newId)
      setSessionActive(true)
      setIsInitializing(false)
      durationInterval.current = setInterval(() => {
        setMetrics(prev => ({ ...prev, duration: prev.duration + 1 }))
      }, 1000)
    } catch (error) {
      console.error('Error initializing session:', error)
      setIsInitializing(false)
    }
  }

  const playAudio = (src: string) => {
    return new Promise<void>((resolve) => {
      const audio = new Audio(src)
      audio.autoplay = true
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
      audio.play().catch(() => resolve())
    })
  }

  // Removed custom audio/WebSocket playback in favor of official embed

  const addToTranscript = (speaker: 'user' | 'austin', text: string) => {
    const entry: TranscriptEntry = {
      speaker,
      text,
      timestamp: new Date(),
      sentiment: 'neutral'
    }
    setTranscript(prev => [...prev, entry])
  }

  const createSessionRecord = async () => {
    try {
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
        return (session as any).id
      } else {
        return (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
          ? (crypto as any).randomUUID()
          : `${Date.now()}`
      }
    } catch (error) {
      console.error('Error creating session:', error)
      return null
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

  // Loading screen for microphone permissions
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto animate-pulse">
            <Mic className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Setting Up Your Session</h1>
          <p className="text-xl text-gray-600 mb-4">
            {!micPermissionGranted ? 'Please allow microphone access to continue' : 'Connecting to Austin...'}
          </p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (!sessionActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sales Training Session</h1>
          <p className="text-xl text-gray-600 mb-8">Practice your pitch with Austin</p>
          <button
            onClick={initializeSession}
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
            {/* ElevenLabs ConvAI Widget via HTML injection to support custom element */}
            <div id="ela-container" className="pointer-events-auto" />
            <Script id="ela-embed" strategy="afterInteractive">
              {`
                (function(){
                  const mount = () => {
                    const container = document.getElementById('ela-container');
                    if (!container) return;
                    if (container.dataset.mounted === '1') return;
                    container.dataset.mounted = '1';
                    container.innerHTML = ` +
                    "`<elevenlabs-convai agent-id=\"agent_7001k5jqfjmtejvs77jvhjf254tz\" variant=\"tiny\" expandable=\"never\" action-text=\"\" start-call-text=\"\" end-call-text=\"\" expand-text=\"\" listening-text=\"\" speaking-text=\"\" avatar-orb-color-1=\"#4D9CFF\" avatar-orb-color-2=\"#9CE6E6\" id=\"ela-orb\"></elevenlabs-convai>`" + `;
                  };
                  const ready = () => {
                    mount();
                    setTimeout(mount, 300);
                  };
                  if (!window.__ela_loaded) {
                    const s = document.createElement('script');
                    s.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
                    s.async = true;
                    s.onload = ready;
                    document.body.appendChild(s);
                    window.__ela_loaded = true;
                  } else {
                    ready();
                  }
                })();
              `}
            </Script>
            <style jsx global>{`
              #ela-orb { position: static; transform: scale(1.6); transform-origin: center; animation: ela-float 4.5s ease-in-out infinite; }
              #ela-orb:focus { outline: none; }
              @keyframes ela-float { 0%{transform: scale(1.6) translateY(0);} 50%{transform: scale(1.6) translateY(-6px);} 100%{transform: scale(1.6) translateY(0);} }
            `}</style>
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