'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import dynamicImport from 'next/dynamic'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { TranscriptEntry } from '@/lib/trainer/types'
import { useSessionLimit } from '@/hooks/useSubscription'
import { useLiveSessionAnalysis } from '@/hooks/useLiveSessionAnalysis'
import { useVoiceAnalysis } from '@/hooks/useVoiceAnalysis'
import { logger } from '@/lib/logger'
import { PERSONA_METADATA, ALLOWED_AGENT_SET, type AllowedAgentName } from '@/components/trainer/personas'
import { COLOR_VARIANTS } from '@/components/ui/background-circles'
import { LiveMetricsPanel } from '@/components/trainer/LiveMetricsPanel'
import { LiveFeedbackFeed } from '@/components/trainer/LiveFeedbackFeed'
import { LiveTranscript } from '@/components/trainer/LiveTranscript'
import { VideoControls } from '@/components/trainer/VideoControls'
import { WebcamPIP, type WebcamPIPRef } from '@/components/trainer/WebcamPIP'
import DoorClosingVideo from '@/components/trainer/DoorClosingVideo'

// Dynamic imports for heavy components - only load when needed
const ElevenLabsConversation = dynamicImport(() => import('@/components/trainer/ElevenLabsConversation'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div></div>
})
const WebcamRecorder = dynamicImport(() => import('@/components/trainer/WebcamRecorder'), { ssr: false })
const LastCreditWarningModal = dynamicImport(() => import('@/components/ui/LastCreditWarningModal').then(mod => ({ default: mod.LastCreditWarningModal })), { ssr: false })
const OutOfCreditsModal = dynamicImport(() => import('@/components/ui/OutOfCreditsModal').then(mod => ({ default: mod.OutOfCreditsModal })), { ssr: false })

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
  const [sessionState, setSessionState] = useState<'active' | 'ending' | 'door-closing' | 'complete'>('active')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [conversationToken, setConversationToken] = useState<string | null>(null)
  const [showLastCreditWarning, setShowLastCreditWarning] = useState(false)
  const [showOutOfCredits, setShowOutOfCredits] = useState(false)
  const [videoMode, setVideoMode] = useState<'opening' | 'loop' | 'closing'>('loop') // Track video state for agents with videos
  const [showDoorCloseAnimation, setShowDoorCloseAnimation] = useState(false) // Direct state trigger for door closing animation
  const loopVideoStartTimeRef = useRef<number>(0) // Track when loop video started playing
  const loopVideoDurationRef = useRef<number>(0) // Track loop video duration
  const [showDoorOpeningVideo, setShowDoorOpeningVideo] = useState(false) // Track when to show door opening video
  const doorOpeningVideoRef = useRef<HTMLVideoElement | null>(null) // Ref for door opening video
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)
  const [reconnectingStatus, setReconnectingStatus] = useState<{ isReconnecting: boolean; attempt: number; maxAttempts: number } | null>(null)
  const webcamPIPRef = useRef<WebcamPIPRef | null>(null)
  const conversationRef = useRef<any>(null) // Ref to ElevenLabs conversation instance

  // Sync camera/mic state with WebcamPIP
  useEffect(() => {
    if (webcamPIPRef.current && sessionActive) {
      const checkInterval = setInterval(() => {
        if (webcamPIPRef.current) {
          setIsCameraOff(!webcamPIPRef.current.isCameraOn())
          setIsMuted(!webcamPIPRef.current.isMicOn())
        }
      }, 500)
      return () => clearInterval(checkInterval)
    }
  }, [sessionActive])
  
  // Real-time analysis hook
  const { feedbackItems: transcriptFeedbackItems, metrics: transcriptMetrics } = useLiveSessionAnalysis(transcript)
  
  // Track session start time for voice analysis
  const sessionStartTimeRef = useRef<number | null>(null)
  useEffect(() => {
    if (sessionActive && !sessionStartTimeRef.current) {
      sessionStartTimeRef.current = Date.now()
    } else if (!sessionActive) {
      sessionStartTimeRef.current = null
    }
  }, [sessionActive])
  
  // Voice analysis hook - runs silently, no feedback items
  const { metrics: voiceMetrics, getVoiceAnalysisData } = useVoiceAnalysis({
    enabled: sessionActive,
    analysisInterval: 100,
    sessionId,
    transcript,
    sessionStartTime: sessionStartTimeRef.current || undefined
  })
  
  // Only use transcript feedback items (no voice feedback during live session)
  const feedbackItems = transcriptFeedbackItems
  
  // Merge metrics
  const metrics = {
    ...transcriptMetrics,
    voiceMetrics: voiceMetrics
  }
  
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

  // Helper function to get door closing video path for an agent
  const getAgentDoorVideo = useCallback((agentId: string, agentName: string | null | undefined): string => {
    const videoPaths = getAgentVideoPaths(agentName)
    return videoPaths?.closing || '/austin-door-close.mp4' // Fallback to Austin's video
  }, [])
  
  // Video recording temporarily disabled - archived for future implementation
  // const { isRecording: isVideoRecording, startRecording: startDualCameraRecording, stopRecording: stopDualCameraRecording } = useDualCameraRecording(sessionId)
  const isVideoRecording = false

  const durationInterval = useRef<NodeJS.Timeout | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const signedUrlAbortRef = useRef<AbortController | null>(null)
  const agentVideoRef = useRef<HTMLVideoElement | null>(null) // Ref for Tanya & Tom video element
  const inactivitySoundPlayedRef = useRef(false) // Track if we've played sound for inactivity
  
  const sessionLimit = useSessionLimit()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    fetchAgents()
    fetchUserAvatar()
    return () => {
      if (durationInterval.current) clearInterval(durationInterval.current)
      signedUrlAbortRef.current?.abort()
    }
  }, [])

  const fetchUserAvatar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('avatar_url')
          .eq('id', user.id)
          .single()
        
        if (data?.avatar_url) {
          setUserAvatarUrl(data.avatar_url)
        }
      }
    } catch (error) {
      console.error('Error fetching user avatar:', error)
    }
  }
  
  // Handle video mode changes for agents with videos
  useEffect(() => {
    // CRITICAL: Allow closing mode even when sessionActive is false (during end sequence)
    // Also trigger when showDoorCloseAnimation state is set
    const shouldHandleVideo = agentVideoRef.current && (sessionActive || videoMode === 'closing' || showDoorCloseAnimation)
    
    if (shouldHandleVideo && agentVideoRef.current) {
      const video = agentVideoRef.current
      console.log('🎬 Video effect running:', { videoMode, sessionActive, showDoorCloseAnimation, videoSrc: video.src })
      
      // If showDoorCloseAnimation is true, ensure we're in closing mode
      if (showDoorCloseAnimation && videoMode !== 'closing') {
        console.log('🎬 showDoorCloseAnimation is true, setting videoMode to closing')
        setVideoMode('closing')
      }
      
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
      } else if (videoMode === 'closing' || showDoorCloseAnimation) {
        // Play closing door animation (used when ending session)
        console.log('🎬 Playing closing door animation (triggered by:', showDoorCloseAnimation ? 'showDoorCloseAnimation state' : 'videoMode', ')')
        console.log('🎬 Video state:', {
          readyState: video.readyState,
          paused: video.paused,
          currentSrc: video.currentSrc,
          src: video.src
        })
        
        // Force video to load if not already loaded
        if (video.readyState === 0) {
          video.load()
        }
        
        // Ensure video is loaded and ready
        const handleCanPlay = () => {
          console.log('🎬 Closing video can play, starting playback')
          const playPromise = video.play()
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('✅ Closing video started playing')
              })
              .catch((err) => {
                console.error('❌ Failed to play closing door animation:', err)
                // Retry after a short delay
                setTimeout(() => {
                  video.play().catch((retryErr) => {
                    console.error('❌ Retry failed:', retryErr)
                  })
                }, 500)
              })
          }
          video.removeEventListener('canplay', handleCanPlay)
        }
        
        // If video is already ready, play immediately
        if (video.readyState >= 3) { // HAVE_FUTURE_DATA or higher
          console.log('🎬 Video already ready, playing immediately')
          const playPromise = video.play()
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('✅ Closing video started playing (immediate)')
              })
              .catch((err) => {
                console.error('❌ Failed to play closing door animation (immediate):', err)
                // Retry after a short delay
                setTimeout(() => {
                  video.play().catch((retryErr) => {
                    console.error('❌ Retry failed:', retryErr)
                  })
                }, 500)
              })
          }
        } else {
          console.log('🎬 Video not ready yet, waiting for canplay event')
          video.addEventListener('canplay', handleCanPlay)
        }
        
        // Also try to play on loadeddata as backup
        const handleLoadedData = () => {
          console.log('🎬 Closing video loaded, ensuring playback')
          const playPromise = video.play()
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('✅ Closing video started playing (loadeddata)')
              })
              .catch((err) => {
                console.error('❌ Failed to play closing door animation (loadeddata):', err)
              })
          }
          video.removeEventListener('loadeddata', handleLoadedData)
        }
        video.addEventListener('loadeddata', handleLoadedData)
        
        // Also listen for play event to confirm it started
        const handlePlay = () => {
          console.log('✅ Closing video is now playing')
          video.removeEventListener('play', handlePlay)
        }
        video.addEventListener('play', handlePlay)
        
        return () => {
          video.removeEventListener('canplay', handleCanPlay)
          video.removeEventListener('loadeddata', handleLoadedData)
          video.removeEventListener('play', handlePlay)
        }
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
      console.log('⚠️ Video effect skipped:', { hasVideoRef: !!agentVideoRef.current, sessionActive, videoMode, showDoorCloseAnimation })
    }
  }, [videoMode, sessionActive, showDoorCloseAnimation])

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
        console.log('📝 Adding user transcript entry:', e.detail.substring(0, 50))
        pushFinal(e.detail, 'user')
        console.log('✅ User transcript added. Current transcript length:', transcript.length + 1)
      } else {
        console.warn('⚠️ Invalid user event:', e)
      }
    }

    const handleAgentEvent = (e: any) => {
      if (e?.detail && typeof e.detail === 'string' && e.detail.trim()) {
        console.log('📝 Adding agent transcript entry:', e.detail.substring(0, 50))
        pushFinal(e.detail, 'homeowner')
        console.log('✅ Agent transcript added. Current transcript length:', transcript.length + 1)
      } else {
        console.warn('⚠️ Invalid agent event:', e)
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

      if (!sessionLimit.loading && !skipCreditCheck) {
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
      setSessionState('active')
      // Session started
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
      
      // Log transcript state for debugging
      console.log('🎬 Session started. Transcript length:', transcript.length)
      console.log('🎬 Session ID:', newId)
      
      // Deduct credit for ALL users (free users have 10 credits, paid users have 50 credits/month)
      // Make this non-blocking so session can start even if API fails
      fetch('/api/session/increment', { method: 'POST' })
        .then(() => {
          sessionLimit.refresh()
          // Dispatch event to notify header to refresh credits
          window.dispatchEvent(new CustomEvent('credits:updated'))
        })
        .catch((error) => {
          logger.error('Error incrementing session count (non-blocking)', error)
          // Don't block session start if this fails
        })

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

  // Handle door closing video completion - redirect to analytics
  const handleDoorVideoComplete = useCallback(() => {
    console.log('🎬 Door closing video completed, redirecting to analytics')
    setSessionState('complete')
    
    if (sessionId) {
      // Redirect directly to analytics (skip loading page)
      window.location.href = `/analytics/${sessionId}`
    } else {
      router.push('/trainer')
    }
  }, [sessionId, router])

  const endSession = useCallback(async (endReason?: string) => {
    // Session ending (manual end - skip video, go straight to analytics/loading)
    
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
    
    // If we're already in door-closing state, don't process manual end
    if (sessionState === 'door-closing') {
      console.log('⚠️ Already in door-closing state, ignoring manual end')
      return
    }
    
    setLoading(true)
    setSessionActive(false)
    setReconnectingStatus(null) // Clear reconnection status
    // Don't change sessionState for manual end - we're redirecting immediately
    setConversationToken(null)
    // Don't reset videoMode if we're showing closing animation - let it finish
    if (videoMode !== 'closing' && !showDoorCloseAnimation) {
      setVideoMode('loop') // Reset video mode for next session
    }
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
        console.log('💾 Finalizing session...')
        console.log('📝 Local transcript length:', transcript.length, 'lines')
        console.log('📝 Note: Transcripts are saved incrementally to database during session')
        
        // Finalize session - transcript is already saved incrementally via /api/session/transcript
        // We still send transcript here as a backup/verification, but it's optional
        console.log('💾 Finalizing session data...', {
          sessionId,
          localTranscriptLines: transcript.length,
          duration,
          endReason: endReason || 'manual'
        })
        
        // Get voice analysis data before saving
        const voiceAnalysisData = getVoiceAnalysisData()
        console.log('🎤 Voice analysis data check:', {
          hasData: !!voiceAnalysisData,
          sessionId,
          transcriptLength: transcript.length,
          dataKeys: voiceAnalysisData ? Object.keys(voiceAnalysisData) : [],
          avgWPM: voiceAnalysisData?.avgWPM,
          totalFillerWords: voiceAnalysisData?.totalFillerWords,
          hasPitchData: voiceAnalysisData ? voiceAnalysisData.avgPitch > 0 : false,
          hasVolumeData: voiceAnalysisData ? voiceAnalysisData.avgVolume > -60 : false
        })
        
        // Warn if no voice analysis data but we have transcript
        if (!voiceAnalysisData && transcript.length > 0) {
          console.warn('⚠️ No voice analysis data available despite having transcript')
          console.warn('⚠️ This may indicate microphone access failed or voice analysis hook had an error')
        }
        
        console.log('💾 === SESSION SAVE DEBUG ===')
        console.log('💾 Voice analysis data exists:', !!voiceAnalysisData)
        console.log('💾 Voice analysis keys:', voiceAnalysisData ? Object.keys(voiceAnalysisData) : 'NULL')
        console.log('💾 Full voice analysis:', JSON.stringify(voiceAnalysisData, null, 2))
        console.log('💾 Session data to save:', {
          sessionId,
          transcriptLength: transcript.length,
          duration,
          endReason: endReason || 'manual',
          hasVoiceAnalysis: !!voiceAnalysisData
        })
        console.log('💾 ========================')
        
        const saveResponse = await fetch('/api/session', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: sessionId,
            transcript: transcript.length > 0 ? transcript : undefined, // Optional - already saved incrementally
            duration_seconds: duration,
            end_reason: endReason || 'manual',
            voice_analysis: voiceAnalysisData || undefined
          }),
        })
        
        if (!saveResponse.ok) {
          const errorText = await saveResponse.text().catch(() => 'Unknown error')
          console.error('❌ Error saving session:', saveResponse.status, errorText)
          console.error('❌ Voice analysis data may not have been saved:', {
            hadVoiceData: !!voiceAnalysisData,
            sessionId
          })
          // Still redirect even if save fails - grading endpoint has retry logic
        } else {
          const savedData = await saveResponse.json().catch(() => null)
          console.log('✅ Session data saved successfully', {
            sessionId: savedData?.id || sessionId,
            transcriptLines: transcript.length,
            voiceAnalysisSaved: !!voiceAnalysisData,
            responseHasAnalytics: !!savedData?.analytics,
            responseHasVoiceAnalysis: !!savedData?.analytics?.voice_analysis
          })
          
          // Verify voice_analysis was saved by checking response
          if (voiceAnalysisData && savedData?.analytics?.voice_analysis) {
            console.log('✅ Voice analysis data confirmed saved in database', {
              avgWPM: savedData.analytics.voice_analysis?.avgWPM,
              totalFillerWords: savedData.analytics.voice_analysis?.totalFillerWords,
              hasPitchData: savedData.analytics.voice_analysis?.avgPitch > 0
            })
          } else if (voiceAnalysisData && !savedData?.analytics?.voice_analysis) {
            console.error('❌ CRITICAL: Voice analysis data was sent but NOT in response!', {
              sessionId,
              voiceAnalysisKeys: Object.keys(voiceAnalysisData || {}),
              responseAnalyticsKeys: savedData?.analytics ? Object.keys(savedData.analytics) : []
            })
            // Add extra delay and retry verification if voice_analysis is missing
            console.log('⏳ Waiting additional time for database write to commit...')
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // Try to verify by fetching the session
            try {
              const verifyResponse = await fetch(`/api/session?id=${sessionId}`)
              if (verifyResponse.ok) {
                const verifyData = await verifyResponse.json()
                if (verifyData?.analytics?.voice_analysis) {
                  console.log('✅ Voice analysis verified in database after delay')
                } else {
                  console.error('❌ Voice analysis still missing after verification fetch')
                }
              }
            } catch (verifyError) {
              console.error('❌ Error verifying voice analysis:', verifyError)
            }
          }
          
          // Delay to ensure database write is committed before redirect
          // Increased delay to ensure write completes, especially for voice_analysis
          await new Promise(resolve => setTimeout(resolve, 1000)) // Increased from 500ms to 1000ms
          console.log('⏳ Database write delay completed, proceeding with redirect')
        }
        
        // Now redirect after save completes
        // For manual ends, go to loading page
        const redirectUrl = `/trainer/loading/${sessionId}`
        console.log('🚀 Redirecting to loading page:', redirectUrl)
        
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
  }, [sessionId, duration, transcript, router, sessionActive, sessionState])

  // Shared function to handle door closing sequence and end session

  // Direct state-based call end handler - triggers animation immediately
  const handleCallEnd = useCallback((reason: string) => {
    console.log('🚪 handleCallEnd called - setting showDoorCloseAnimation state', { reason })
    setShowDoorCloseAnimation(true) // This triggers the animation via state change
    setVideoMode('closing') // Also set video mode immediately
  }, [])

  const handleDoorClosingSequence = useCallback(async (reason: string = 'User ended conversation') => {
    console.log('🚪 Starting door closing sequence:', reason)
    console.log('🚪 Door closing sequence context:', {
      reason,
      selectedAgent: selectedAgent?.name,
      videoMode,
      sessionActive,
      showDoorCloseAnimation,
      hasVideoRef: !!agentVideoRef.current
    })
    
    // Ensure door close animation state is set
    if (!showDoorCloseAnimation) {
      setShowDoorCloseAnimation(true)
    }
    
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
      
      // Get the closing video path to verify it exists
      const videoPaths = getAgentVideoPaths(agentName)
      const closingVideoPath = videoPaths?.closing
      
      if (!closingVideoPath) {
        console.warn('⚠️ No closing video path found, skipping video animation')
      } else {
        // Switch to closing door video - React will re-render with new src
        setVideoMode('closing')
        
        // Wait for React to update and video element to be ready
        // Also wait for video source to actually change
        await new Promise<void>((resolve) => {
          let attempts = 0
          const maxAttempts = 20 // 2 seconds max wait
          
          const checkVideoReady = () => {
            const video = agentVideoRef.current
            attempts++
            
            if (!video) {
              if (attempts >= maxAttempts) {
                console.warn('⚠️ Video ref not available after waiting, proceeding anyway')
                resolve()
                return
              }
              setTimeout(checkVideoReady, 100)
              return
            }
            
            // Check if video source has changed to closing video
            const currentSrc = video.src || video.currentSrc || ''
            const closingVideoFileName = closingVideoPath.split('/').pop() || ''
            
            // Check if src matches (allowing for URL encoding differences)
            const srcMatches = currentSrc.includes(closingVideoFileName) || 
                              currentSrc.includes(encodeURIComponent(closingVideoFileName))
            
            if (srcMatches || video.readyState >= 2) { // HAVE_CURRENT_DATA or higher
              console.log('🎬 Closing video is ready, src:', currentSrc)
              resolve()
            } else if (attempts >= maxAttempts) {
              console.warn('⚠️ Video source not updated after waiting, proceeding anyway')
              resolve()
            } else {
              setTimeout(checkVideoReady, 100)
            }
          }
          
          // Start checking after a brief delay to allow React to render
          setTimeout(checkVideoReady, 100)
        })
        
        // Wait for closing door video to finish before ending session
        await new Promise<void>((resolve) => {
          const video = agentVideoRef.current
          if (!video) {
            console.warn('⚠️ Video ref not available, proceeding anyway')
            resolve()
            return
          }
          
          // Ensure video is playing
          const playPromise = video.play().catch((err) => {
            console.warn('Video play failed:', err)
            // If play fails, still wait a bit in case it recovers
            setTimeout(() => resolve(), 2000)
          })
          
          const handleVideoEnd = async () => {
            console.log(`🎬 Closing door video finished for ${agentName}`)
            video.removeEventListener('ended', handleVideoEnd)
            video.removeEventListener('error', handleVideoError)
            resolve()
          }
          
          const handleVideoError = (e: any) => {
            console.error('❌ Closing video error:', e)
            video.removeEventListener('ended', handleVideoEnd)
            video.removeEventListener('error', handleVideoError)
            // Still resolve after a delay to not block the session end
            setTimeout(() => resolve(), 1000)
          }
          
          // Check if video already ended (edge case)
          if (video.ended) {
            console.log('🎬 Video already ended')
            resolve()
            return
          }
          
          video.addEventListener('ended', handleVideoEnd)
          video.addEventListener('error', handleVideoError)
          
          // Fallback timeout in case video doesn't fire ended event
          setTimeout(() => {
            console.log('⏰ Closing door video timeout, proceeding anyway')
            video.removeEventListener('ended', handleVideoEnd)
            video.removeEventListener('error', handleVideoError)
            resolve()
          }, 10000) // 10 second timeout
        })
      }
    }
    
    // CRITICAL: Capture transcript state BEFORE setting session inactive
    // This ensures we have the transcript even if state gets cleared
    const currentTranscript = transcript
    console.log('🔚 Door closing sequence complete, preparing to end session...', {
      transcriptLength: currentTranscript.length,
      reason,
      sessionId
    })
    
    // IMPORTANT: Don't set sessionActive to false until AFTER the closing video has played
    // This ensures the video element stays mounted and can play the closing animation
    // The video will be hidden/unmounted when endSession is called
    
    // End the session after door closing sequence completes
    // Pass transcript explicitly to avoid closure issues
    console.log('🔚 Calling endSession after door closing sequence...')
    endSession(reason).catch((error) => {
      console.error('❌ Error in endSession from handleDoorClosingSequence:', error)
    })
    
    // Set session inactive AFTER endSession is called (which will handle cleanup)
    // This ensures the closing video can finish playing
    setTimeout(() => {
      setSessionActive(false)
    }, 100)
  }, [selectedAgent?.name, videoMode, endSession, sessionId, transcript, showDoorCloseAnimation])

  
  // Handle manual end session requests only
  useEffect(() => {
    const handleEndSessionRequest = () => {
      if (sessionActive && sessionId) {
        console.log('🔚 Manual end session requested')
        // Trigger door close animation via state change
        handleCallEnd('Manual end session')
        // Then end the session
        endSession('manual')
      }
    }
    
    // Guard against SSR - only set up event listeners on client
    if (typeof window === 'undefined') {
      return
    }
    
    // Listen for manual end session requests only
    window.addEventListener('trainer:end-session-requested', handleEndSessionRequest)
    
    return () => {
      // Guard against SSR - only remove listeners if window exists
      if (typeof window === 'undefined') return
      
      // Cleanup
      window.removeEventListener('trainer:end-session-requested', handleEndSessionRequest)
    }
  }, [sessionActive, sessionId, endSession, handleCallEnd])

  // Listen for ElevenLabs disconnect and inactivity - play door closing sound
  useEffect(() => {
    if (!sessionActive || typeof window === 'undefined') {
      inactivitySoundPlayedRef.current = false // Reset when session becomes inactive
      return
    }

    const handleConnectionStatus = (e: CustomEvent) => {
      const status = e?.detail
      console.log('📊 Connection status received:', status)
      
      if (status === 'disconnected' && sessionActive) {
        console.log('🔌 ElevenLabs disconnected - playing door closing sound')
        playSound('/sounds/door_close.mp3', 0.9)
        inactivitySoundPlayedRef.current = true
      }
    }

    const handleInactivity = (e: CustomEvent) => {
      const data = e?.detail
      console.log('🔇 Agent inactivity detected:', data)
      console.log('🔇 Inactivity details:', {
        secondsSinceLastMessage: data?.secondsSinceLastMessage,
        timeSinceLastPing: data?.timeSinceLastPing,
        sessionActive,
        sessionId,
        transcriptLength: transcript.length
      })
      
      // Only play sound once per inactivity period, and only if it's been 15+ seconds
      if (sessionActive && data?.secondsSinceLastMessage >= 15 && !inactivitySoundPlayedRef.current) {
        console.log('🔇 Agent stopped responding - playing door closing sound')
        console.warn('⚠️ POSSIBLE ISSUE: Agent stopped responding mid-conversation. Check console for connection errors.')
        playSound('/sounds/door_close.mp3', 0.9)
        inactivitySoundPlayedRef.current = true
      }
    }
    
    const handleAgentError = (e: CustomEvent) => {
      const errorData = e?.detail
      console.error('❌ Agent error detected:', errorData)
      console.error('❌ Error details:', {
        error: errorData?.error,
        errorDetails: errorData?.errorDetails,
        sessionId: errorData?.sessionId,
        currentSessionId: sessionId,
        sessionActive
      })
    }
    
    const handleAgentDisconnect = (e: CustomEvent) => {
      const disconnectData = e?.detail
      console.error('🔌 Agent disconnect detected:', disconnectData)
      console.error('🔌 Disconnect details:', {
        reason: disconnectData?.reason,
        wasConnected: disconnectData?.wasConnected,
        hasSessionId: disconnectData?.hasSessionId,
        sessionId: disconnectData?.sessionId,
        currentSessionId: sessionId,
        sessionActive,
        timeSinceLastMessage: disconnectData?.timeSinceLastMessage,
        timeSinceLastPing: disconnectData?.timeSinceLastPing
      })
    }
    
    const handleReconnecting = (e: CustomEvent) => {
      const reconnectData = e?.detail
      console.log('🔄 Reconnection started:', reconnectData)
      setReconnectingStatus({
        isReconnecting: true,
        attempt: reconnectData?.attempt || 1,
        maxAttempts: reconnectData?.maxAttempts || 3
      })
    }
    
    const handleReconnected = (e: CustomEvent) => {
      const reconnectData = e?.detail
      console.log('✅ Reconnection successful:', reconnectData)
      setReconnectingStatus(null)
      inactivitySoundPlayedRef.current = false // Reset inactivity flag
    }
    
    const handleReconnectFailed = (e: CustomEvent) => {
      const reconnectData = e?.detail
      console.error('❌ Reconnection failed:', reconnectData)
      setReconnectingStatus(null)
      // Show user-friendly message - they may need to manually restart
      console.warn('⚠️ Automatic reconnection failed. You may need to end this session and start a new one.')
    }

    // Reset flag when new messages arrive (agent is responding again)
    const handleAgentMessage = () => {
      inactivitySoundPlayedRef.current = false
      // Clear reconnecting status if agent starts responding
      if (reconnectingStatus?.isReconnecting) {
        setReconnectingStatus(null)
      }
    }

    window.addEventListener('connection:status', handleConnectionStatus as EventListener)
    window.addEventListener('agent:inactivity', handleInactivity as EventListener)
    window.addEventListener('agent:message', handleAgentMessage as EventListener)
    window.addEventListener('agent:response', handleAgentMessage as EventListener)
    window.addEventListener('agent:error', handleAgentError as EventListener)
    window.addEventListener('agent:disconnect', handleAgentDisconnect as EventListener)
    window.addEventListener('agent:reconnecting', handleReconnecting as EventListener)
    window.addEventListener('agent:reconnected', handleReconnected as EventListener)
    window.addEventListener('agent:reconnect-failed', handleReconnectFailed as EventListener)
    
    return () => {
      window.removeEventListener('connection:status', handleConnectionStatus as EventListener)
      window.removeEventListener('agent:inactivity', handleInactivity as EventListener)
      window.removeEventListener('agent:message', handleAgentMessage as EventListener)
      window.removeEventListener('agent:response', handleAgentMessage as EventListener)
      window.removeEventListener('agent:error', handleAgentError as EventListener)
      window.removeEventListener('agent:disconnect', handleAgentDisconnect as EventListener)
      window.removeEventListener('agent:reconnecting', handleReconnecting as EventListener)
      window.removeEventListener('agent:reconnected', handleReconnected as EventListener)
      window.removeEventListener('agent:reconnect-failed', handleReconnectFailed as EventListener)
    }
  }, [sessionActive])

  // Add beforeunload warning during active session
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (sessionState === 'active' && sessionActive) {
        e.preventDefault()
        e.returnValue = 'You have an active training session. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [sessionState, sessionActive])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleMuteToggle = () => {
    if (webcamPIPRef.current) {
      webcamPIPRef.current.toggleMic()
      // Update state after a brief delay to ensure track state has updated
      setTimeout(() => {
        if (webcamPIPRef.current) {
          setIsMuted(!webcamPIPRef.current.isMicOn())
        }
      }, 50)
    }
  }

  const handleCameraToggle = () => {
    if (webcamPIPRef.current) {
      webcamPIPRef.current.toggleCamera()
      // Update state after a brief delay to ensure track state has updated
      setTimeout(() => {
        if (webcamPIPRef.current) {
          setIsCameraOff(!webcamPIPRef.current.isCameraOn())
        }
      }, 50)
    }
  }

  // Show door closing video when in door-closing state
  if (sessionState === 'door-closing') {
    return (
      <DoorClosingVideo
        agentId={selectedAgent?.eleven_agent_id || ''}
        agentName={selectedAgent?.name || null}
        onComplete={handleDoorVideoComplete}
        getAgentVideoPaths={getAgentVideoPaths}
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-sans"
    >
      <LastCreditWarningModal 
        isOpen={showLastCreditWarning} 
        onClose={() => setShowLastCreditWarning(false)}
        onContinue={() => {
          setShowLastCreditWarning(false)
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
      <div className="relative w-full h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
        
        {/* Header */}
        <div className="hidden sm:flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-slate-700/50 flex-shrink-0 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm font-semibold text-white font-space truncate">
              {sessionActive ? `Session - ${selectedAgent?.name || 'Training'}` : 'Training Session'}
            </span>
          </div>
        </div>

        {/* Main Content Area - Stacked on mobile, side-by-side on desktop */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-8">
          
          {/* LEFT SIDE (55%) - Agent Video with PIP */}
          <div className="w-full lg:w-[55%] relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl lg:rounded-2xl overflow-hidden shadow-2xl h-[50vh] lg:h-auto lg:min-h-0">
            <div className="absolute inset-0 rounded-lg overflow-hidden">
              {loading ? (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center">
                  <div className="text-white text-center pointer-events-none">
                    <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-white mx-auto mb-4"></div>
                    <p className="text-sm">Connecting...</p>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full overflow-hidden">
                  {/* Video container */}
                  <div className="relative w-full h-full">
                    {(() => {
                      const shouldUseVideo = agentHasVideos(selectedAgent?.name) && (sessionActive || videoMode === 'closing' || showDoorCloseAnimation)
                      
                      if (shouldUseVideo) {
                        const videoPaths = getAgentVideoPaths(selectedAgent?.name)
                        if (!videoPaths) return null
                        
                        const videoSrcRaw = (showDoorCloseAnimation || videoMode === 'closing') && videoPaths.closing
                          ? videoPaths.closing
                          : videoMode === 'opening' && videoPaths.opening
                          ? videoPaths.opening
                          : videoMode === 'loop'
                          ? videoPaths.loop
                          : videoPaths.closing
                        
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
                              if (agentVideoRef.current) {
                                console.log('🎬 Video loaded, attempting to play:', videoSrcRaw, 'Mode:', videoMode, 'ShowClose:', showDoorCloseAnimation)
                                agentVideoRef.current.play().catch((err) => {
                                  console.warn('Video autoplay failed:', err)
                                })
                              }
                            }}
                            onCanPlay={() => {
                              if (agentVideoRef.current && (showDoorCloseAnimation || videoMode === 'closing')) {
                                console.log('🎬 Video can play, forcing play for closing animation')
                                agentVideoRef.current.play().catch((err) => {
                                  console.warn('Video force play failed:', err)
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
                      
                      const src = resolveAgentImage(selectedAgent, sessionActive)
                      const imageSrc = src && (src.includes(' ') || src.includes('&'))
                        ? src.split('/').map((part, i) => i === 0 ? part : encodeURIComponent(part)).join('/')
                        : src
                      
                      return imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt={selectedAgent?.name || 'Agent'}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                          style={{ objectFit: 'cover', objectPosition: 'center center' }}
                          priority
                          unoptimized={src?.includes(' ') || src?.includes('&')}
                          onError={(e) => {
                            console.error('❌ Image failed to load:', src, 'Encoded:', imageSrc)
                            e.stopPropagation()
                          }}
                          // Prevent layout shift with aspect ratio placeholder
                          placeholder="blur"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                        />
                      ) : null
                    })()}
                    
                    {/* Persona badge */}
                    {sessionActive && selectedAgent && (
                      <div className="hidden sm:block absolute top-6 left-6 z-10">
                        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full">
                          <span className="text-white text-sm font-medium">{selectedAgent.name}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Session progress bar */}
                    {sessionActive && (
                      <div className="hidden sm:block absolute bottom-0 left-0 right-0 h-1 bg-black/20 z-10">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                          style={{ width: `${Math.min((duration / 900) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Door Opening Video Overlay */}
                  {showDoorOpeningVideo && (() => {
                    const videoPaths = getAgentVideoPaths(selectedAgent?.name)
                    const videoPathRaw = videoPaths?.opening || '/DIY DAVE OPENIG DOOR.mp4'
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
                  
                  {/* Knock Button Overlay */}
                  {!sessionActive && !loading && selectedAgent && !showDoorOpeningVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                      <button
                        onClick={() => startSession()}
                        className="relative px-8 lg:px-10 py-5 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 hover:from-slate-700 hover:via-slate-600 hover:to-slate-700 active:from-slate-900 active:via-slate-800 active:to-slate-900 text-white font-space font-bold text-lg lg:text-xl rounded-2xl transition-all duration-300 active:scale-95 border-2 border-white/30 hover:border-white/40 backdrop-blur-sm min-h-[56px] touch-manipulation z-20 overflow-hidden group shadow-2xl"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <span className="hidden sm:inline">
                            Knock on <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">{selectedAgent.name}'s</span> Door 🚪
                          </span>
                          <span className="sm:hidden">Knock 🚪</span>
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-500" />
                      </button>
                    </div>
                  )}
                  
                  {/* PIP Webcam Overlay - Bottom Right (above controls) - Mobile optimized */}
                  {sessionActive && (
                    <div className="absolute bottom-24 sm:bottom-28 lg:bottom-32 right-3 sm:right-4 lg:right-6 z-20 w-32 h-24 sm:w-40 sm:h-[120px] lg:w-[211px] lg:h-[158px] shadow-2xl rounded-lg overflow-hidden">
                      <WebcamPIP ref={webcamPIPRef} />
                    </div>
                  )}
                  
                  {/* Reconnection Status Banner */}
                  {sessionActive && reconnectingStatus?.isReconnecting && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-amber-500/90 backdrop-blur-md px-4 py-2 rounded-lg shadow-lg border border-amber-400/50">
                      <div className="flex items-center gap-2 text-white text-sm font-medium">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>
                          Reconnecting... (Attempt {reconnectingStatus.attempt}/{reconnectingStatus.maxAttempts})
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Video Controls Overlay */}
                  {sessionActive && (
                    <VideoControls
                      duration={duration}
                      onMuteToggle={handleMuteToggle}
                      onCameraToggle={handleCameraToggle}
                      onEndSession={() => endSession()}
                      isMuted={isMuted}
                      isCameraOff={isCameraOff}
                      personaName={selectedAgent?.name}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE (45%) - Metrics, Feedback, Transcript */}
          <div className="hidden lg:flex w-full lg:w-[45%] flex-col gap-3 sm:gap-4 overflow-hidden lg:h-full">
            {/* Metrics Panel - Mobile optimized */}
            <div className="flex-shrink-0 lg:h-[30%] lg:min-h-[120px]">
              <LiveMetricsPanel metrics={metrics} />
            </div>
            
            {/* Feedback Feed - Mobile optimized */}
            <div className="hidden sm:flex flex-shrink-0 flex-col overflow-hidden lg:-mt-[92px] lg:h-[32%] lg:min-h-[200px]">
              <LiveFeedbackFeed feedbackItems={feedbackItems} />
            </div>
            
            {/* Transcript - Mobile optimized */}
            <div className="flex-1 flex flex-col overflow-hidden lg:-mt-[20px] lg:h-[34%] lg:min-h-[200px]">
              <LiveTranscript 
                transcript={transcript} 
                agentName={selectedAgent?.name}
                agentImageUrl={selectedAgent ? resolveAgentImage(selectedAgent, sessionActive) : null}
                userAvatarUrl={userAvatarUrl}
              />
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
      
      {/* Hidden WebcamRecorder for recording functionality */}
      {sessionActive && (
        <div className="hidden">
          <WebcamRecorder 
            sessionActive={sessionActive} 
            duration={duration}
          />
        </div>
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
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
        * {
          transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 200ms;
        }
      `}</style>
    </motion.div>
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
