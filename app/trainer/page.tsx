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
    'No Problem Nancy': '/No Problem Nancy Black.png',
    'Already Got It Alan': '/Already got it Alan landscape.png',
    'Not Interested Nick': '/Not Interested Nick.png',
    'DIY Dave': '/DIY DAVE.png',
    'Too Expensive Tim': '/Too Expensive Tim.png',
    'Spouse Check Susan': '/Spouse Check Susan.png',
    'Busy Beth': '/Busy Beth.png',
    'Renter Randy': '/Renter Randy.png',
    'Skeptical Sam': '/Skeptical Sam.png',
    'Just Treated Jerry': '/Just Treated Jerry.png',
    'Think About It Tina': '/Think About It Tina.png',
    'Veteran Victor': '/Veteran Victor Landcape.png',
    'English Second Language Elena': '/agents/elena.png',
    'Tag Team Tanya & Tom': '/agents/tanya-tom.png',
    'Comparing Carl': '/agents/carl.png'
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
  const endCallProcessingRef = useRef(false) // Track if end call is being processed
  
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

  const endSession = useCallback(async (endReason?: string) => {
    console.log('🔚 endSession called', { 
      sessionId, 
      duration, 
      transcriptLength: transcript.length,
      endReason: endReason || 'manual'
    })
    
    // Prevent multiple calls - but allow if we have sessionId even if sessionActive is false
    if (!sessionId) {
      console.log('⚠️ endSession called but no sessionId, ignoring')
      return
    }
    
    // Reset processing flag when starting endSession
    endCallProcessingRef.current = false
    
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
            duration_seconds: duration,
            end_reason: endReason || 'manual'
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

  // Track agent mode for speaking detection
  const agentModeRef = useRef<'speaking' | 'listening' | 'idle' | null>(null)
  
  // Handle agent end call event with improved reliability
  useEffect(() => {
    let silenceTimer: NodeJS.Timeout | null = null
    let lastActivityTime = Date.now()
    let goodbyeCheckAttempts = 0 // Track goodbye confirmation attempts
    
    const handleEndSessionRequest = () => {
      if (sessionActive && sessionId) {
        console.log('🔚 Manual end session requested')
        endSession()
      }
    }
    
    // Listen for agent mode changes to track speaking status
    const handleAgentMode = (e: any) => {
      const mode = e?.detail || e
      agentModeRef.current = mode === 'speaking' ? 'speaking' : (mode === 'listening' ? 'listening' : 'idle')
      console.log('🎙️ Agent mode changed:', agentModeRef.current)
    }
    
    window.addEventListener('agent:mode', handleAgentMode)
    
    const handleAgentEndCall = async (e: any) => {
      console.log('📞 handleAgentEndCall triggered', { 
        sessionActive, 
        sessionId, 
        eventDetail: e?.detail,
        alreadyProcessing: endCallProcessingRef.current,
        currentAgentMode: agentModeRef.current
      })
      
      // Prevent duplicate processing
      if (endCallProcessingRef.current) {
        console.log('⚠️ Already processing end_call, ignoring duplicate')
        return
      }
      
      // Only require sessionId - don't check sessionActive as it might be false already
      if (!sessionId) {
        console.log('⚠️ Received end_call event but no sessionId, ignoring')
        return
      }
      
      // Set processing flag immediately to prevent duplicates
      endCallProcessingRef.current = true
      
      console.log('🚪 Agent ended call - waiting for agent to finish speaking...')
      
      // Clear any silence timers
      if (silenceTimer) {
        clearTimeout(silenceTimer)
        silenceTimer = null
      }
      
      // Play door closing sound (non-blocking - don't wait for it)
      try {
        const doorCloseAudio = new Audio('/sounds/door_close.mp3')
        doorCloseAudio.volume = 0.6
        doorCloseAudio.play().catch((err) => {
          console.warn('Could not play door close sound', err)
        })
      } catch (error) {
        console.warn('Could not play door close sound', error)
      }
      
      // Wait for agent to finish speaking before ending session
      const waitForAgentToFinish = async () => {
        const maxWaitTime = 8000 // Maximum 8 seconds wait
        const checkInterval = 200 // Check every 200ms
        const startTime = Date.now()
        
        return new Promise<void>((resolve) => {
          const checkIfDoneSpeaking = () => {
            const elapsed = Date.now() - startTime
            const isStillSpeaking = agentModeRef.current === 'speaking'
            
            if (!isStillSpeaking || elapsed >= maxWaitTime) {
              const reason = elapsed >= maxWaitTime ? 'timeout' : 'agent_finished_speaking'
              console.log(`🔚 Agent finished speaking (${reason}), elapsed: ${elapsed}ms`)
              resolve()
            } else {
              console.log(`⏳ Agent still speaking (${elapsed}ms elapsed)...`)
              setTimeout(checkIfDoneSpeaking, checkInterval)
            }
          }
          
          // Start checking after a brief initial delay
          setTimeout(checkIfDoneSpeaking, 500)
        })
      }
      
      // Wait for agent to finish, with a minimum delay of 3 seconds and max of 8 seconds
      await waitForAgentToFinish()
      
      // Additional buffer delay to ensure audio completes
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Set session inactive before ending
      setSessionActive(false)
      
      // End the session after agent finishes speaking
      console.log('🔚 Calling endSession after agent finished speaking...')
      const reason = e?.detail?.reason || 'Unknown'
      console.log('📊 END CALL TRIGGER DETAIL:', reason)
      endSession(reason).catch((error) => {
        console.error('❌ Error in endSession from handleAgentEndCall:', error)
      })
    }
    
    // Track agent and user activity - increased timeout to prevent premature endings
    const handleAgentActivity = () => {
      lastActivityTime = Date.now()
      // Reset the silence timer when agent or user is active
      if (silenceTimer) {
        clearTimeout(silenceTimer)
        silenceTimer = null
      }
      if (sessionActive && sessionId) {
        silenceTimer = setTimeout(() => {
          const timeSinceLastActivity = Date.now() - lastActivityTime
          // Increased to 30 seconds - allows for natural conversation pauses
          // Only trigger if we've had actual silence (not just processing time)
          if (sessionActive && sessionId && timeSinceLastActivity >= 30000) {
            console.log('⏱️ No activity for 30 seconds, auto-ending session...')
            console.log('📊 END CALL TRIGGER: Silence timeout (30 seconds)')
            handleAgentEndCall({ detail: { reason: 'Extended silence detected' } })
          }
        }, 30000) // 30 seconds timeout
      }
    }
    
    // Listen for agent messages to track activity
    // Listen to BOTH agent:message AND agent:response events (both are dispatched)
    const handleAgentMessage = (e: any) => {
      console.log('📨 Agent message/response received, resetting activity timer')
      handleAgentActivity()
    }
    
    // Also listen for agent:response events (the main one that's dispatched)
    const handleAgentResponse = (e: any) => {
      console.log('📨 Agent response received, resetting activity timer')
      handleAgentActivity()
      
      // Check the response text for goodbye phrases - but require confirmation
      // Only trigger on clear ending phrases, not ambiguous ones
      if (e?.detail && typeof e.detail === 'string') {
        const text = e.detail.toLowerCase()
        // Only very clear ending phrases - removed ambiguous ones
        const clearEndingPhrases = [
          'goodbye', 'bye bye', 'see you later', 'talk to you later',
          'closing the door', 'close the door now', 'thanks for stopping by',
          "we're done here", "that's all for today", 'have a good day', 'have a nice day'
        ]
        // Check if the message ENDS with a clear goodbye phrase (not just contains it)
        const endsWithGoodbye = clearEndingPhrases.some(phrase => {
          return text.endsWith(phrase) || text.trim().endsWith(phrase + '.') || text.trim().endsWith(phrase + '!')
        })
        
        if (endsWithGoodbye) {
          console.log('🔚 Agent response ends with clear goodbye phrase, ending in 3 seconds...')
          console.log('📊 END CALL TRIGGER: Goodbye phrase detected in agent response')
          setTimeout(() => {
            if (sessionActive && sessionId) {
              handleAgentEndCall({ detail: { reason: 'Agent clearly ended conversation' } })
            }
          }, 3000) // Increased delay to ensure it's really ending
        }
      }
    }
    
    // Listen for user activity too (they might be speaking)
    const handleUserActivity = (e: any) => {
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
              console.log('📊 END CALL TRIGGER: Connection lost/disconnected')
              handleAgentEndCall({ detail: { reason: 'Connection lost', source: 'disconnect' } })
            }
        }, 2000) // 2 second delay to allow end_call event to process first
      }
    }
    
    // Check transcript for goodbye phrases (backup method) - less aggressive
    // Only check if we haven't seen activity in a while
    const checkForEndCall = () => {
      // Only check if it's been at least 20 seconds since last activity
      const timeSinceActivity = Date.now() - lastActivityTime
      if (timeSinceActivity < 20000) {
        return // Too soon, don't check
      }
      
      // Check if transcript ends with agent (homeowner) saying goodbye/ending phrases
      if (transcript.length > 0) {
        // Find the last few messages from the agent
        const lastAgentMessages = [...transcript]
          .reverse()
          .filter((msg: TranscriptEntry) => msg.speaker === 'homeowner')
          .slice(0, 3) // Check last 3 agent messages
        
        if (lastAgentMessages.length > 0) {
          const lastText = (lastAgentMessages[0].text || '').toLowerCase().trim()
          // Only very clear ending phrases
          const clearEndingPhrases = [
            'goodbye', 'bye bye', 'see you later', 'talk to you later',
            'closing the door', 'close the door now', 'thanks for stopping by',
            "we're done here", "that's all for today", 'have a good day', 'have a nice day'
          ]
          
          // Check if the LAST message ends with a clear goodbye
          const endsWithGoodbye = clearEndingPhrases.some(phrase => {
            return lastText.endsWith(phrase) || 
                   lastText.endsWith(phrase + '.') || 
                   lastText.endsWith(phrase + '!')
          })
          
          if (endsWithGoodbye) {
            goodbyeCheckAttempts++
            // Require multiple confirmations (check 3 times = 6 seconds)
            if (goodbyeCheckAttempts >= 3) {
              console.log('🔚 Agent clearly ended conversation (transcript check), auto-ending session...')
              console.log('📊 END CALL TRIGGER: Goodbye phrase confirmed in transcript (3 checks)')
              setTimeout(() => {
                if (sessionActive && sessionId) {
                  handleAgentEndCall({ detail: { reason: 'Agent ended conversation (transcript confirmation)' } })
                }
              }, 3000)
              goodbyeCheckAttempts = 0 // Reset
            }
          } else {
            goodbyeCheckAttempts = 0 // Reset if no goodbye detected
          }
        }
      }
    }
    
    // Check for end call periodically - less frequent
    const endCallCheckInterval = setInterval(() => {
      if (sessionActive && sessionId) {
        checkForEndCall()
      }
    }, 3000) // Check every 3 seconds (less aggressive)
    
    // Set up initial silence timeout
    if (sessionActive && sessionId) {
      handleAgentActivity() // Initialize timer
    }
    
    // Log when event listeners are attached
    console.log('🎧 Setting up event listeners for auto-end', { sessionActive, sessionId })
    
    // Listen for manual end session requests
    window.addEventListener('trainer:end-session-requested', handleEndSessionRequest)
    
    // Listen for agent end_call events (dispatched from ElevenLabsConversation)
    window.addEventListener('agent:end_call', handleAgentEndCall)
    
    // Listen for agent messages/responses to track activity
    // Note: agent:message is dispatched, but agent:response is the main one with actual text
    window.addEventListener('agent:message', handleAgentMessage)
    window.addEventListener('agent:response', handleAgentResponse) // Main event for agent transcript
    
    // Listen for user activity too (they might be speaking)
    window.addEventListener('agent:user', handleUserActivity)
    
    // Listen for connection status changes
    window.addEventListener('connection:status', handleConnectionStatus)
    
    // Debug: Log all custom events to see what's happening
    const debugListener = (e: Event) => {
      if (e.type.startsWith('agent:') || e.type === 'connection:status' || e.type === 'trainer:') {
        console.log('🎯 Custom event dispatched:', e.type, e instanceof CustomEvent ? e.detail : '')
      }
    }
    window.addEventListener('agent:end_call', debugListener as EventListener, { once: false })
    window.addEventListener('agent:message', debugListener as EventListener, { once: false })
    window.addEventListener('agent:response', debugListener as EventListener, { once: false })
    window.addEventListener('agent:user', debugListener as EventListener, { once: false })
    window.addEventListener('connection:status', debugListener as EventListener, { once: false })
    
    return () => {
      if (silenceTimer) clearTimeout(silenceTimer)
      clearInterval(endCallCheckInterval)
      window.removeEventListener('trainer:end-session-requested', handleEndSessionRequest)
      window.removeEventListener('agent:end_call', handleAgentEndCall)
      window.removeEventListener('agent:message', handleAgentMessage)
      window.removeEventListener('agent:response', handleAgentResponse)
      window.removeEventListener('agent:user', handleUserActivity)
      window.removeEventListener('connection:status', handleConnectionStatus)
      window.removeEventListener('agent:mode', handleAgentMode)
      window.removeEventListener('agent:end_call', debugListener as EventListener)
      window.removeEventListener('agent:message', debugListener as EventListener)
      window.removeEventListener('agent:response', debugListener as EventListener)
      window.removeEventListener('agent:user', debugListener as EventListener)
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
