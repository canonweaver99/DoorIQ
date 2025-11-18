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
import { LastCreditWarningModal } from '@/components/ui/LastCreditWarningModal'
import { OutOfCreditsModal } from '@/components/ui/OutOfCreditsModal'

interface Agent {
  id: string
  name: string
  persona: string | null
  eleven_agent_id: string
  is_active: boolean
}

// Helper function to play audio sounds
function playSound(src: string, volume = 0.9) {
  try {
    const audio = new Audio(src)
    audio.volume = volume
    audio.play().catch(() => {
      // Silently fail if autoplay is blocked
    })
    return audio
  } catch {
    return null
  }
}

const resolveAgentImage = (agent: Agent | null, isLiveSession: boolean = false) => {
  if (!agent) return null

  // ALWAYS USE THESE IMAGES - both pre-session and during session
  const agentImageMap: Record<string, string> = {
    'Average Austin': '/Austin Boss.png',
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
    'Tag Team Tanya & Tom': '/tanya and tom.png'
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
  const [showLastCreditWarning, setShowLastCreditWarning] = useState(false)
  const [showOutOfCredits, setShowOutOfCredits] = useState(false)
  const [videoMode, setVideoMode] = useState<'opening' | 'loop' | 'closing'>('loop') // Track video state for agents with videos
  const loopVideoStartTimeRef = useRef<number>(0) // Track when loop video started playing
  const loopVideoDurationRef = useRef<number>(0) // Track loop video duration
  const [showDoorOpeningVideo, setShowDoorOpeningVideo] = useState(false) // Track when to show door opening video
  const doorOpeningVideoRef = useRef<HTMLVideoElement | null>(null) // Ref for door opening video
  
  // Helper function to check if agent has video animations
  const agentHasVideos = (agentName: string | null | undefined): boolean => {
    return agentName === 'Average Austin' || agentName === 'Tag Team Tanya & Tom' || agentName === 'Veteran Victor' || agentName === 'No Problem Nancy' || agentName === 'Just Treated Jerry' || agentName === 'Already Got It Alan' || agentName === 'Think About It Tina' || agentName === 'Too Expensive Tim' || agentName === 'Skeptical Sam' || agentName === 'Renter Randy' || agentName === 'DIY Dave' || agentName === 'Busy Beth' || agentName === 'Not Interested Nick' || agentName === 'Spouse Check Susan'
  }
  
  // Helper function to get video paths for an agent
  const getAgentVideoPaths = (agentName: string | null | undefined): { loop: string; closing: string; opening?: string } | null => {
    if (agentName === 'Average Austin') {
      return {
        loop: '/austin-loop.mp4',
        closing: '/austin-door-close.mp4',
        opening: '/Austin opening the door.mp4'
      }
    }
    if (agentName === 'Tag Team Tanya & Tom') {
      return {
        loop: '/tanya-tom-loop.mp4',
        closing: '/tanya-tom-closing-door.mp4',
        opening: '/tanya-tom-opening-door.mp4'
      }
    }
    if (agentName === 'Veteran Victor') {
      return {
        loop: '/veteran-victor-loop.mp4',
        closing: '/veteran-victor-closing-door.mp4',
        opening: '/veteran-victor-opening-door.mp4'
      }
    }
    if (agentName === 'No Problem Nancy') {
      return {
        loop: '/no-problem-nancy-loop.mp4',
        closing: '/no-problem-nancy-closing-door.mp4',
        opening: '/no-problem-nancy-opening-door.mp4'
      }
    }
    if (agentName === 'Just Treated Jerry') {
      return {
        loop: '/just-treated-jerry-loop.mp4',
        closing: '/just-treated-jerry-closing-door.mp4',
        opening: '/just-treated-jerry-opening-door.mp4'
      }
    }
    if (agentName === 'Already Got It Alan') {
      return {
        loop: '/already-got-it-alan-loop.mp4',
        closing: '/already-got-it-alan-closing-door.mp4',
        opening: '/already-got-it-alan-opening-door.mp4'
      }
    }
    if (agentName === 'Think About It Tina') {
      return {
        loop: '/think-about-it-tina-loop.mp4',
        closing: '/think-about-it-tina-closing-door.mp4',
        opening: '/think-about-it-tina-opening-door.mp4'
      }
    }
    if (agentName === 'Too Expensive Tim') {
      return {
        loop: '/too-expensive-tim-loop.mp4',
        closing: '/too-expensive-tim-closing-door.mp4',
        opening: '/too-expensive-tim-opening-door.mp4'
      }
    }
    if (agentName === 'Skeptical Sam') {
      return {
        loop: '/skeptical-sam-loop.mp4',
        closing: '/skeptical-sam-closing-door.mp4',
        opening: '/skeptical-sam-opening-door.mp4'
      }
    }
    if (agentName === 'Renter Randy') {
      return {
        loop: '/renter-randy-loop.mp4',
        closing: '/renter-randy-closing-door.mp4',
        opening: '/renter-randy-opening-door.mp4'
      }
    }
    if (agentName === 'DIY Dave') {
      return {
        loop: '/diy-dave-loop.mp4',
        closing: '/diy-dave-closing-door.mp4',
        opening: '/diy-dave-opening-door.mp4'
      }
    }
    if (agentName === 'Busy Beth') {
      return {
        loop: '/busy-beth-loop.mp4',
        closing: '/busy-beth-closing-door.mp4',
        opening: '/busy-beth-opening-door.mp4'
      }
    }
    if (agentName === 'Not Interested Nick') {
      return {
        loop: '/not-interested-nick-loop.mp4',
        closing: '/not-interested-nick-closing-door.mp4',
        opening: '/not-interested-nick-opening-door.mp4'
      }
    }
    if (agentName === 'Spouse Check Susan') {
      return {
        loop: '/spouse-check-susan-loop.mp4',
        closing: '/spouse-check-susan-closing-door.mp4',
        opening: '/spouse-check-susan-opening-door.mp4'
      }
    }
    return null
  }
  
  // Video recording temporarily disabled - archived for future implementation
  // const { isRecording: isVideoRecording, startRecording: startDualCameraRecording, stopRecording: stopDualCameraRecording } = useDualCameraRecording(sessionId)
  const isVideoRecording = false

  const durationInterval = useRef<NodeJS.Timeout | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const signedUrlAbortRef = useRef<AbortController | null>(null)
  const endCallProcessingRef = useRef(false) // Track if end call is being processed
  const agentVideoRef = useRef<HTMLVideoElement | null>(null) // Ref for Tanya & Tom video element
  const lastConnectionStatusRef = useRef<'connected' | 'disconnected' | 'connecting' | 'error' | null>(null) // Track connection status changes
  
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
  
  // Handle video mode changes for agents with videos
  useEffect(() => {
    // CRITICAL: Allow closing mode even when sessionActive is false (during end sequence)
    const shouldHandleVideo = agentVideoRef.current && (sessionActive || videoMode === 'closing')
    
    if (shouldHandleVideo && agentVideoRef.current) {
      const video = agentVideoRef.current
      console.log('🎬 Video effect running:', { videoMode, sessionActive, videoSrc: video.src })
      
      if (videoMode === 'opening') {
        // Play opening door animation, then transition to loop
        video.play().catch((err) => {
          console.warn('Failed to play opening animation:', err)
        })
        
        const handleOpeningEnded = () => {
          console.log('🎬 Opening animation finished, transitioning to loop')
          setVideoMode('loop')
          if (agentVideoRef.current) {
            agentVideoRef.current.removeEventListener('ended', handleOpeningEnded)
          }
        }
        
        video.addEventListener('ended', handleOpeningEnded)
        
        return () => {
          if (agentVideoRef.current) {
            agentVideoRef.current.removeEventListener('ended', handleOpeningEnded)
          }
        }
      } else if (videoMode === 'closing') {
        // Play closing door animation (used when ending session)
        console.log('🎬 Playing closing door animation')
        video.play().catch((err) => {
          console.error('❌ Failed to play closing door animation:', err)
        })
        
        // Note: Door closing animation will complete and then endSession is called
        // No need to switch back to loop as session is ending
      } else if (videoMode === 'loop') {
        // Track when loop video starts and its duration
        const handleLoadedMetadata = () => {
          if (agentVideoRef.current) {
            loopVideoDurationRef.current = agentVideoRef.current.duration
            console.log('🎬 Loop video duration:', agentVideoRef.current.duration)
          }
        }
        
        const handlePlay = () => {
          if (agentVideoRef.current) {
            loopVideoStartTimeRef.current = Date.now() - (agentVideoRef.current.currentTime * 1000)
            console.log('🎬 Loop video started, tracking playback position')
          }
        }
        
        video.addEventListener('loadedmetadata', handleLoadedMetadata)
        video.addEventListener('play', handlePlay)
        
        // Ensure loop video plays
        video.play().catch((err) => {
          console.warn('Failed to play loop video:', err)
        })
        
        return () => {
          if (agentVideoRef.current) {
            agentVideoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata)
            agentVideoRef.current.removeEventListener('play', handlePlay)
          }
        }
      }
    } else {
      console.log('⚠️ Video effect skipped:', { hasVideoRef: !!agentVideoRef.current, sessionActive, videoMode })
    }
  }, [videoMode, sessionActive])

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
    // Guard against SSR - only run on client
    if (typeof window === 'undefined') return

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
      if (typeof window !== 'undefined') {
        window.removeEventListener('agent:user', handleUserEvent)
        window.removeEventListener('agent:response', handleAgentEvent)
      }
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

  const startSession = async (skipCreditCheck = false) => {
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

      if (!subscription.hasActiveSubscription && !sessionLimit.loading && !skipCreditCheck) {
        if (!sessionLimit.canStartSession) {
          setShowOutOfCredits(true)
          setLoading(false)
          return
        }
        
        // Check if this is their last credit
        if (sessionLimit.sessionsRemaining === 1) {
          setShowLastCreditWarning(true)
          setLoading(false)
          return
        }
      }

      const tokenPromise = fetchConversationToken(selectedAgent.eleven_agent_id)

      // Play knock sound when starting session
      playSound('/sounds/knock.mp3', 0.95)

      // Play door opening video on initial knock
      setShowDoorOpeningVideo(true)
      try {
        // Wait for video element to be ready
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (doorOpeningVideoRef.current) {
          const video = doorOpeningVideoRef.current
          video.currentTime = 0
          await video.play()
          
          // Wait for video to finish playing
          await new Promise<void>((resolve) => {
            const handleEnded = () => {
              video.removeEventListener('ended', handleEnded)
              resolve()
            }
            video.addEventListener('ended', handleEnded)
            
            // Fallback timeout in case video doesn't fire ended event
            setTimeout(() => {
              video.removeEventListener('ended', handleEnded)
              resolve()
            }, 5000) // Max 5 seconds wait
          })
        }
      } catch (e) {
        logger.warn('Could not play door opening video', { error: e })
      }
      
      setShowDoorOpeningVideo(false)

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
      // Start with opening animation if available (Jerry), otherwise start with loop
      if (agentHasVideos(selectedAgent?.name)) {
        const videoPaths = getAgentVideoPaths(selectedAgent?.name)
        if (videoPaths?.opening) {
          setVideoMode('opening')
        } else {
          setVideoMode('loop')
        }
      } else {
        setVideoMode('loop')
      }
      setLoading(false)
      
      // Deduct credit for ALL users (free users have 10 credits, paid users have 50 credits/month)
      try {
        await fetch('/api/session/increment', { method: 'POST' })
        await sessionLimit.refresh()
        // Dispatch event to notify header to refresh credits
        window.dispatchEvent(new CustomEvent('credits:updated'))
      } catch (error) {
        logger.error('Error incrementing session count', error)
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
      setShowDoorOpeningVideo(false)
    }
  }

  const createSessionRecord = async () => {
    try {
      const resp = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agent_name: selectedAgent?.name,
          agent_id: selectedAgent?.eleven_agent_id 
        }),
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
    setVideoMode('loop') // Reset video mode for next session
    setShowDoorOpeningVideo(false) // Reset door opening video state

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
  
  // Shared function to handle door closing sequence and end session
  const handleDoorClosingSequence = useCallback(async (reason: string = 'User ended conversation') => {
    console.log('🚪 Starting door closing sequence:', reason)
    console.log('🚪 Door closing sequence context:', {
      reason,
      selectedAgent: selectedAgent?.name,
      videoMode,
      sessionActive,
      hasVideoRef: !!agentVideoRef.current
    })
    
    // Check if this agent has video animations - if so, wait for loop to reach beginning, then play closing door video
    const hasVideos = agentHasVideos(selectedAgent?.name)
    console.log('🎬 Agent has videos:', hasVideos, 'for agent:', selectedAgent?.name)
    
    if (hasVideos) {
      const agentName = selectedAgent?.name || 'Unknown'
      console.log(`🎬 Agent has video animations, preparing door closing sequence for ${agentName}...`)
      
      // Wait for loop video to reach its beginning before switching to closing animation
      if (videoMode === 'loop' && agentVideoRef.current) {
        const video = agentVideoRef.current
        const duration = loopVideoDurationRef.current || video.duration || 0
        
        if (duration > 0) {
          // Calculate how long until the loop reaches the beginning
          const currentTime = video.currentTime
          const timeUntilLoopStart = duration - currentTime
          
          console.log(`🎬 Loop video position: ${currentTime.toFixed(2)}s / ${duration.toFixed(2)}s`)
          console.log(`🎬 Waiting ${timeUntilLoopStart.toFixed(2)}s for loop to reach beginning...`)
          
          // Wait for the loop to complete and reach the beginning
          await new Promise<void>((resolve) => {
            const checkLoopPosition = () => {
              const video = agentVideoRef.current
              if (!video) {
                resolve()
                return
              }
              
              // Check if we're at or near the beginning of the loop (within 0.1 seconds)
              if (video.currentTime < 0.1) {
                console.log('🎬 Loop has reached the beginning!')
                resolve()
              } else {
                // Check again in 50ms
                setTimeout(checkLoopPosition, 50)
              }
            }
            
            // Start checking after calculated time (with a small buffer)
            setTimeout(checkLoopPosition, Math.max(0, (timeUntilLoopStart - 0.2) * 1000))
            
            // Fallback timeout (max wait 5 seconds)
            setTimeout(() => {
              console.log('⏰ Loop wait timeout, proceeding with door close')
              resolve()
            }, 5000)
          })
        }
      }
      
      console.log(`🎬 Switching to closing door video for ${agentName}...`)
      
      // Switch to closing door video - React will re-render with new src
      setVideoMode('closing')
      
      // Wait for React to update and video element to be ready
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Wait for closing door video to finish before ending session
      await new Promise<void>((resolve) => {
        const video = agentVideoRef.current
        if (!video) {
          console.warn('⚠️ Video ref not available, proceeding anyway')
          resolve()
          return
        }
        
        // Ensure video is playing
        video.play().catch((err) => {
          console.warn('Video play failed:', err)
        })
        
        const handleVideoEnd = () => {
          console.log(`🎬 Closing door video finished for ${agentName}`)
          video.removeEventListener('ended', handleVideoEnd)
          resolve()
        }
        
        // Check if video already ended (edge case)
        if (video.ended) {
          console.log('🎬 Video already ended')
          resolve()
          return
        }
        
        video.addEventListener('ended', handleVideoEnd)
        
        // Fallback timeout in case video doesn't fire ended event
        setTimeout(() => {
          console.log('⏰ Closing door video timeout, proceeding anyway')
          video.removeEventListener('ended', handleVideoEnd)
          resolve()
        }, 10000) // 10 second timeout
      })
    }
    
    // Set session inactive before ending
    setSessionActive(false)
    
    // End the session after door closing sequence completes
    console.log('🔚 Calling endSession after door closing sequence...')
    endSession(reason).catch((error) => {
      console.error('❌ Error in endSession from handleDoorClosingSequence:', error)
    })
  }, [selectedAgent?.name, videoMode, endSession])
  
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
    
    // Listen for agent mode changes to track speaking status
    const handleAgentMode = (e: any) => {
      const mode = e?.detail || e
      agentModeRef.current = mode === 'speaking' ? 'speaking' : (mode === 'listening' ? 'listening' : 'idle')
      console.log('🎙️ Agent mode changed:', agentModeRef.current)
    }
    
    // Listen for ping/audio activity even without text responses
    const handleAgentPing = (e: any) => {
      console.log('🏓 Agent ping/audio activity detected, resetting activity timer')
      handleAgentActivity()
    }
    
    const handleAgentEndCall = async (e: any) => {
      console.log('📞 handleAgentEndCall triggered', { 
        sessionActive, 
        sessionId, 
        eventDetail: e?.detail,
        alreadyProcessing: endCallProcessingRef.current,
        currentAgentMode: agentModeRef.current,
        eventType: e?.type,
        timestamp: Date.now()
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
      console.log('🚪 Starting door closing sequence flow...')
      
      // Clear any silence timers
      if (silenceTimer) {
        clearTimeout(silenceTimer)
        silenceTimer = null
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
      
      // Use shared door closing sequence function
      const reason = e?.detail?.reason || 'Agent ended conversation'
      console.log('📊 END CALL TRIGGER DETAIL:', reason)
      await handleDoorClosingSequence(reason)
    }
    
    // Track agent and user activity - silence timeout as fallback
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
          // 30 seconds timeout - only trigger if we've had actual silence and minimum conversation
          if (sessionActive && sessionId && timeSinceLastActivity >= 30000 && transcript.length > 3) {
            console.log('⏱️ No activity for 30 seconds, auto-ending session...')
            console.log('📊 END CALL TRIGGER: Silence timeout (30 seconds)')
            console.log('📊 Transcript length:', transcript.length, 'lines')
            handleAgentEndCall({ detail: { reason: 'Extended silence detected (30 seconds)' } })
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
      // Removed goodbye phrase detection - only ElevenLabs will trigger end calls
    }
    
    // Listen for user activity
    const handleUserActivity = (e: any) => {
      handleAgentActivity()
      // Removed user goodbye phrase detection - only ElevenLabs will trigger end calls
    }
    
    // Listen for connection status changes (disconnect signals from ElevenLabs)
    const handleConnectionStatus = (e: any) => {
      const status = e.detail
      console.log('📊 Connection status changed:', status)
      
      // If we get disconnected during an active session, end the session IMMEDIATELY
      // This catches cases where ElevenLabs disconnects without sending end_call
      if (status === 'disconnected' && sessionActive && sessionId && !endCallProcessingRef.current) {
        console.log('🔌 Connection disconnected during active session - ending session IMMEDIATELY')
        console.log('📊 END CALL TRIGGER: Connection lost/disconnected')
        // Call directly without delay - events might not fire reliably
        handleAgentEndCall({ detail: { reason: 'Connection lost', source: 'disconnect' } })
      }
    }
    
    // Update status tracking when we receive connection status events
    const handleConnectionStatusWithTracking = (e: any) => {
      const status = e.detail
      const previousStatus = lastConnectionStatusRef.current
      lastConnectionStatusRef.current = status
      
      // Call the original handler
      handleConnectionStatus(e)
      
      // Additional check: if we transitioned from connected to disconnected, trigger end call
      if (previousStatus === 'connected' && status === 'disconnected' && sessionActive && sessionId && !endCallProcessingRef.current) {
        console.log('🔄 Status transition detected: connected -> disconnected')
        console.log('📊 END CALL TRIGGER: Status transition')
        handleAgentEndCall({ detail: { reason: 'Connection lost (status transition)', source: 'status_tracking' } })
      }
    }
    
    // Removed transcript-based goodbye phrase detection - only ElevenLabs will trigger end calls
    
    // Set up initial silence timeout
    if (sessionActive && sessionId) {
      handleAgentActivity() // Initialize timer
    }
    
    // Guard against SSR - only set up event listeners on client
    if (typeof window === 'undefined') {
      return
    }
    
    // Log when event listeners are attached
    console.log('🎧 Setting up event listeners for auto-end', { sessionActive, sessionId })
    console.log('🎧 handleAgentEndCall function:', typeof handleAgentEndCall)
    
    // Listen for manual end session requests
    window.addEventListener('trainer:end-session-requested', handleEndSessionRequest)
    
    // Listen for agent end_call events (dispatched from ElevenLabsConversation)
    window.addEventListener('agent:end_call', handleAgentEndCall)
    console.log('✅ agent:end_call event listener attached')
    
    // Listen for agent messages/responses to track activity
    // Note: agent:message is dispatched, but agent:response is the main one with actual text
    window.addEventListener('agent:message', handleAgentMessage)
    window.addEventListener('agent:response', handleAgentResponse) // Main event for agent transcript
    
    // Listen for user activity too (they might be speaking)
    window.addEventListener('agent:user', handleUserActivity)
    
    // Listen for connection status changes (with tracking)
    window.addEventListener('connection:status', handleConnectionStatusWithTracking)
    
    // Listen for agent mode changes to track speaking status
    window.addEventListener('agent:mode', handleAgentMode)
    window.addEventListener('agent:ping', handleAgentPing)
    window.addEventListener('agent:audio', handleAgentPing)
    
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
      
      // Guard against SSR - only remove listeners if window exists
      if (typeof window === 'undefined') return
      
      // Removed endCallCheckInterval cleanup - no longer using transcript-based goodbye detection
      window.removeEventListener('trainer:end-session-requested', handleEndSessionRequest)
      window.removeEventListener('agent:end_call', handleAgentEndCall)
      window.removeEventListener('agent:message', handleAgentMessage)
      window.removeEventListener('agent:response', handleAgentResponse)
      window.removeEventListener('agent:user', handleUserActivity)
      window.removeEventListener('connection:status', handleConnectionStatusWithTracking)
      window.removeEventListener('agent:mode', handleAgentMode)
      window.removeEventListener('agent:ping', handleAgentPing)
      window.removeEventListener('agent:audio', handleAgentPing)
      window.removeEventListener('agent:end_call', debugListener as EventListener)
      window.removeEventListener('agent:message', debugListener as EventListener)
      window.removeEventListener('agent:response', debugListener as EventListener)
      window.removeEventListener('agent:user', debugListener as EventListener)
      window.removeEventListener('connection:status', debugListener as EventListener)
    }
  }, [sessionActive, sessionId, endSession, transcript, selectedAgent?.name, videoMode, handleDoorClosingSequence])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        reason="session_limit"
      />
      <LastCreditWarningModal 
        isOpen={showLastCreditWarning} 
        onClose={() => setShowLastCreditWarning(false)}
        onContinue={() => {
          setShowLastCreditWarning(false)
          // Restart session after modal closes, skipping credit check
          setTimeout(() => {
            startSession(true)
          }, 100)
        }}
      />
      <OutOfCreditsModal 
        isOpen={showOutOfCredits} 
        onClose={() => setShowOutOfCredits(false)}
      />

      {/* Full Screen Session Container */}
      <div className="relative w-full h-screen flex flex-col bg-black/40 backdrop-blur-sm overflow-hidden">
        
        {/* Header with Timer and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 px-3 sm:px-6 py-0.5 sm:py-1 border-b border-purple-500/20 flex-shrink-0 bg-black/20">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold text-white truncate">
              Live Session - {selectedAgent?.name || 'Training'}
            </span>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-slate-300 font-mono">
              {formatDuration(duration)}
            </span>
            <button
              onClick={() => endSession()}
              disabled={loading || !sessionActive}
              className="px-4 py-2.5 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm sm:text-sm font-medium rounded-lg transition-all min-h-[44px] touch-manipulation"
            >
              {loading ? 'Ending...' : 'End'}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          
          {/* Top Section: Split View - Agent Left, Webcam Right - Stack on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-b border-purple-500/20 flex-shrink-0 h-[40vh] md:h-[50vh] max-h-[40vh] md:max-h-[50vh]">
            
            {/* Left: Agent */}
            <div className="relative border-r-0 md:border-r border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-transparent overflow-hidden" style={{ 
              height: '100%',
              maxHeight: '100%'
            }}>
              {/* Full Agent Image - matching hero preview */}
              <div className="absolute inset-0 overflow-hidden">
                {loading ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center">
                    <div className="text-white text-center pointer-events-none">
                      <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-white mx-auto mb-4"></div>
                      <p className="text-sm">Connecting...</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full overflow-hidden">
                    {(() => {
                      const shouldUseVideo = agentHasVideos(selectedAgent?.name) && sessionActive
                      
                      // Use video for agents with video animations during active session
                      if (shouldUseVideo) {
                        const videoPaths = getAgentVideoPaths(selectedAgent?.name)
                        if (!videoPaths) return null
                        
                        const videoSrcRaw = videoMode === 'opening' && videoPaths.opening
                          ? videoPaths.opening
                          : videoMode === 'loop'
                          ? videoPaths.loop
                          : videoPaths.closing
                        
                        // URL encode video path if it contains spaces to ensure proper loading
                        const videoSrc = videoSrcRaw && (videoSrcRaw.includes(' ') || videoSrcRaw.includes('&'))
                          ? videoSrcRaw.split('/').map((part, i) => i === 0 ? part : encodeURIComponent(part)).join('/')
                          : videoSrcRaw
                        
                        return (
                          <video
                            key={`${selectedAgent?.name}-${videoMode}-${videoSrc}`}
                            ref={agentVideoRef}
                            src={videoSrc}
                            className="w-full h-full object-cover"
                            style={{ objectFit: 'cover', objectPosition: 'center center' }}
                            autoPlay
                            muted
                            loop={videoMode === 'loop'}
                            playsInline
                            onLoadedData={() => {
                              // Ensure video plays when loaded
                              if (agentVideoRef.current) {
                                agentVideoRef.current.play().catch((err) => {
                                  console.warn('Video autoplay failed:', err)
                                })
                              }
                            }}
                            onError={(e) => {
                              console.error('❌ Video failed to load:', videoSrcRaw, 'Encoded:', videoSrc)
                              e.stopPropagation()
                            }}
                          />
                        )
                      }
                      
                      // Use image for all other cases (including agents with videos pre-session)
                      const src = resolveAgentImage(selectedAgent, sessionActive)
                      console.log('🖼️ FINAL IMAGE DECISION:', { 
                        sessionActive, 
                        agentName: selectedAgent?.name,
                        imageSrc: src,
                        timestamp: new Date().toISOString()
                      })
                      // URL encode image path if it contains spaces to ensure proper loading
                      const imageSrc = src && (src.includes(' ') || src.includes('&'))
                        ? src.split('/').map((part, i) => i === 0 ? part : encodeURIComponent(part)).join('/')
                        : src
                      
                      return imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={selectedAgent?.name || 'Agent'}
                        fill
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-cover"
                        style={{ objectFit: 'cover', objectPosition: 'center center' }}
                        priority
                        unoptimized={src?.includes(' ') || src?.includes('&')} // Disable optimization for files with spaces or special chars
                        onError={(e) => {
                          console.error('❌ Image failed to load:', src, 'Encoded:', imageSrc)
                          // Prevent error propagation to avoid console spam
                          e.stopPropagation()
                        }}
                      />
                      ) : null
                    })()}
                    
                    {/* Door Opening Video Overlay - plays on initial knock */}
                    {showDoorOpeningVideo && (() => {
                      const videoPaths = getAgentVideoPaths(selectedAgent?.name)
                      const videoPathRaw = videoPaths?.opening || '/DIY DAVE OPENIG DOOR.mp4' // Fallback to default if no opening video
                      const videoPath = videoPathRaw.includes(' ') || videoPathRaw.includes('&')
                        ? videoPathRaw.split('/').map((part, i) => i === 0 ? part : encodeURIComponent(part)).join('/')
                        : videoPathRaw
                      
                      return (
                        <div className="absolute inset-0 z-50 bg-black">
                          <video
                            ref={doorOpeningVideoRef}
                            src={videoPath}
                            className="w-full h-full object-cover"
                            style={{ objectFit: 'cover', objectPosition: 'center center' }}
                            autoPlay
                            muted
                            playsInline
                            onError={(e) => {
                              console.error('❌ Door opening video failed to load:', videoPathRaw, 'Encoded:', videoPath, e)
                              setShowDoorOpeningVideo(false)
                            }}
                          />
                        </div>
                      )
                    })()}
                    
                    {/* Knock Button Overlay - centered when not active */}
                    {!sessionActive && !loading && selectedAgent && !showDoorOpeningVideo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                        <button
                          onClick={() => startSession()}
                          className="relative px-6 sm:px-8 lg:px-10 py-4 sm:py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 active:from-emerald-700 active:via-teal-700 active:to-cyan-700 text-white font-bold text-base sm:text-lg lg:text-xl rounded-xl sm:rounded-2xl transition-all duration-300 active:scale-95 border-2 border-white/20 hover:border-white/30 backdrop-blur-sm min-h-[56px] touch-manipulation z-20 overflow-hidden group"
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            <span className="sm:hidden">Knock</span>
                            <span className="hidden sm:inline">Knock on {selectedAgent.name}'s Door</span>
                          </span>
                          {/* Shine effect on hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-500" />
                        </button>
                      </div>
                    )}
                    
                  </div>
                )}
              </div>
            </div>
            
            {/* Right: Webcam */}
            <div className="relative bg-gradient-to-br from-green-950/20 to-transparent border-t md:border-t-0 border-purple-500/20 overflow-hidden" style={{ 
              height: '100%',
              maxHeight: '100%',
              minHeight: 0
            }}>
              <WebcamRecorder 
                sessionActive={sessionActive} 
                duration={duration}
              />
            </div>
          </div>

          {/* Bottom Section: Live Transcript */}
          <div className="flex flex-col relative flex-1 min-h-0 px-3 sm:px-6 py-3 sm:py-4 overflow-hidden z-0">
            
            {/* Bottom fade gradient overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-10" />
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 sm:space-y-4 relative z-0 pb-2">
              {transcript.length === 0 ? (
                <div className="text-center text-slate-500 py-8 sm:py-12 px-4">
                  {sessionActive ? (
                    <p className="text-sm sm:text-base">Waiting for conversation to begin...</p>
                  ) : (
                    <p className="text-xs sm:text-sm">Knock on {selectedAgent?.name || 'the agent'}'s door to start your practice session</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 pb-4">
                  {transcript.map((entry) => {
                    const isUser = entry.speaker === 'user'
                    return (
                      <div
                        key={entry.id}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                      >
                        <div
                          className={`max-w-[90%] sm:max-w-[75%] px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-xl ${
                            isUser
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-700/80 text-slate-100'
                          }`}
                        >
                          <div className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 opacity-70 uppercase tracking-wide">
                            {isUser ? 'You' : selectedAgent?.name || 'Agent'}
                          </div>
                          <div className="text-sm sm:text-base leading-relaxed break-words">{entry.text}</div>
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
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 1.5s ease-in-out infinite;
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
