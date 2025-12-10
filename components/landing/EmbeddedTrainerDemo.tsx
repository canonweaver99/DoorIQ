'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'

// Dynamically import only what we need
const ElevenLabsConversation = dynamic(() => import('@/components/trainer/ElevenLabsConversation'), {
  ssr: false
})

interface EmbeddedTrainerDemoProps {
  sessionId: string
  agentId: string
  agentName: string
}

export function EmbeddedTrainerDemo({ sessionId, agentId, agentName }: EmbeddedTrainerDemoProps) {
  const [sessionActive, setSessionActive] = useState(false)
  const [conversationToken, setConversationToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [transcript, setTranscript] = useState<any[]>([])
  const [duration, setDuration] = useState(0)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [])

  const handleKnock = async () => {
    try {
      setLoading(true)

      // Get conversation token
      const tokenResponse = await fetch('/api/eleven/conversation-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          is_free_demo: true
        })
      })

      if (!tokenResponse.ok) {
        throw new Error('Failed to get conversation token')
      }

      const tokenData = await tokenResponse.json()
      setConversationToken(tokenData.conversation_token)
      setSessionActive(true)
      setLoading(false)

      // Start timer
      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)

      // Listen for transcript events
      const handleUserEvent = (e: any) => {
        if (e?.detail) {
          setTranscript(prev => [...prev, { speaker: 'user', text: e.detail, timestamp: new Date() }])
        }
      }

      const handleAgentEvent = (e: any) => {
        if (e?.detail) {
          setTranscript(prev => [...prev, { speaker: 'homeowner', text: e.detail, timestamp: new Date() }])
        }
      }

      window.addEventListener('agent:user', handleUserEvent)
      window.addEventListener('agent:response', handleAgentEvent)

      return () => {
        window.removeEventListener('agent:user', handleUserEvent)
        window.removeEventListener('agent:response', handleAgentEvent)
      }
    } catch (error) {
      console.error('Error starting session:', error)
      setLoading(false)
      alert('Failed to start demo session')
    }
  }

  const handleEndSession = async () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
    }

    // Save session
    await fetch('/api/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: sessionId,
        transcript,
        duration_seconds: duration,
        end_reason: 'user_ended'
      })
    })

    // Trigger grading
    fetch('/api/grade/simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    }).catch(() => {})

    // Redirect to feedback after a short delay
    setTimeout(() => {
      window.parent.location.href = `/demo/feedback/${sessionId}`
    }, 1000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full h-full bg-black flex flex-col overflow-hidden" style={{ height: '100vh', maxHeight: '100%' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm">{agentName}</h2>
            <p className="text-white/60 text-xs">Live Session</p>
          </div>
        </div>
        {sessionActive && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-lg border border-red-500/30">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-400 text-xs font-mono font-bold">{formatTime(duration)}</span>
            </div>
            <button
              onClick={handleEndSession}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-white text-sm font-medium transition-colors"
            >
              End Session
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
        {!sessionActive ? (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white text-xl font-bold mb-2">Ready to Practice?</h3>
              <p className="text-white/60 text-sm mb-6">Click below to start your demo session</p>
              <button
                onClick={handleKnock}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Starting...' : 'Knock on Door'}
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col">
            {/* Agent Video/Image Area */}
            <div className="flex-1 bg-slate-900 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
              <img
                src="/Austin Boss.png"
                alt={agentName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Transcript Area */}
            <div className="h-32 bg-slate-900/50 rounded-lg p-4 overflow-y-auto">
              {transcript.length === 0 ? (
                <p className="text-white/40 text-sm text-center">Conversation will appear here...</p>
              ) : (
                <div className="space-y-2">
                  {transcript.map((entry, idx) => (
                    <div
                      key={idx}
                      className={`text-sm ${
                        entry.speaker === 'user' ? 'text-blue-400' : 'text-white'
                      }`}
                    >
                      <span className="font-semibold">
                        {entry.speaker === 'user' ? 'You: ' : `${agentName}: `}
                      </span>
                      {entry.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ElevenLabs Conversation Component (hidden but active) */}
      {sessionActive && conversationToken && (
        <div className="hidden">
          <ElevenLabsConversation
            agentId={agentId}
            conversationToken={conversationToken}
            autostart={true}
            sessionId={sessionId}
            sessionActive={sessionActive}
            onAgentEndCall={handleEndSession}
          />
        </div>
      )}
    </div>
  )
}
