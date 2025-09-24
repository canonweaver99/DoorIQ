'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mic, MicOff, Clock, Volume2, VolumeX } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MetricCard } from '@/components/trainer/MetricCard'
import { KeyMomentFlag } from '@/components/trainer/KeyMomentFlag'
import { TranscriptEntry, SessionMetrics } from '@/lib/trainer/types'
import { AlertCircle, MessageSquare, Target, TrendingUp } from 'lucide-react'

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
  const supabase = createClient()
  const durationInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchUser()
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current)
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

  const startSession = async () => {
    setLoading(true)
    try {
      const { data: session, error } = await (supabase as any)
        .from('training_sessions')
        .insert({
          user_id: user.id,
          scenario_type: 'standard',
        } as any)
        .select()
        .single()

      if (error) throw error

      setSessionId((session as any).id)
      setSessionActive(true)
      setIsRecording(true)

      durationInterval.current = setInterval(() => {
        setMetrics(prev => ({ ...prev, duration: prev.duration + 1 }))
      }, 1000)
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
          <p className="text-xl text-gray-600 mb-8">Practice your pitch with Amanda</p>
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
                <h2 className="text-xl font-semibold">Amanda Rodriguez</h2>
                <p className="text-sm opacity-90">Suburban Mom</p>
              </div>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex-1 bg-gray-100 relative">
            <iframe
              src="https://elevenlabs.io/app/agents/agent_7001k5jqfjmtejvs77jvhjf254tz/embed"
              className="w-full h-full"
              allow="autoplay; microphone; clipboard-read; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              style={{ border: 'none' }}
            />
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Active</h3>
            <p className="text-gray-600">Speak naturally with Amanda. Your conversation is being analyzed in real-time.</p>
          </div>
        </div>
      </div>
    </div>
  )
}