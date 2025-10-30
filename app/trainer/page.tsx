'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import ElevenLabsConversation from '@/components/trainer/ElevenLabsConversation'
import WebcamRecorder from '@/components/trainer/WebcamRecorder'
// import { useDualCameraRecording } from '@/hooks/useDualCameraRecording' // Archived - re-enable when ready
import { createClient } from '@/lib/supabase/client'
import { TranscriptEntry } from '@/lib/trainer/types'
import { useSubscription, useSessionLimit } from '@/hooks/useSubscription'
import { logger } from '@/lib/logger'
import { PaywallModal } from '@/components/subscription'
import { PERSONA_METADATA, ALLOWED_AGENT_SET, type AllowedAgentName } from '@/components/trainer/personas'
import { COLOR_VARIANTS } from '@/components/ui/background-circles'

interface Agent {
  id: string
  name: string
  persona: string | null
  eleven_agent_id: string
  is_active: boolean
}

const resolveAgentImage = (agent: Agent | null, isLiveSession: boolean = false) => {
  if (!agent) return null

  // ALWAYS USE THESE IMAGES - both pre-session and during session
  const agentImageMap: Record<string, string> = {
    'Austin': '/Austin Boss.png',
    'No Problem Nancy': '/No Problem Nancy.png',
    'Already Got It Alan': '/Already got it Alan landscape.png',
    'Not Interested Nick': '/Not Interested Nick.png',
    'DIY Dave': '/DIY DAVE.png',
    'Too Expensive Tim': '/Too Expensive Tim.png',
    'Spouse Check Susan': '/Spouse Check Susan.png',
    'Busy Beth': '/Busy Beth.png',
    'Renter Randy': '/Renter Randy.png',
    'Skeptical Sam': '/Skeptical Sam.png',
    'Just Treated Jerry': '/Just Treated Jerry.png',
    'Think About It Tina': '/Think About It Tina.png'
  }
  
  if (agentImageMap[agent.name]) {
    console.log(`✅ Using agent image for ${agent.name}:`, agentImageMap[agent.name])
    return agentImageMap[agent.name]
  }

  // For other agents, use the metadata
  const directName = agent.name as AllowedAgentName
  if (ALLOWED_AGENT_SET.has(directName)) {
    const metadata = PERSONA_METADATA[directName]
    const image = metadata?.bubble?.image
    if (image) return image
  }

  if (agent.persona) {
    const personaName = agent.persona as AllowedAgentName
    if (ALLOWED_AGENT_SET.has(personaName)) {
      const metadata = PERSONA_METADATA[personaName]
      const image = metadata?.bubble?.image
      if (image) return image
    }
  }

  // Fallback to generic agent image
  const normalized = agent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return normalized ? `/agents/${normalized}.png` : '/agents/default.png'
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
  
  // Video recording temporarily disabled - archived for future implementation
  // const { isRecording: isVideoRecording, startRecording: startDualCameraRecording, stopRecording: stopDualCameraRecording } = useDualCameraRecording(sessionId)
  const isVideoRecording = false

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
        console.log('🔍 Selected agent by param:', match)
        setSelectedAgent(match || agents?.[0] || null)
      } else {
        console.log('🔍 Selected first agent:', agents?.[0])
        setSelectedAgent(agents?.[0] || null)
      }
    } catch (error) {
      logger.error('Error fetching agents', error)
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

  // Moved to after endSession definition

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
        logger.warn('Could not play knock sound', { error: e })
      }

      // Play door open sound
      try {
        const doorOpenAudio = new Audio('/sounds/door_open.mp3')
        doorOpenAudio.volume = 0.4
        await doorOpenAudio.play()
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (e) {
        logger.warn('Could not play door open sound', { error: e })
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
            logger.error('Error incrementing session count', error)
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
      logger.error('Error starting session', error)
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
      logger.error('Error creating session', error)
      return null
    }
  }

  const endSession = useCallback(async () => {
    console.log('🔚 endSession called', { sessionId, duration, transcriptLength: transcript.length })
    
    // Prevent multiple calls
    if (!sessionActive && !sessionId) {
      console.log('⚠️ endSession called but session not active, ignoring')
      return
    }
    
    setLoading(true)
    setSessionActive(false)
    setConversationToken(null)

    // Video recording disabled - archived for future
    // if (isVideoRecording) {
    //   console.log('🛑 Stopping dual camera recording from endSession')
    //   stopDualCameraRecording()
    // }

    if (durationInterval.current) {
      clearInterval(durationInterval.current)
      durationInterval.current = null
    }
    
    if (signedUrlAbortRef.current) {
      signedUrlAbortRef.current.abort()
      signedUrlAbortRef.current = null
    }

    if (sessionId) {
      try {
        console.log('💾 Saving session data before redirect...')
        const savePromise = fetch('/api/session', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: sessionId,
            transcript: transcript,
            duration_seconds: duration
          }),
        })
        
        // Redirect immediately, don't wait for save to complete
        console.log('🚀 Redirecting to loading page:', `/trainer/loading/${sessionId}`)
        const redirectUrl = `/trainer/loading/${sessionId}`
        
        // Try to save in background, but redirect regardless
        savePromise.catch((error) => {
          console.error('❌ Error saving session (continuing with redirect):', error)
        })
        
        // Use window.location.href for reliable redirect (blocking)
        window.location.href = redirectUrl
        
        // Fallback redirect if window.location fails
        setTimeout(() => {
          if (window.location.pathname !== redirectUrl) {
            console.log('⚠️ Primary redirect failed, trying router.push')
            router.push(redirectUrl)
          }
        }, 100)
      } catch (error) {
        logger.error('Error ending session', error)
        console.error('❌ Error in endSession, attempting redirect anyway:', error)
        // Still try to redirect even if there's an error
        window.location.href = `/trainer/loading/${sessionId}`
      }
    } else {
      console.log('⚠️ No sessionId, redirecting to trainer page')
      router.push('/trainer')
      setLoading(false)
    }
  }, [sessionId, duration, transcript, router, sessionActive])

  // Handle agent end call event with improved reliability
  useEffect(() => {
    let silenceTimer: NodeJS.Timeout | null = null
    let lastActivityTime = Date.now()
    
    const handleEndSessionRequest = () => {
      if (sessionActive && sessionId) {
        console.log('🔚 Manual end session requested')
        endSession()
      }
    }
    
    const handleAgentEndCall = async (e: any) => {
      console.log('📞 handleAgentEndCall triggered', { sessionActive, sessionId, eventDetail: e?.detail })
      
      if (!sessionActive) {
        console.log('⚠️ Received end_call event but session not active, ignoring')
        return
      }
      
      if (!sessionId) {
        console.log('⚠️ Received end_call event but no sessionId, ignoring')
        return
      }
      
      console.log('🚪 Agent ended call, playing door close sound...')
      
      // Clear any silence timers
      if (silenceTimer) {
        clearTimeout(silenceTimer)
        silenceTimer = null
      }
      
      // Prevent multiple calls immediately
      setSessionActive(false)
      
      // Play door closing sound (non-blocking - don't wait for it)
      try {
        const doorCloseAudio = new Audio('/sounds/door_close.mp3')
        doorCloseAudio.volume = 0.6
        doorCloseAudio.play().catch((err) => {
          console.warn('Could not play door close sound', err)
        })
        // Don't wait for sound - redirect immediately
      } catch (error) {
        console.warn('Could not play door close sound', error)
      }
      
      // End the session immediately (don't await sound)
      console.log('🔚 Ending session after agent end call...')
      endSession().catch((error) => {
        console.error('❌ Error in endSession from handleAgentEndCall:', error)
        // Force redirect as fallback
        if (sessionId) {
          window.location.href = `/trainer/loading/${sessionId}`
        }
      })
    }
    
    // Track agent activity - improved with shorter timeout
    const handleAgentActivity = () => {
      lastActivityTime = Date.now()
      // Reset the silence timer when agent is active
      if (silenceTimer) {
        clearTimeout(silenceTimer)
        silenceTimer = null
      }
      if (sessionActive && sessionId) {
        silenceTimer = setTimeout(() => {
          const timeSinceLastActivity = Date.now() - lastActivityTime
          // Reduced to 10 seconds for faster auto-end
          if (sessionActive && sessionId && timeSinceLastActivity >= 10000) {
            console.log('⏱️ No agent activity for 10 seconds, auto-ending session...')
            handleAgentEndCall({ detail: { reason: 'Agent stopped responding' } })
          }
        }, 10000)
      }
    }
    
    // Listen for agent messages to track activity
    const handleAgentMessage = (e: any) => {
      handleAgentActivity()
    }
    
    // Listen for connection status changes (disconnect signals from ElevenLabs)
    const handleConnectionStatus = (e: any) => {
      const status = e.detail
      console.log('📊 Connection status changed:', status)
      
      // If we get disconnected during an active session, end the session
      // This catches cases where ElevenLabs disconnects without sending end_call
      if (status === 'disconnected' && sessionActive && sessionId) {
        console.log('🔌 Connection disconnected during active session, ending session...')
        // Small delay to allow for end_call event to come through first (if it exists)
        setTimeout(() => {
          if (sessionActive && sessionId) {
            console.log('🔚 Auto-ending session due to connection disconnect')
            handleAgentEndCall({ detail: { reason: 'Connection lost', source: 'disconnect' } })
          }
        }, 2000) // 2 second delay to allow end_call event to process first
      }
    }
    
    // Also listen for agent end_call events more aggressively
    const checkForEndCall = () => {
      // Check if transcript ends with agent saying goodbye/ending phrases
      if (transcript.length > 0) {
        const lastAgentMessage = [...transcript].reverse().find((msg: TranscriptEntry) => 
          msg.speaker === 'homeowner'
        )
        if (lastAgentMessage) {
          const text = (lastAgentMessage.text || '').toLowerCase()
          // Expanded ending phrases to catch more variations including "Ain't interested, thanks for stopping by"
          const endingPhrases = [
            'bye', 'goodbye', 'see you', 'alright then', 'talk to you', 
            "i'll see you", 'take care', "ain't interested", 'not interested',
            'thanks for stopping', 'stopping by', 'gotta go', 'have to go',
            'gotta get back', 'back to work', 'closing the door', 'close the door',
            'thanks for stopping by'
          ]
          if (endingPhrases.some(phrase => text.includes(phrase))) {
            // Wait 3 seconds after agent's last message before auto-ending
            setTimeout(() => {
              if (sessionActive && sessionId) {
                console.log('🔚 Agent said goodbye, auto-ending session...')
                handleAgentEndCall({ detail: { reason: 'Agent ended conversation' } })
              }
            }, 3000)
          }
        }
      }
    }
    
    // Check for end call periodically
    const endCallCheckInterval = setInterval(() => {
      if (sessionActive && sessionId) {
        checkForEndCall()
      }
    }, 2000) // Check every 2 seconds
    
    // Set up initial silence timeout
    if (sessionActive && sessionId) {
      handleAgentActivity() // Initialize timer
    }
    
    // Log when event listeners are attached
    console.log('🎧 Setting up event listeners for auto-end', { sessionActive, sessionId })
    
    window.addEventListener('trainer:end-session-requested', handleEndSessionRequest)
    window.addEventListener('agent:end_call', handleAgentEndCall)
    window.addEventListener('agent:message', handleAgentMessage)
    window.addEventListener('connection:status', handleConnectionStatus)
    
    // Debug: Log all custom events to see what's happening
    const originalDispatchEvent = window.dispatchEvent
    const debugListener = (e: Event) => {
      if (e.type.startsWith('agent:') || e.type === 'connection:status' || e.type === 'trainer:') {
        console.log('🎯 Custom event dispatched:', e.type, e instanceof CustomEvent ? e.detail : '')
      }
    }
    window.addEventListener('agent:end_call', debugListener as EventListener, { once: false })
    window.addEventListener('agent:message', debugListener as EventListener, { once: false })
    window.addEventListener('connection:status', debugListener as EventListener, { once: false })
    
    return () => {
      if (silenceTimer) clearTimeout(silenceTimer)
      clearInterval(endCallCheckInterval)
      window.removeEventListener('trainer:end-session-requested', handleEndSessionRequest)
      window.removeEventListener('agent:end_call', handleAgentEndCall)
      window.removeEventListener('agent:message', handleAgentMessage)
      window.removeEventListener('connection:status', handleConnectionStatus)
      window.removeEventListener('agent:end_call', debugListener as EventListener)
      window.removeEventListener('agent:message', debugListener as EventListener)
      window.removeEventListener('connection:status', debugListener as EventListener)
    }
  }, [sessionActive, sessionId, endSession, transcript])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        reason="session_limit"
      />

      {/* Hero-Style Session Container */}
      <div className="relative w-full max-w-7xl h-[calc(100vh-3rem)] flex flex-col bg-black/40 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden">
        
        {/* Header with Timer and Controls */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-purple-500/20 flex-shrink-0 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-semibold text-white">
              Live Session - {selectedAgent?.name || 'Training'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300 font-mono">
              Duration: {formatDuration(duration)}
            </span>
            <button
              onClick={endSession}
              disabled={loading || !sessionActive}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all"
            >
              {loading ? 'Ending...' : 'End Session'}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Top Section: Split View - Agent Left, Webcam Right */}
          <div className="grid grid-cols-2 gap-0 border-b border-purple-500/20" style={{ minHeight: '40%' }}>
            
            {/* Left: Agent */}
            <div className="relative border-r border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-transparent">
              {/* Full Agent Image - matching hero preview */}
              <div className="absolute inset-0">
                {loading ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center">
                    <div className="text-white text-center pointer-events-none">
                      <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-white mx-auto mb-4"></div>
                      <p className="text-sm">Connecting...</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    {(() => {
                      const src = resolveAgentImage(selectedAgent, sessionActive)
                      console.log('🖼️ FINAL IMAGE DECISION:', { 
                        sessionActive, 
                        agentName: selectedAgent?.name,
                        imageSrc: src,
                        timestamp: new Date().toISOString()
                      })
                      return src ? (
                      <Image
                        src={src}
                        alt={selectedAgent?.name || 'Agent'}
                        fill
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-cover"
                        style={{ objectFit: 'cover', objectPosition: 'center center' }}
                        priority
                        onError={(e) => console.error('❌ Image failed to load:', src)}
                      />
                      ) : null
                    })()}
                    
                    {/* Knock Button Overlay - centered when not active */}
                    {!sessionActive && !loading && selectedAgent && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <button
                          onClick={startSession}
                          className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-lg rounded-xl transition-all hover:scale-105 shadow-lg hover:shadow-emerald-500/50"
                        >
                          Knock on {selectedAgent.name}'s Door
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Right: Webcam */}
            <div className="relative bg-gradient-to-br from-green-950/20 to-transparent">
              <WebcamRecorder 
                sessionActive={sessionActive} 
                duration={duration}
              />
            </div>
          </div>

          {/* Bottom Section: Live Transcript */}
          <div className="flex flex-col relative flex-1 px-6 py-3" style={{ minHeight: '50%' }}>
            
            {/* Bottom fade gradient overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
              {transcript.length === 0 ? (
                <div className="text-center text-slate-500 py-12">
                  {sessionActive ? (
                    <p>Waiting for conversation to begin...</p>
                  ) : (
                    <p>Knock on {selectedAgent?.name || 'the agent'}'s door to start your practice session</p>
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

      {/* Hidden ElevenLabs Component */}
      {sessionActive && conversationToken && selectedAgent?.eleven_agent_id && (
        <ElevenLabsConversation 
          agentId={selectedAgent.eleven_agent_id} 
          conversationToken={conversationToken} 
          sessionId={sessionId}
          autostart 
        />
      )}
      
      {/* Video recording happens automatically via WebcamRecorder callbacks */}

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
