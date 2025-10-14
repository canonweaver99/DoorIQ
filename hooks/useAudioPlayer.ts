import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface AudioState {
  isPlaying: boolean
  isPaused: boolean
  isStopped: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  volume: number
  playbackRate: number
  error: string | null
}

export interface AudioControls {
  play: () => Promise<void>
  pause: () => void
  stop: () => void
  seek: (time: number) => void
  setSpeed: (rate: number) => void
  setVolume: (volume: number) => void
  loadAudio: (url: string) => Promise<void>
  getCurrentSegment: (segments: Array<{ timestamp: string; text: string }>) => number
  seekToSegment: (segments: Array<{ timestamp: string; text: string }>, index: number) => void
}

interface UseAudioPlayerOptions {
  sessionId?: string
  autoSavePosition?: boolean
  onTimeUpdate?: (time: number) => void
  onSegmentChange?: (segmentIndex: number) => void
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}): [AudioState, AudioControls] {
  const { sessionId, autoSavePosition = true, onTimeUpdate, onSegmentChange } = options
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timeUpdateRef = useRef<NodeJS.Timeout | null>(null)
  const lastSegmentRef = useRef<number>(-1)
  
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    isPaused: false,
    isStopped: true,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 80,
    playbackRate: 1,
    error: null
  })

  // Parse timestamp to seconds
  const parseTimestamp = useCallback((timestamp: string): number => {
    const parts = timestamp.split(':').map(Number)
    if (parts.length === 2) {
      const [mins, secs] = parts
      return (mins * 60) + secs
    }
    return 0
  }, [])

  // Save playback position to localStorage
  const savePosition = useCallback((time: number) => {
    if (sessionId && autoSavePosition) {
      localStorage.setItem(`audio-position-${sessionId}`, time.toString())
    }
  }, [sessionId, autoSavePosition])

  // Load saved position from localStorage
  const loadSavedPosition = useCallback((): number => {
    if (sessionId && autoSavePosition) {
      const saved = localStorage.getItem(`audio-position-${sessionId}`)
      return saved ? parseFloat(saved) : 0
    }
    return 0
  }, [sessionId, autoSavePosition])

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.preload = 'metadata'
      
      // Set initial volume
      audioRef.current.volume = state.volume / 100
    }

    const audio = audioRef.current

    // Event handlers
    const handleLoadedMetadata = () => {
      setState(prev => ({ 
        ...prev, 
        duration: audio?.duration || 0,
        isLoading: false 
      }))
      
      // Restore saved position
      const savedPosition = loadSavedPosition()
      if (savedPosition > 0 && audio) {
        audio.currentTime = savedPosition
      }
    }

    const handleError = (e: Event) => {
      console.error('Audio error:', e)
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load audio',
        isLoading: false,
        isPlaying: false
      }))
    }

    const handleEnded = () => {
      setState(prev => ({ 
        ...prev, 
        isPlaying: false,
        isPaused: false,
        isStopped: true 
      }))
      savePosition(0)
    }

    const handlePause = () => {
      if (audio && !audio.ended) {
        setState(prev => ({ 
          ...prev, 
          isPlaying: false,
          isPaused: true,
          isStopped: false 
        }))
      }
    }

    const handlePlay = () => {
      setState(prev => ({ 
        ...prev, 
        isPlaying: true,
        isPaused: false,
        isStopped: false 
      }))
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('error', handleError)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('play', handlePlay)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('play', handlePlay)
    }
  }, [loadSavedPosition, savePosition])

  // Time update loop (debounced to 100ms)
  useEffect(() => {
    if (state.isPlaying && audioRef.current) {
      timeUpdateRef.current = setInterval(() => {
        if (audioRef.current) {
          const currentTime = audioRef.current.currentTime
          setState(prev => ({ ...prev, currentTime }))
          savePosition(currentTime)
          onTimeUpdate?.(currentTime)
        }
      }, 100)
    } else {
      if (timeUpdateRef.current) {
        clearInterval(timeUpdateRef.current)
        timeUpdateRef.current = null
      }
    }

    return () => {
      if (timeUpdateRef.current) {
        clearInterval(timeUpdateRef.current)
      }
    }
  }, [state.isPlaying, savePosition, onTimeUpdate])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
      if (timeUpdateRef.current) {
        clearInterval(timeUpdateRef.current)
      }
    }
  }, [])

  // Load audio from URL
  const loadAudio = useCallback(async (url: string) => {
    if (!audioRef.current) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      audioRef.current.src = url
      await audioRef.current.load()
    } catch (error) {
      console.error('Failed to load audio:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load audio file',
        isLoading: false 
      }))
    }
  }, [])

  // Play
  const play = useCallback(async () => {
    if (!audioRef.current) return

    try {
      await audioRef.current.play()
    } catch (error) {
      console.error('Playback failed:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Playback failed',
        isPlaying: false 
      }))
    }
  }, [])

  // Pause
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }, [])

  // Stop
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setState(prev => ({ 
        ...prev, 
        currentTime: 0,
        isPlaying: false,
        isPaused: false,
        isStopped: true 
      }))
      savePosition(0)
    }
  }, [savePosition])

  // Seek
  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(time, state.duration))
      setState(prev => ({ ...prev, currentTime: audioRef.current!.currentTime }))
    }
  }, [state.duration])

  // Set playback speed
  const setSpeed = useCallback((rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate
      setState(prev => ({ ...prev, playbackRate: rate }))
    }
  }, [])

  // Set volume
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, volume))
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume / 100
      setState(prev => ({ ...prev, volume: clampedVolume }))
    }
  }, [])

  // Get current transcript segment
  const getCurrentSegment = useCallback((segments: Array<{ timestamp: string; text: string }>): number => {
    if (!segments.length) return -1

    const currentTime = state.currentTime
    let currentSegment = -1

    for (let i = 0; i < segments.length; i++) {
      const segmentTime = parseTimestamp(segments[i].timestamp)
      if (currentTime >= segmentTime) {
        currentSegment = i
      } else {
        break
      }
    }

    // Notify if segment changed
    if (currentSegment !== lastSegmentRef.current && currentSegment !== -1) {
      lastSegmentRef.current = currentSegment
      onSegmentChange?.(currentSegment)
    }

    return currentSegment
  }, [state.currentTime, parseTimestamp, onSegmentChange])

  // Seek to transcript segment
  const seekToSegment = useCallback((segments: Array<{ timestamp: string; text: string }>, index: number) => {
    if (index >= 0 && index < segments.length) {
      const time = parseTimestamp(segments[index].timestamp)
      seek(time)
    }
  }, [seek, parseTimestamp])

  const controls: AudioControls = {
    play,
    pause,
    stop,
    seek,
    setSpeed,
    setVolume,
    loadAudio,
    getCurrentSegment,
    seekToSegment
  }

  return [state, controls]
}

// Fetch audio URL from Supabase Storage
export async function fetchAudioUrl(sessionId: string, audioPath?: string): Promise<string | null> {
  try {
    const supabase = createClient()
    
    // If audioPath is provided, use it
    if (audioPath) {
      // Check if it's already a full URL
      if (audioPath.startsWith('http')) {
        return audioPath
      }
      
      // Otherwise, get signed URL from path
      const { data, error } = await supabase.storage
        .from('audio-recordings')
        .createSignedUrl(audioPath, 3600) // 1 hour expiry
      
      if (error) {
        console.error('Failed to create signed URL:', error)
        return null
      }
      
      return data.signedUrl
    }

    // Otherwise, fetch from session
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select('audio_url')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session?.audio_url) {
      console.error('No audio URL found for session:', sessionError)
      return null
    }

    return session.audio_url
  } catch (error) {
    console.error('Failed to fetch audio URL:', error)
    return null
  }
}

// Keyboard shortcuts hook
export function useAudioKeyboardShortcuts(
  isPlaying: boolean,
  onPlayPause: () => void,
  onSeekBackward: () => void,
  onSeekForward: () => void,
  disabled: boolean = false
) {
  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          onPlayPause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          onSeekBackward()
          break
        case 'ArrowRight':
          e.preventDefault()
          onSeekForward()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, onPlayPause, onSeekBackward, onSeekForward, disabled])
}

