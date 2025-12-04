'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Home, Mic, FileText, Trophy } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { LiveMetricsPanel } from '@/components/trainer/LiveMetricsPanel'
import { LiveFeedbackFeed } from '@/components/trainer/LiveFeedbackFeed'
import { LiveTranscript } from '@/components/trainer/LiveTranscript'
import { VideoControls } from '@/components/trainer/VideoControls'
import { WebcamPIP, type WebcamPIPRef } from '@/components/trainer/WebcamPIP'
import type { EndCallReason } from '@/components/trainer/ElevenLabsConversation'

// Dynamic imports for heavy components - only load when needed
const ElevenLabsConversation = dynamicImport(() => import('@/components/trainer/ElevenLabsConversation'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div></div>
})
const WebcamRecorder = dynamicImport(() => import('@/components/trainer/WebcamRecorder'), { ssr: false })

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
    'Switchover Steve': '/Already got it Alan landscape.png',
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
  const router = useRouter()
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionState, setSessionState] = useState<'active' | 'ending' | 'door-closing' | 'complete'>('active')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [conversationToken, setConversationToken] = useState<string | null>(null)
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
  const handleCallEndRef = useRef<((reason: string) => void) | null>(null) // Ref for handleCallEnd callback
  const handleDoorClosingSequenceRef = useRef<((reason: string) => Promise<void>) | null>(null) // Ref for handleDoorClosingSequence callback

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
  
  // GLOBAL FULLSCREEN PREVENTION - Monitor and exit fullscreen continuously
  // This MUST run during door-closing state to prevent iOS Safari fullscreen glitches
  useEffect(() => {
    // Always run during door-closing state, active session, or door close animation
    if (!sessionActive && !showDoorCloseAnimation && sessionState !== 'door-closing') return
    
    const exitFullscreen = () => {
      if (document.fullscreenElement) {
        console.log('🚫 Global monitor: Detected fullscreen, exiting immediately')
        document.exitFullscreen().catch(() => {
          // Try all browser-specific exit methods
          if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen().catch(() => {})
          }
          if ((document as any).mozCancelFullScreen) {
            (document as any).mozCancelFullScreen().catch(() => {})
          }
          if ((document as any).msExitFullscreen) {
            (document as any).msExitFullscreen().catch(() => {})
          }
        })
      }
    }
    
    const handleFullscreenChange = () => {
      exitFullscreen()
    }
    
    // Monitor fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)
    
    // Also monitor the video element specifically
    if (agentVideoRef.current) {
      const video = agentVideoRef.current
      const videoFullscreenHandler = () => {
        if (document.fullscreenElement === video || document.fullscreenElement) {
          console.log('🚫 Video-specific fullscreen detected, exiting')
          exitFullscreen()
        }
      }
      
      video.addEventListener('fullscreenchange', videoFullscreenHandler)
      video.addEventListener('webkitfullscreenchange', videoFullscreenHandler)
      
      // Periodic check as backup (every 500ms)
      const intervalId = setInterval(() => {
        if (document.fullscreenElement === video || document.fullscreenElement) {
          console.log('🚫 Periodic check: Fullscreen detected, exiting')
          exitFullscreen()
        }
        // Also ensure loop is correct
        if (agentVideoRef.current) {
          if (videoMode === 'closing' || showDoorCloseAnimation) {
            agentVideoRef.current.loop = false
          } else if (videoMode === 'loop') {
            agentVideoRef.current.loop = true
          }
        }
      }, 500)
      
      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange)
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
        document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
        video.removeEventListener('fullscreenchange', videoFullscreenHandler)
        video.removeEventListener('webkitfullscreenchange', videoFullscreenHandler)
        clearInterval(intervalId)
        exitFullscreen() // Exit on cleanup
      }
    }
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
      exitFullscreen()
    }
  }, [sessionActive, showDoorCloseAnimation, videoMode, sessionState])
  
  // Auto-end detection disabled - manual session ending only
  //   onConversationEnd: () => {
  //     console.log('🚪 User goodbye detected - triggering door closing sequence')
  //     if (handleCallEndRef.current) {
  //       handleCallEndRef.current('User said goodbye')
  //     } else if (handleDoorClosingSequenceRef.current) {
  //       // Fallback: call handleDoorClosingSequence directly if handleCallEnd not available
  //       console.log('🚪 Using handleDoorClosingSequence directly as fallback')
  //       handleDoorClosingSequenceRef.current('User said goodbye').catch(err => {
  //         console.error('❌ Error in handleDoorClosingSequence:', err)
  //       })
  //     } else {
  //       console.warn('⚠️ Neither handleCallEnd nor handleDoorClosingSequence initialized yet')
  //     }
  //   },
  //   transcript,
  //   sessionStartTime: sessionStartTimeRef.current,
  //   sessionActive,
  //   enabled: sessionActive // Only enabled when session is active
  // })
  
  // Only use transcript feedback items (no voice feedback during live session)
  const feedbackItems = transcriptFeedbackItems
  
  // Merge metrics
  const metrics = {
    ...transcriptMetrics,
    voiceMetrics: voiceMetrics
  }
  
  // Helper function to check if agent has video animations
  const agentHasVideos = (agentName: string | null | undefined): boolean => {
    return agentName === 'Average Austin' || agentName === 'Tag Team Tanya & Tom' || agentName === 'Veteran Victor' || agentName === 'No Problem Nancy' || agentName === 'Just Treated Jerry' || agentName === 'Switchover Steve' || agentName === 'Think About It Tina' || agentName === 'Too Expensive Tim' || agentName === 'Skeptical Sam' || agentName === 'Renter Randy' || agentName === 'DIY Dave' || agentName === 'Busy Beth' || agentName === 'Not Interested Nick' || agentName === 'Spouse Check Susan'
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
    if (agentName === 'Switchover Steve') {
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
  
  // Video recording disabled - archived for future implementation
  const isVideoRecording = false

  const durationInterval = useRef<NodeJS.Timeout | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const signedUrlAbortRef = useRef<AbortController | null>(null)
  const agentVideoRef = useRef<HTMLVideoElement | null>(null) // Ref for Tanya & Tom video element
  const inactivitySoundPlayedRef = useRef(false) // Track if we've played sound for inactivity
  
  const sessionLimit = useSessionLimit()
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
      
      // COMPREHENSIVE FULLSCREEN PREVENTION - Applied to ALL video modes
      const exitFullscreen = () => {
        if (document.fullscreenElement === video || document.fullscreenElement) {
          console.log('🚫 Detected fullscreen, exiting immediately')
          document.exitFullscreen().catch(() => {
            // Try webkit-specific exit
            if ((document as any).webkitExitFullscreen) {
              (document as any).webkitExitFullscreen().catch(() => {})
            }
            if ((document as any).mozCancelFullScreen) {
              (document as any).mozCancelFullScreen().catch(() => {})
            }
            if ((document as any).msExitFullscreen) {
              (document as any).msExitFullscreen().catch(() => {})
            }
          })
        }
      }
      
      const preventFullscreen = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
        exitFullscreen()
      }
      
      // Monitor for fullscreen changes and exit immediately
      const handleFullscreenChange = () => {
        if (document.fullscreenElement === video || document.fullscreenElement) {
          console.log('🚫 Fullscreen change detected, exiting')
          exitFullscreen()
        }
      }
      
      // Add comprehensive fullscreen prevention listeners
      video.addEventListener('fullscreenchange', handleFullscreenChange)
      video.addEventListener('webkitfullscreenchange', handleFullscreenChange)
      video.addEventListener('mozfullscreenchange', handleFullscreenChange)
      video.addEventListener('MSFullscreenChange', handleFullscreenChange)
      video.addEventListener('dblclick', preventFullscreen)
      video.addEventListener('webkitbeginfullscreen', preventFullscreen)
      video.addEventListener('webkitendfullscreen', preventFullscreen)
      video.addEventListener('enterpictureinpicture', preventFullscreen)
      
      // Prevent fullscreen via context menu
      video.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        exitFullscreen()
      })
      
      // If showDoorCloseAnimation is true, ensure we're in closing mode
      if (showDoorCloseAnimation && videoMode !== 'closing') {
        console.log('🎬 showDoorCloseAnimation is true, setting videoMode to closing')
        setVideoMode('closing')
      }
      
      if (videoMode === 'opening') {
        // CRITICAL: Disable loop for opening video
        video.loop = false
        
        // Play opening door animation, then transition to loop
        video.play().catch((err) => {
          console.warn('Failed to play opening animation:', err)
        })
        
        const handleOpeningEnded = () => {
          console.log('🎬 Opening animation finished, transitioning to loop')
          video.loop = false // Ensure loop stays disabled
          setVideoMode('loop')
          if (agentVideoRef.current) {
            agentVideoRef.current.removeEventListener('ended', handleOpeningEnded)
          }
        }
        
        video.addEventListener('ended', handleOpeningEnded)
        
        return () => {
          if (agentVideoRef.current) {
            agentVideoRef.current.removeEventListener('ended', handleOpeningEnded)
            agentVideoRef.current.removeEventListener('fullscreenchange', handleFullscreenChange)
            agentVideoRef.current.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
            agentVideoRef.current.removeEventListener('mozfullscreenchange', handleFullscreenChange)
            agentVideoRef.current.removeEventListener('MSFullscreenChange', handleFullscreenChange)
            agentVideoRef.current.removeEventListener('dblclick', preventFullscreen)
            agentVideoRef.current.removeEventListener('webkitbeginfullscreen', preventFullscreen)
            agentVideoRef.current.removeEventListener('webkitendfullscreen', preventFullscreen)
            agentVideoRef.current.removeEventListener('enterpictureinpicture', preventFullscreen)
            agentVideoRef.current.removeEventListener('contextmenu', preventFullscreen as any)
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
        
        // CRITICAL: Disable loop for closing video IMMEDIATELY
        video.loop = false
        
        // Handle video ended - ensure it stops and doesn't loop
        const handleClosingEnded = () => {
          console.log('🎬 Closing video ended, stopping playback')
          video.pause()
          video.currentTime = video.duration
          video.loop = false // Ensure loop stays disabled
          exitFullscreen() // Exit fullscreen if somehow entered
        }
        
        video.addEventListener('ended', handleClosingEnded)
        
        // Force video to load if not already loaded
        if (video.readyState === 0) {
          video.load()
        }
        
        // Ensure video is loaded and ready
        const handleCanPlay = () => {
          console.log('🎬 Closing video can play, starting playback')
          video.loop = false // Ensure loop is disabled
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
                  video.loop = false
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
          video.loop = false // Ensure loop is disabled
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
                  video.loop = false
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
          video.loop = false // Ensure loop is disabled
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
          video.loop = false // Ensure loop stays disabled when playing
          video.removeEventListener('play', handlePlay)
        }
        video.addEventListener('play', handlePlay)
        
        return () => {
          video.removeEventListener('canplay', handleCanPlay)
          video.removeEventListener('loadeddata', handleLoadedData)
          video.removeEventListener('play', handlePlay)
          video.removeEventListener('ended', handleClosingEnded)
          video.removeEventListener('fullscreenchange', handleFullscreenChange)
          video.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
          video.removeEventListener('mozfullscreenchange', handleFullscreenChange)
          video.removeEventListener('MSFullscreenChange', handleFullscreenChange)
          video.removeEventListener('dblclick', preventFullscreen)
          video.removeEventListener('webkitbeginfullscreen', preventFullscreen)
          video.removeEventListener('webkitendfullscreen', preventFullscreen)
          video.removeEventListener('enterpictureinpicture', preventFullscreen)
          video.removeEventListener('contextmenu', preventFullscreen as any)
          // Ensure loop is disabled
          video.loop = false
          exitFullscreen() // Exit fullscreen on cleanup
        }
      } else if (videoMode === 'loop') {
        // Ensure loop is enabled for loop mode
        video.loop = true
        
        // Track when loop video starts and its duration
        const handleLoadedMetadata = () => {
          if (agentVideoRef.current) {
            loopVideoDurationRef.current = agentVideoRef.current.duration
            console.log('🎬 Loop video duration:', agentVideoRef.current.duration)
            // Ensure loop is still enabled after metadata loads
            agentVideoRef.current.loop = true
          }
        }
        
        const handlePlay = () => {
          if (agentVideoRef.current) {
            loopVideoStartTimeRef.current = Date.now() - (agentVideoRef.current.currentTime * 1000)
            console.log('🎬 Loop video started, tracking playback position')
            // Ensure loop is still enabled when playing
            agentVideoRef.current.loop = true
            exitFullscreen() // Exit fullscreen if somehow entered
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
            agentVideoRef.current.removeEventListener('fullscreenchange', handleFullscreenChange)
            agentVideoRef.current.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
            agentVideoRef.current.removeEventListener('mozfullscreenchange', handleFullscreenChange)
            agentVideoRef.current.removeEventListener('MSFullscreenChange', handleFullscreenChange)
            agentVideoRef.current.removeEventListener('dblclick', preventFullscreen)
            agentVideoRef.current.removeEventListener('webkitbeginfullscreen', preventFullscreen)
            agentVideoRef.current.removeEventListener('webkitendfullscreen', preventFullscreen)
            agentVideoRef.current.removeEventListener('enterpictureinpicture', preventFullscreen)
            agentVideoRef.current.removeEventListener('contextmenu', preventFullscreen as any)
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

      // Filter out Tanya & Tom (temporarily disabled)
      const availableAgents = agents?.filter((agent: Agent) => agent.name !== 'Tag Team Tanya & Tom') || []

      if (agentParam) {
        const match = availableAgents.find((agent: Agent) => agent.eleven_agent_id === agentParam)
        // If trying to select Tanya & Tom, redirect to select-homeowner page
        if (!match && agents?.find((agent: Agent) => agent.eleven_agent_id === agentParam && agent.name === 'Tag Team Tanya & Tom')) {
          router.push('/trainer/select-homeowner')
          return
        }
        console.log('🔍 Selected agent by param:', match)
        setSelectedAgent(match || availableAgents?.[0] || null)
      } else {
        console.log('🔍 Selected first agent:', availableAgents?.[0])
        setSelectedAgent(availableAgents?.[0] || null)
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

  const fetchConversationToken = async (agentId: string, isFreeDemo: boolean = false): Promise<{ conversationToken: string | null; canProceed: boolean; error?: string }> => {
    signedUrlAbortRef.current?.abort()
    const controller = new AbortController()
    signedUrlAbortRef.current = controller

    try {
      const response = await fetch('/api/eleven/conversation-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, is_free_demo: isFreeDemo }),
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

    // Prevent starting session with Tanya & Tom (temporarily disabled)
    if (selectedAgent.name === 'Tag Team Tanya & Tom') {
      alert('Tag Team Tanya & Tom is coming soon! Please select another agent.')
      router.push('/trainer/select-homeowner')
      return
    }

    try {
      setLoading(true)
      // Clear previous session state to prevent glitches
      setSessionId(null)
      setTranscript([])
      setDuration(0)
      setSessionActive(false)
      setSessionState('active')

      const { data: { user } } = await supabase.auth.getUser()
      const isAnonymous = !user
      let isFreeDemo = false
      
      // ARCHIVED: All paywall checks removed - software is now free for signed-in users
      // Check for anonymous free demo usage via localStorage
      if (isAnonymous) {
        const usedFreeDemo = localStorage.getItem('used_free_demo') === 'true'
        if (usedFreeDemo) {
          // Anonymous users still need to sign in for unlimited access
          router.push(`/auth/login?redirect=/trainer?agent=${selectedAgent.eleven_agent_id}&name=${encodeURIComponent(selectedAgent.name)}`)
          setLoading(false)
          return
        } else {
          // Mark as used in localStorage
          localStorage.setItem('used_free_demo', 'true')
          localStorage.setItem('free_demo_used_at', new Date().toISOString())
          isFreeDemo = true
          console.log('✅ Anonymous free demo session granted')
          // Continue with session start (will create anonymous session)
        }
      } else {
        // Authenticated user - FREE ACCESS (all paywalls archived)
        console.log('✅ Authenticated user - free access granted')
        // Continue with session start - no subscription checks needed
      }

      const tokenPromise = fetchConversationToken(selectedAgent.eleven_agent_id, isFreeDemo)

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
      
      const newId = await createSessionRecord(isFreeDemo)
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
      
      // Track session count for analytics (non-blocking)
      fetch('/api/session/increment', { method: 'POST' })
        .then(() => {
          sessionLimit.refresh()
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

  const createSessionRecord = async (isFreeDemo: boolean = false) => {
    try {
      const resp = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agent_name: selectedAgent?.name,
          agent_id: selectedAgent?.eleven_agent_id,
          is_free_demo: isFreeDemo
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

  // Handle door closing video completion - will be defined after endSession and triggerGradingAfterDoorClose
  // Placeholder - will be redefined later
  let handleDoorVideoComplete: () => void = () => {
    console.log('⚠️ handleDoorVideoComplete called before initialization')
  }

  // Trigger grading after ensuring transcript is saved
  const triggerGradingAfterDoorClose = useCallback(async (sessionId: string) => {
    console.log('🎯 Triggering automatic grading for session:', sessionId)
    
    // Wait briefly for transcript to be saved to database (reduced from 2s to 1s)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Fire new phased grading orchestration in background - don't wait for it
    // Grading runs in background while user provides feedback
    fetch('/api/grade/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then(async response => {
        if (response.ok) {
          const data = await response.json().catch(() => ({}))
          console.log('✅ Phased grading orchestration started in background', data.phases)
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('❌ Grading orchestration failed:', response.status, errorData)
        }
      })
      .catch(error => {
        console.error('❌ Error starting grading orchestration:', error)
      })
    
    // Redirect to feedback page immediately - grading runs in background
    console.log('🚀 Redirecting to feedback page (grading running in background)')
    window.location.href = `/trainer/feedback/${sessionId}`
  }, [])

  const restartSession = useCallback(async () => {
    if (!selectedAgent?.eleven_agent_id) {
      alert('Please select an agent first')
      return
    }

    try {
      // End current session first
      if (sessionActive && sessionId) {
        // Clear session state without redirecting
        setSessionActive(false)
        setConversationToken(null)
        setTranscript([])
        setDuration(0)
        
        if (durationInterval.current) {
          clearInterval(durationInterval.current)
          durationInterval.current = null
        }
        
        // Finalize current session
        try {
          await fetch('/api/session', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessionId,
              transcript,
              duration_seconds: duration,
              end_reason: 'restart',
            }),
          })
        } catch (e) {
          console.error('Error finalizing session before restart:', e)
        }
      }

      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 500))

      // Start new session
      await startSession()
    } catch (error: any) {
      logger.error('Error restarting session', error)
      alert(`Failed to restart session: ${error?.message || 'Unknown error'}`)
    }
  }, [selectedAgent, sessionActive, sessionId, transcript, duration, startSession])

  const endSession = useCallback(async (endReason?: string, skipRedirect: boolean = false) => {
    // Session ending (manual end - skip video, go straight to analytics/loading)
    // skipRedirect: if true, don't redirect (used when auto-grading after door close)
    
    console.log('🔚 endSession called', { 
      sessionId, 
      duration, 
      transcriptLength: transcript.length,
      endReason: endReason || 'manual',
      skipRedirect
    })
    
    // Prevent multiple calls - but allow if we have sessionId even if sessionActive is false
    if (!sessionId) {
      console.log('⚠️ endSession called but no sessionId, ignoring')
      return
    }
    
    // If we're already in door-closing state, don't process manual end
    if (sessionState === 'door-closing' && !skipRedirect) {
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
        
        // Save session data
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
        
        // Trigger grading in background for manual ends
        if (!skipRedirect) {
          // Fire grading in background - don't wait for it
          fetch('/api/grade/orchestrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          })
            .then(async response => {
              if (response.ok) {
                const data = await response.json().catch(() => ({}))
                console.log('✅ Grading orchestration started in background', data.phases)
              } else {
                const errorData = await response.json().catch(() => ({}))
                console.error('❌ Grading orchestration failed:', response.status, errorData)
              }
            })
            .catch(error => {
              console.error('❌ Error starting grading orchestration:', error)
            })
        }
        
        // Now redirect after save completes (unless skipRedirect is true)
        if (!skipRedirect) {
          // Redirect to feedback page - grading runs in background
          const redirectUrl = `/trainer/feedback/${sessionId}`
          console.log('🚀 Redirecting to feedback page:', redirectUrl)
          
          // Use window.location.href for reliable redirect (blocking)
          window.location.href = redirectUrl
          
          // Fallback redirect if window.location fails
          setTimeout(() => {
            if (window.location.pathname !== redirectUrl) {
              console.log('⚠️ Primary redirect failed, trying router.push')
              router.push(redirectUrl)
            }
          }, 100)
        } else {
          console.log('⏸️ Skipping redirect (will be handled by grading trigger)')
        }
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
  const handleDoorClosingSequence = useCallback(async (reason: string = 'User ended conversation') => {
    console.log('🚪 Ending session directly (door closing video disabled):', reason)
    
    // Stop any playing video immediately
    if (agentVideoRef.current) {
      console.log('🎬 Stopping video before ending session')
      agentVideoRef.current.pause()
      agentVideoRef.current.src = ''
      agentVideoRef.current.load()
      agentVideoRef.current.loop = false // Ensure no looping
    }
    
    // CRITICAL: Capture transcript state BEFORE setting session inactive
    const currentTranscript = transcript
    console.log('🔚 Ending session directly:', {
      transcriptLength: currentTranscript.length,
      reason,
      sessionId
    })
    
    // End the session directly (saves transcript and voice analysis)
    // Pass skipRedirect=true so we can trigger grading before redirecting
    console.log('🔚 Calling endSession...')
    try {
      await endSession(reason, true) // skipRedirect = true
      
      // After session is saved, trigger grading automatically
      console.log('🎯 Starting automatic grading...')
      await triggerGradingAfterDoorClose(sessionId!)
    } catch (error) {
      console.error('❌ Error in endSession or grading:', error)
      // Fallback: redirect to loading page which will trigger grading
      if (sessionId) {
        window.location.href = `/trainer/loading/${sessionId}`
      }
    }
  }, [endSession, sessionId, transcript])
  
  // Define handleDoorVideoComplete after endSession and triggerGradingAfterDoorClose are available
  handleDoorVideoComplete = useCallback(async () => {
    console.log('🎬 Door closing video completed')
    setSessionState('complete')
    
    if (!sessionId) {
      router.push('/trainer')
      return
    }
    
    // Capture transcript state before ending session
    const currentTranscript = transcript
    console.log('🔚 Door closing video complete, preparing to end session and start grading...', {
      transcriptLength: currentTranscript.length,
      sessionId
    })
    
    try {
      // End the session first (saves transcript and voice analysis)
      await endSession('Conversation ended', true) // skipRedirect = true
      
      // After session is saved, trigger grading automatically
      console.log('🎯 Starting automatic grading after door close video...')
      await triggerGradingAfterDoorClose(sessionId)
      
      // Redirect to loading page - it will wait for grading to complete
      window.location.href = `/trainer/loading/${sessionId}`
    } catch (error) {
      console.error('❌ Error in endSession or grading from handleDoorVideoComplete:', error)
      // Fallback: redirect to loading page which will trigger grading
      window.location.href = `/trainer/loading/${sessionId}`
    }
  }, [sessionId, router, transcript, endSession, triggerGradingAfterDoorClose])

  // Direct state-based call end handler - triggers door closing sequence
  const handleCallEnd = useCallback((reason: string) => {
    console.log('🚪 handleCallEnd called - triggering door closing sequence', { reason })
    handleDoorClosingSequence(reason)
  }, [handleDoorClosingSequence])
  
  // Update refs when callbacks are defined
  useEffect(() => {
    handleCallEndRef.current = handleCallEnd
  }, [handleCallEnd])
  
  useEffect(() => {
    handleDoorClosingSequenceRef.current = handleDoorClosingSequence
  }, [handleDoorClosingSequence])

  // Handler for when AI agent explicitly ends the call via end_call tool
  const handleAgentEndCall = useCallback((reason: EndCallReason) => {
    console.log('🚪 ========================================')
    console.log('🚪 handleAgentEndCall TRIGGERED!')
    console.log('🚪 Reason:', reason)
    console.log('🚪 Session active:', sessionActive)
    console.log('🚪 Session ID:', sessionId)
    console.log('🚪 ========================================')
    
    if (!sessionActive || !sessionId) {
      console.log('⚠️ No active session, ignoring end_call')
      return
    }
    
    // Map the reason to a human-readable string for the session record
    const reasonMap: Record<EndCallReason, string> = {
      rejection: 'Homeowner rejected - door closed',
      sale_complete: 'Sale completed successfully',
      goodbye: 'Conversation ended naturally',
      hostile: 'Homeowner became hostile'
    }
    
    const endReason = reasonMap[reason] || 'Agent ended conversation'
    
    console.log('🚪 Triggering door closing sequence with reason:', endReason)
    
    // Trigger the door closing sequence
    handleDoorClosingSequence(endReason)
    
  }, [sessionActive, sessionId, handleDoorClosingSequence])

  // Auto-end feature disabled - manual session ending only

  // Backup listener for agent:end_call event (in case callback doesn't fire)
  useEffect(() => {
    if (!sessionActive || typeof window === 'undefined') return
    
    const handleEndCallEvent = (e: CustomEvent) => {
      const { reason, sessionId: eventSessionId } = e.detail || {}
      
      console.log('🚪 agent:end_call EVENT received:', { reason, eventSessionId })
      
      // Only process if it matches our current session
      if (eventSessionId === sessionId && sessionActive) {
        console.log('🚪 Processing end_call event - triggering door close')
        
        const reasonMap: Record<string, string> = {
          rejection: 'Homeowner rejected - door closed',
          sale_complete: 'Sale completed successfully', 
          goodbye: 'Conversation ended naturally',
          hostile: 'Homeowner became hostile'
        }
        
        const endReason = reasonMap[reason] || 'Agent ended conversation'
        handleDoorClosingSequence(endReason)
      }
    }
    
    window.addEventListener('agent:end_call', handleEndCallEvent as EventListener)
    
    return () => {
      window.removeEventListener('agent:end_call', handleEndCallEvent as EventListener)
    }
  }, [sessionActive, sessionId, handleDoorClosingSequence])
  
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
  // DISABLED during door closing sequence to prevent video fullscreen glitches
  useEffect(() => {
    // Skip this entire effect if door closing sequence is active
    if (videoMode === 'closing' || showDoorCloseAnimation || sessionState === 'door-closing') {
      return
    }
    
    if (!sessionActive || typeof window === 'undefined') {
      inactivitySoundPlayedRef.current = false // Reset when session becomes inactive
      return
    }

    const handleConnectionStatus = (e: CustomEvent) => {
      const status = e?.detail
      console.log('📊 Connection status received:', status)
      
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
  }, [sessionActive, videoMode, showDoorCloseAnimation, sessionState])

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

  //     />
  //   )
  // }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-black font-sans"
    >

      {/* Full Screen Session Container */}
      <div className="relative w-full h-screen flex flex-col bg-black overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 lg:px-8 py-2 sm:py-3 lg:py-4 border-b border-slate-800/80 flex-shrink-0 bg-slate-900/98">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm font-semibold text-white font-space truncate">
              {sessionActive ? `Session - ${selectedAgent?.name || 'Training'}` : 'Training Session'}
            </span>
          </div>
        </div>

        {/* Mobile Layout - Split View */}
        <div className="md:hidden flex-1 flex flex-col overflow-hidden min-h-0" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          {/* Top Section - Agent Video (Prominent) */}
          <div className="flex-shrink-0 w-full h-[45vh] min-h-[280px] max-h-[50vh] relative bg-slate-900 overflow-hidden">
            <div className="absolute inset-0">
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
                            loop={false}
                            playsInline
                            // @ts-ignore - webkit-playsinline is needed for older iOS Safari
                            webkit-playsinline="true"
                            // @ts-ignore - x-webkit-airplay prevents AirPlay fullscreen
                            x-webkit-airplay="deny"
                            disablePictureInPicture
                            controls={false}
                            controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
                            onLoadedData={() => {
                              if (agentVideoRef.current) {
                                console.log('🎬 Video loaded, attempting to play:', videoSrcRaw, 'Mode:', videoMode, 'ShowClose:', showDoorCloseAnimation)
                                // CRITICAL: Only loop when explicitly in loop mode, otherwise NEVER loop
                                agentVideoRef.current.loop = (videoMode === 'loop' && !showDoorCloseAnimation)
                                // CRITICAL: Exit fullscreen if somehow entered
                                if (document.fullscreenElement === agentVideoRef.current || document.fullscreenElement) {
                                  document.exitFullscreen().catch(() => {})
                                }
                                agentVideoRef.current.play().catch((err) => {
                                  console.warn('Video autoplay failed:', err)
                                })
                              }
                            }}
                            onCanPlay={() => {
                              if (agentVideoRef.current) {
                                // CRITICAL: Only loop when explicitly in loop mode, otherwise NEVER loop
                                agentVideoRef.current.loop = (videoMode === 'loop' && !showDoorCloseAnimation)
                                // CRITICAL: Exit fullscreen if somehow entered
                                if (document.fullscreenElement === agentVideoRef.current || document.fullscreenElement) {
                                  document.exitFullscreen().catch(() => {})
                                }
                                if (showDoorCloseAnimation || videoMode === 'closing') {
                                  console.log('🎬 Video can play, forcing play for closing animation')
                                  agentVideoRef.current.loop = false // Ensure closing video doesn't loop
                                  agentVideoRef.current.play().catch((err) => {
                                    console.warn('Video force play failed:', err)
                                  })
                                }
                              }
                            }}
                            onPlay={() => {
                              if (agentVideoRef.current) {
                                // CRITICAL: Exit fullscreen immediately when video plays
                                if (document.fullscreenElement === agentVideoRef.current || document.fullscreenElement) {
                                  console.log('🚫 Fullscreen detected during play, exiting')
                                  document.exitFullscreen().catch(() => {
                                    if ((document as any).webkitExitFullscreen) {
                                      (document as any).webkitExitFullscreen().catch(() => {})
                                    }
                                  })
                                }
                                // CRITICAL: Only loop when explicitly in loop mode, otherwise NEVER loop
                                agentVideoRef.current.loop = (videoMode === 'loop' && !showDoorCloseAnimation)
                              }
                            }}
                            onEnded={() => {
                              if (agentVideoRef.current && (videoMode === 'closing' || showDoorCloseAnimation)) {
                                console.log('🎬 Closing video ended, stopping playback')
                                agentVideoRef.current.pause()
                                agentVideoRef.current.currentTime = agentVideoRef.current.duration
                                agentVideoRef.current.loop = false
                                // Exit fullscreen
                                if (document.fullscreenElement) {
                                  document.exitFullscreen().catch(() => {})
                                }
                              }
                            }}
                            onError={(e) => {
                              console.error('❌ Video failed to load:', videoSrcRaw, 'Encoded:', videoSrc)
                              e.stopPropagation()
                              // Exit fullscreen on error
                              if (document.fullscreenElement) {
                                document.exitFullscreen().catch(() => {})
                              }
                            }}
                            onDoubleClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              // Prevent fullscreen on double-click
                              if (document.fullscreenElement) {
                                document.exitFullscreen().catch(() => {
                                  if ((document as any).webkitExitFullscreen) {
                                    (document as any).webkitExitFullscreen().catch(() => {})
                                  }
                                })
                              }
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault()
                              // Exit fullscreen on context menu
                              if (document.fullscreenElement) {
                                document.exitFullscreen().catch(() => {})
                              }
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
                    
                    
                    {/* Session progress bar */}
                    {sessionActive && (
                      <div className="hidden sm:block absolute bottom-0 left-0 right-0 h-1 bg-slate-900/80 z-10">
                        <div 
                          className="h-full bg-slate-600 transition-all duration-1000"
                          style={{ width: `${Math.min((duration / 600) * 100, 100)}%` }}
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
                  
                  {/* Knock Button Overlay - Mobile */}
                  {!sessionActive && !loading && selectedAgent && !showDoorOpeningVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => startSession()}
                        className="relative px-6 sm:px-8 py-4 sm:py-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-space font-bold text-base sm:text-lg rounded-2xl sm:rounded-3xl shadow-xl shadow-purple-500/25 transition-all min-h-[48px] sm:min-h-[56px] touch-manipulation z-20 overflow-hidden group"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          <span>Knock on {selectedAgent.name}'s Door</span>
                        </span>
                      </motion.button>
                    </div>
                  )}
                  
                  {/* PIP Webcam Overlay - Bottom Right (above controls) - Mobile optimized */}
                  {/* Keep component rendered for ref access, but hide when camera is off */}
                  {sessionActive && (
                    <div className={cn(
                      "absolute bottom-20 sm:bottom-24 lg:bottom-32 right-2 sm:right-3 lg:right-6 z-20 w-24 h-18 sm:w-32 sm:h-24 lg:w-[211px] lg:h-[158px] shadow-2xl rounded-md sm:rounded-lg overflow-hidden transition-opacity duration-200",
                      isCameraOff && "hidden"
                    )}>
                      <WebcamPIP ref={webcamPIPRef} />
                    </div>
                  )}
                  
                  {/* Reconnection Status Banner */}
                  {sessionActive && reconnectingStatus?.isReconnecting && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-slate-800/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.5)] border border-slate-600/80">
                      <div className="flex items-center gap-2 text-slate-200 text-sm font-medium">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent" />
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
                      onRestartSession={restartSession}
                      isMuted={isMuted}
                      isCameraOff={isCameraOff}
                      personaName={selectedAgent?.name}
                    />
                  )}
                </div>
              )}
            </div>
            </div>
          </div>

          {/* Mobile Bottom Section - Scrollable Metrics/Transcript/Feedback */}
          <div 
            className="flex-1 overflow-y-auto bg-black will-change-scroll"
            style={{ 
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 6rem)',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4">
              {/* Mobile Metrics Panel */}
              {sessionActive && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white/[0.03] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl border border-white/10 backdrop-blur-sm"
                >
                  <LiveMetricsPanel 
                    metrics={metrics} 
                    getVoiceAnalysisData={getVoiceAnalysisData}
                    transcript={transcript}
                    sessionId={sessionId}
                    sessionActive={sessionActive}
                    agentName={selectedAgent?.name}
                  />
                </motion.div>
              )}

              {/* Mobile Transcript */}
              {sessionActive && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-white/[0.03] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl border border-white/10 backdrop-blur-sm"
                >
                  <LiveTranscript 
                    transcript={transcript} 
                    agentName={selectedAgent?.name}
                    agentImageUrl={selectedAgent ? resolveAgentImage(selectedAgent, sessionActive) : null}
                    userAvatarUrl={userAvatarUrl}
                    sessionActive={sessionActive}
                  />
                </motion.div>
              )}

              {/* Mobile Feedback Feed */}
              {sessionActive && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="bg-white/[0.03] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl border border-white/10 backdrop-blur-sm"
                >
                  <LiveFeedbackFeed feedbackItems={feedbackItems} sessionActive={sessionActive} />
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Layout - 2x2 Grid */}
        <div className="hidden md:flex flex-1 grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-[1.15fr_0.85fr] overflow-hidden min-h-0 gap-4 sm:gap-5 p-2 sm:p-3 lg:p-8">
          {/* TOP LEFT QUADRANT - Agent Video */}
          <div className="w-full h-full flex flex-col overflow-hidden">
            {/* Webcam - Full height of quadrant */}
            <div className="relative bg-slate-900 rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.5)] border border-slate-800/50 h-[35vh] sm:h-[40vh] lg:h-full flex-shrink-0">
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
                  {/* Video container - Same as mobile */}
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
                            loop={false}
                            playsInline
                            // @ts-ignore
                            webkit-playsinline="true"
                            // @ts-ignore
                            x-webkit-airplay="deny"
                            disablePictureInPicture
                            controls={false}
                            controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
                            onLoadedData={() => {
                              if (agentVideoRef.current) {
                                agentVideoRef.current.loop = (videoMode === 'loop' && !showDoorCloseAnimation)
                                if (document.fullscreenElement === agentVideoRef.current || document.fullscreenElement) {
                                  document.exitFullscreen().catch(() => {})
                                }
                                agentVideoRef.current.play().catch((err) => {
                                  console.warn('Video autoplay failed:', err)
                                })
                              }
                            }}
                            onCanPlay={() => {
                              if (agentVideoRef.current) {
                                agentVideoRef.current.loop = (videoMode === 'loop' && !showDoorCloseAnimation)
                                if (document.fullscreenElement === agentVideoRef.current || document.fullscreenElement) {
                                  document.exitFullscreen().catch(() => {})
                                }
                                if (showDoorCloseAnimation || videoMode === 'closing') {
                                  agentVideoRef.current.loop = false
                                  agentVideoRef.current.play().catch((err) => {
                                    console.warn('Video force play failed:', err)
                                  })
                                }
                              }
                            }}
                            onPlay={() => {
                              if (agentVideoRef.current) {
                                if (document.fullscreenElement === agentVideoRef.current || document.fullscreenElement) {
                                  document.exitFullscreen().catch(() => {
                                    if ((document as any).webkitExitFullscreen) {
                                      (document as any).webkitExitFullscreen().catch(() => {})
                                    }
                                  })
                                }
                                agentVideoRef.current.loop = (videoMode === 'loop' && !showDoorCloseAnimation)
                              }
                            }}
                            onEnded={() => {
                              if (agentVideoRef.current && (videoMode === 'closing' || showDoorCloseAnimation)) {
                                agentVideoRef.current.pause()
                                agentVideoRef.current.currentTime = agentVideoRef.current.duration
                                agentVideoRef.current.loop = false
                                if (document.fullscreenElement) {
                                  document.exitFullscreen().catch(() => {})
                                }
                              }
                            }}
                            onError={(e) => {
                              console.error('❌ Video failed to load:', videoSrcRaw)
                              e.stopPropagation()
                              if (document.fullscreenElement) {
                                document.exitFullscreen().catch(() => {})
                              }
                            }}
                            onDoubleClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (document.fullscreenElement) {
                                document.exitFullscreen().catch(() => {
                                  if ((document as any).webkitExitFullscreen) {
                                    (document as any).webkitExitFullscreen().catch(() => {})
                                  }
                                })
                              }
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault()
                              if (document.fullscreenElement) {
                                document.exitFullscreen().catch(() => {})
                              }
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
                            console.error('❌ Image failed to load:', src)
                            e.stopPropagation()
                          }}
                          placeholder="blur"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                        />
                      ) : null
                    })()}
                    
                    {/* Session progress bar */}
                    {sessionActive && (
                      <div className="hidden sm:block absolute bottom-0 left-0 right-0 h-1 bg-slate-900/80 z-10">
                        <div 
                          className="h-full bg-slate-600 transition-all duration-1000"
                          style={{ width: `${Math.min((duration / 600) * 100, 100)}%` }}
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
                            console.error('❌ Door opening video failed to load:', videoPathRaw)
                            setShowDoorOpeningVideo(false)
                          }}
                        />
                      </div>
                    )
                  })()}
                  
                  {/* Knock Button Overlay */}
                  {!sessionActive && !loading && selectedAgent && !showDoorOpeningVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                      <button
                        onClick={() => startSession()}
                        className="relative px-6 sm:px-8 lg:px-10 py-4 sm:py-5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-space font-bold text-base sm:text-lg lg:text-xl rounded-lg sm:rounded-xl transition-all duration-300 active:scale-95 border border-slate-700/80 hover:border-slate-600 min-h-[48px] sm:min-h-[56px] touch-manipulation z-20 overflow-hidden group shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <span className="hidden sm:inline">
                            Knock on <span className="text-white">{selectedAgent.name}'s</span> Door
                          </span>
                          <span className="sm:hidden text-sm">Knock</span>
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-500" />
                      </button>
                    </div>
                  )}
                  
                  {/* PIP Webcam Overlay */}
                  {sessionActive && (
                    <div className={cn(
                      "absolute bottom-20 sm:bottom-24 lg:bottom-32 right-2 sm:right-3 lg:right-6 z-20 w-24 h-18 sm:w-32 sm:h-24 lg:w-[211px] lg:h-[158px] shadow-2xl rounded-md sm:rounded-lg overflow-hidden transition-opacity duration-200",
                      isCameraOff && "hidden"
                    )}>
                      <WebcamPIP ref={webcamPIPRef} />
                    </div>
                  )}
                  
                  {/* Reconnection Status Banner */}
                  {sessionActive && reconnectingStatus?.isReconnecting && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-slate-800/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.5)] border border-slate-600/80">
                      <div className="flex items-center gap-2 text-slate-200 text-sm font-medium">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent" />
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
                      onRestartSession={restartSession}
                      isMuted={isMuted}
                      isCameraOff={isCameraOff}
                      personaName={selectedAgent?.name}
                    />
                  )}
                </div>
              )}
            </div>
            </div>
          </div>

          {/* TOP RIGHT QUADRANT - Metrics Panel */}
          <div className="hidden md:flex w-full h-full flex flex-col overflow-hidden">
            <div className="h-full flex flex-col overflow-hidden">
              <LiveMetricsPanel 
                metrics={metrics} 
                getVoiceAnalysisData={getVoiceAnalysisData}
                transcript={transcript}
                sessionId={sessionId}
                sessionActive={sessionActive}
                agentName={selectedAgent?.name}
              />
            </div>
          </div>

          {/* BOTTOM LEFT QUADRANT - Transcript */}
          <div className="hidden md:flex w-full h-full flex-col overflow-hidden">
            <LiveTranscript 
              transcript={transcript} 
              agentName={selectedAgent?.name}
              agentImageUrl={selectedAgent ? resolveAgentImage(selectedAgent, sessionActive) : null}
              userAvatarUrl={userAvatarUrl}
              sessionActive={sessionActive}
            />
          </div>

          {/* BOTTOM RIGHT QUADRANT - Feedback Feed */}
          <div className="w-full h-full flex flex-col overflow-hidden">
            <LiveFeedbackFeed feedbackItems={feedbackItems} sessionActive={sessionActive} />
          </div>
        </div>

        {/* Mobile Bottom Navigation - Only show during active session */}
        {sessionActive && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800/50 h-[64px] flex items-center justify-around px-2 safe-area-bottom" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
            <Link
              href="/dashboard"
              className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] text-gray-400 hover:text-purple-400 transition-colors"
            >
              <Home className="w-6 h-6" />
              <span className="text-[10px] mt-0.5">Home</span>
            </Link>
            <Link
              href="/trainer/select-homeowner"
              className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] text-gray-400 hover:text-purple-400 transition-colors"
            >
              <Mic className="w-6 h-6" />
              <span className="text-[10px] mt-0.5">Practice</span>
            </Link>
            <Link
              href="/sessions"
              className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] text-gray-400 hover:text-purple-400 transition-colors"
            >
              <FileText className="w-6 h-6" />
              <span className="text-[10px] mt-0.5">Sessions</span>
            </Link>
            <Link
              href="/leaderboard"
              className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] text-gray-400 hover:text-purple-400 transition-colors"
            >
              <Trophy className="w-6 h-6" />
              <span className="text-[10px] mt-0.5">Leaderboard</span>
            </Link>
          </nav>
        )}
      </div>

      {/* Hidden ElevenLabs Component */}
      {sessionActive && conversationToken && selectedAgent?.eleven_agent_id && (
        <ElevenLabsConversation 
          agentId={selectedAgent.eleven_agent_id} 
          conversationToken={conversationToken} 
          sessionId={sessionId}
          autostart
          onAgentEndCall={handleAgentEndCall}
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
      <div className="min-h-screen bg-black flex items-center justify-center">
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
