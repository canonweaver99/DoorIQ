'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import ElevenLabsConversation from '@/components/trainer/ElevenLabsConversation'
import WebcamRecorder from '@/components/trainer/WebcamRecorder'
import { createClient } from '@/lib/supabase/client'
import { TranscriptEntry } from '@/lib/trainer/types'
import { useSubscription, useSessionLimit } from '@/hooks/useSubscription'
import { PaywallModal } from '@/components/subscription'
import { PERSONA_METADATA, type AllowedAgentName } from '@/components/trainer/personas'
import { COLOR_VARIANTS } from '@/components/ui/background-circles'

interface Agent {
  id: string
  name: string
  persona: string | null
  eleven_agent_id: string
  is_active: boolean
}

function TrainerPageContent() {
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [conversationToken, setConversationToken] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)

  const durationInterval = useRef<NodeJS.Timeout | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const signedUrlAbortRef = useRef<AbortController | null>(null)
  
  const subscription = useSubscription()
  const sessionLimit = useSessionLimit()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    fetchAgents()
    return () => {
      if (durationInterval.current) clearInterval(durationInterval.current)
      signedUrlAbortRef.current?.abort()
    }
  }, [])

  const fetchAgents = async () => {
    try {
      const agentParam = searchParams.get('agent')
      const { data: agents } = await supabase
        .from('agents')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (agentParam) {
        const match = agents?.find((agent: Agent) => agent.eleven_agent_id === agentParam)
        setSelectedAgent(match || agents?.[0] || null)
      } else {
        setSelectedAgent(agents?.[0] || null)
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }

  const pushFinal = useCallback((text: string | null | undefined, speaker: 'user' | 'homeowner' = 'homeowner') => {
    if (!text || typeof text !== 'string' || !text.trim()) return

    const entry: TranscriptEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      speaker,
      text: text.trim(),
      timestamp: new Date(),
    }
    setTranscript(prev => [...prev, entry])
    
    // Removed auto-scroll behavior - user can manually scroll if needed
  }, [])

  useEffect(() => {
    const handleUserEvent = (e: any) => {
      if (e?.detail && typeof e.detail === 'string' && e.detail.trim()) {
        pushFinal(e.detail, 'user')
      }
    }

    const handleAgentEvent = (e: any) => {
      if (e?.detail && typeof e.detail === 'string' && e.detail.trim()) {
        pushFinal(e.detail, 'homeowner')
      }
    }

    window.addEventListener('agent:user', handleUserEvent)
    window.addEventListener('agent:response', handleAgentEvent)

    return () => {
      window.removeEventListener('agent:user', handleUserEvent)
      window.removeEventListener('agent:response', handleAgentEvent)
    }
  }, [pushFinal])

  useEffect(() => {
    const handleEndSessionRequest = () => {
      if (sessionActive) endSession()
    }
    window.addEventListener('trainer:end-session-requested', handleEndSessionRequest)
    return () => window.removeEventListener('trainer:end-session-requested', handleEndSessionRequest)
  }, [sessionActive])

  // Auto-scroll transcript to bottom when new messages arrive
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [transcript])

  const fetchConversationToken = async (agentId: string): Promise<{ conversationToken: string | null; canProceed: boolean; error?: string }> => {
    signedUrlAbortRef.current?.abort()
    const controller = new AbortController()
    signedUrlAbortRef.current = controller

    try {
      const response = await fetch('/api/eleven/conversation-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to get conversation token' }))
        return { conversationToken: null, canProceed: false, error: error?.error || 'Failed to get conversation token' }
      }

      const payload = await response.json()
      if (!payload?.conversation_token) {
        return { conversationToken: null, canProceed: false, error: 'No token received' }
      }
      
      return { conversationToken: payload.conversation_token, canProceed: true }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { conversationToken: null, canProceed: false, error: 'Request cancelled' }
      }
      return { conversationToken: null, canProceed: false, error: error?.message || 'Network error' }
    }
  }

  const startSession = async () => {
    if (!selectedAgent?.eleven_agent_id) {
      alert('Please select an agent first')
      return
    }

    try {
      setLoading(true)
      setTranscript([])
      setDuration(0)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login?next=/trainer')
          setLoading(false)
          return
        }

      if (!subscription.hasActiveSubscription && !sessionLimit.loading) {
        if (!sessionLimit.canStartSession) {
          setShowPaywall(true)
          setLoading(false)
          return
        }
      }

      const tokenPromise = fetchConversationToken(selectedAgent.eleven_agent_id)

      // Play knock sound
      try {
        const knockAudio = new Audio('/sounds/knock.mp3')
        knockAudio.volume = 0.5
        await knockAudio.play()
        await new Promise(resolve => setTimeout(resolve, 800))
      } catch (e) {
        console.log('Could not play knock sound:', e)
      }

      // Play door open sound
      try {
        const doorOpenAudio = new Audio('/sounds/door_open.mp3')
        doorOpenAudio.volume = 0.4
        await doorOpenAudio.play()
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (e) {
        console.log('Could not play door open sound:', e)
      }

      const result = await tokenPromise
      
      if (!result.canProceed) {
        throw new Error(result.error || 'Failed to initialize connection')
      }
      
      if (result.conversationToken) {
        setConversationToken(result.conversationToken)
      } else {
        throw new Error('No conversation token received')
      }
      
      const newId = await createSessionRecord()
      if (!newId) {
        throw new Error('Failed to create session')
      }
      
      setSessionId(newId)
      setSessionActive(true)
      setLoading(false)
      
        if (!subscription.hasActiveSubscription) {
          try {
            await fetch('/api/session/increment', { method: 'POST' })
            await sessionLimit.refresh()
          } catch (error) {
            console.error('Error incrementing session count:', error)
          }
      }

      durationInterval.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)

      window.dispatchEvent(new CustomEvent('trainer:start-conversation', {
        detail: {
          agentId: selectedAgent.eleven_agent_id,
          conversationToken: result.conversationToken,
        },
      }))
    } catch (error: any) {
      console.error('Error starting session:', error)
      alert(`Failed to start session: ${error?.message || 'Unknown error'}`)
      setLoading(false)
      setConversationToken(null)
      setSessionActive(false)
    }
  }

  const createSessionRecord = async () => {
    try {
      const resp = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_name: selectedAgent?.name }),
      })
      
      if (!resp.ok) throw new Error('Failed to create session')
      
      const json = await resp.json()
      return json.id
    } catch (error) {
      console.error('Error creating session:', error)
      return null
    }
  }

  const endSession = useCallback(async () => {
    setLoading(true)
    setSessionActive(false)
    setConversationToken(null)

    if (durationInterval.current) clearInterval(durationInterval.current)
      if (signedUrlAbortRef.current) {
        signedUrlAbortRef.current.abort()
        signedUrlAbortRef.current = null
      }

      if (sessionId) {
        try {
        await fetch('/api/session', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: sessionId,
              transcript: transcript,
              duration_seconds: duration
            }),
          })
        router.push(`/trainer/loading/${sessionId}`)
        } catch (error) {
        console.error('Error ending session:', error)
        setLoading(false)
      }
      } else {
        router.push('/trainer')
        setLoading(false)
      }
  }, [sessionId, duration, transcript, router])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        reason="session_limit"
      />

      {/* Top Controls Bar */}
      <div className="w-full px-6 py-3 flex justify-between items-center">
        <button
          onClick={endSession}
          disabled={loading || !sessionActive}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all"
        >
          {loading ? 'Ending...' : 'End Session'}
        </button>
        <div className="text-sm text-slate-400 font-mono">
          {sessionActive ? formatDuration(duration) : '0:00'}
        </div>
      </div>

      {/* Main Content Area - Split Screen */}
      <div className="flex-1 flex gap-6 px-6 pb-3 pt-4 overflow-hidden">
        
        {/* Left Side - Agent and Transcript - 50% width */}
        <div className="flex-1 flex flex-col space-y-4 max-w-[50%]">
        
        {/* Agent Orb/Bubble with Animated Rings */}
        <div className="flex flex-col items-center pt-4">
          {(() => {
            const agentMeta = selectedAgent?.name ? PERSONA_METADATA[selectedAgent.name as AllowedAgentName] : null
            const colorVariant = agentMeta?.bubble.color || 'primary'
            const variantStyles = COLOR_VARIANTS[colorVariant]
            
            return (
              <div className="relative">
                <div 
                  id="conversation-orb"
                  onClick={!sessionActive && !loading ? startSession : undefined}
                  className={`
                    relative w-56 h-56
                    ${!sessionActive && !loading ? 'cursor-pointer' : ''}
                  `}
                >
                  {/* Animated concentric rings */}
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className={`
                        absolute inset-0 rounded-full border-2 bg-gradient-to-br to-transparent
                        ${variantStyles.border[i]}
                        ${variantStyles.gradient}
                      `}
                      animate={{
                        rotate: 360,
                        scale: sessionActive ? [1, 1.05, 1] : 1,
                      }}
                      transition={{
                        rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                        scale: sessionActive ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {},
                      }}
                      style={{ opacity: 0.7 }}
                    >
                      <div className={`absolute inset-0 rounded-full mix-blend-screen bg-[radial-gradient(ellipse_at_center,${variantStyles.gradient.replace("from-", "")}/12%,transparent_70%)]`} />
                    </motion.div>
                  ))}
                  
                  {/* Avatar container */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl">
                      {loading ? (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center">
                          <div className="text-white text-center pointer-events-none">
                            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-white mx-auto mb-4"></div>
                            <p className="text-sm">Connecting...</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Rotating gradient overlay */}
                          <div className="absolute inset-0 rounded-full overflow-hidden">
                            <div className={`absolute inset-[-12%] rounded-full bg-gradient-to-br ${variantStyles.gradient} to-transparent opacity-60 mix-blend-screen hero-gradient-spin`} />
                            <div className={`absolute inset-[-8%] rounded-full bg-gradient-to-tr ${variantStyles.gradient} to-transparent opacity-35 mix-blend-screen hero-gradient-spin reverse`} />
                          </div>
                          {/* Agent profile image */}
                          {selectedAgent?.name && agentMeta?.bubble.image && (
                            <Image
                              src={agentMeta.bubble.image}
                              alt={selectedAgent.name}
                              fill
                              className="object-cover relative z-10"
                              priority
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Knock Button - replaces name/subtitle when not active */}
                {selectedAgent && (
                  <div className="mt-3 text-center">
                    {!sessionActive && !loading ? (
                      <button
                        onClick={startSession}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg hover:shadow-emerald-500/50"
                      >
                        Knock on {selectedAgent.name}'s Door
                      </button>
                    ) : (
                      <>
                        <p className="text-slate-300 text-lg font-medium">{selectedAgent.name}</p>
                        {agentMeta && (
                          <p className="text-slate-500 text-sm mt-1">{agentMeta.bubble.subtitle}</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* Live Transcript */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 flex-1 flex flex-col overflow-hidden">
            <h3 className="text-slate-400 text-sm font-semibold mb-4 uppercase tracking-wide">Live Transcript</h3>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {transcript.length === 0 ? (
                <div className="text-center text-slate-500 py-12">
                  {sessionActive ? (
                    <p>Waiting for conversation to begin...</p>
                  ) : (
                    <p>Click the orb above to start your practice session with {selectedAgent?.name || 'the agent'}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {transcript.map((entry) => {
                    const isUser = entry.speaker === 'user'
                    return (
                      <div
                        key={entry.id}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-xl ${
                            isUser
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-700/80 text-slate-100'
                          }`}
                        >
                          <div className="text-[10px] font-semibold mb-1 opacity-60 uppercase tracking-wide">
                            {isUser ? 'You' : selectedAgent?.name || 'Agent'}
                          </div>
                          <div className="text-sm leading-relaxed">{entry.text}</div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={transcriptEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
        </div>

        {/* Right Side - Webcam - 50% width */}
        <div className="flex-1 flex flex-col max-w-[50%]">
          <WebcamRecorder sessionActive={sessionActive} />
        </div>
        
      </div>

      {/* Hidden ElevenLabs Component */}
      {sessionActive && conversationToken && selectedAgent?.eleven_agent_id && (
              <ElevenLabsConversation 
                agentId={selectedAgent.eleven_agent_id} 
                conversationToken={conversationToken} 
                sessionId={sessionId}
                autostart 
              />
            )}

            <style jsx global>{`
              @keyframes fadeIn {
                from {
                  opacity: 0;
                  transform: translateY(10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              .animate-fadeIn {
                animation: fadeIn 0.3s ease-out;
              }
            `}</style>
    </div>
  )
}

export default function TrainerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading session...</p>
        </div>
      </div>
    }>
      <TrainerPageContent />
    </Suspense>
  )
}
