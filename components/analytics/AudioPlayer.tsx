'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useAudioPlayer, useAudioKeyboardShortcuts, fetchAudioUrl } from '@/hooks/useAudioPlayer'

interface AudioPlayerProps {
  audioUrl?: string
  sessionId?: string
  duration?: number
  transcript?: Array<{ speaker: string; text: string; timestamp?: string }>
  onSegmentChange?: (index: number) => void
}

export default function AudioPlayer({ 
  audioUrl, 
  sessionId,
  duration: providedDuration,
  transcript = [],
  onSegmentChange 
}: AudioPlayerProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)
  
  const [audioState, audioControls] = useAudioPlayer({
    sessionId,
    autoSavePosition: true,
    onSegmentChange
  })

  // Fetch or resolve audio URL
  useEffect(() => {
    async function loadAudio() {
      if (audioUrl) {
        // Direct URL provided
        setResolvedUrl(audioUrl)
        await audioControls.loadAudio(audioUrl)
      } else if (sessionId) {
        // Fetch from Supabase
        try {
          const url = await fetchAudioUrl(sessionId)
          if (url) {
            setResolvedUrl(url)
            await audioControls.loadAudio(url)
          } else {
            setUrlError('Audio file not found')
          }
        } catch (error) {
          console.error('Failed to load audio:', error)
          setUrlError('Failed to load audio file')
        }
      }
    }

    loadAudio()
  }, [audioUrl, sessionId])

  // Format time as M:SS
  const formatTime = useCallback((seconds: number): string => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Handle play/pause toggle
  const togglePlayPause = useCallback(() => {
    if (audioState.isPlaying) {
      audioControls.pause()
    } else {
      audioControls.play()
    }
  }, [audioState.isPlaying, audioControls])

  // Seek backward 10 seconds
  const seekBackward = useCallback(() => {
    const newTime = Math.max(0, audioState.currentTime - 10)
    if (isFinite(newTime)) {
      audioControls.seek(newTime)
    }
  }, [audioState.currentTime, audioControls])

  // Seek forward 10 seconds
  const seekForward = useCallback(() => {
    const newTime = Math.min(audioState.duration || 0, audioState.currentTime + 10)
    if (isFinite(newTime)) {
      audioControls.seek(newTime)
    }
  }, [audioState.currentTime, audioState.duration, audioControls])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (audioState.volume === 0) {
      audioControls.setVolume(80)
    } else {
      audioControls.setVolume(0)
    }
  }, [audioState.volume, audioControls])

  // Keyboard shortcuts
  useAudioKeyboardShortcuts(
    audioState.isPlaying,
    togglePlayPause,
    seekBackward,
    seekForward,
    false
  )

  // Available playback speeds
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]

  // Get current segment
  const currentSegment = audioControls.getCurrentSegment(
    transcript.filter(t => t.timestamp).map(t => ({ 
      timestamp: t.timestamp!, 
      text: t.text 
    }))
  )

  // Error state
  if (urlError || audioState.error) {
    return (
      <div className="rounded-xl bg-slate-900/50 border border-red-500/20 p-6">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-medium">Audio Unavailable</p>
            <p className="text-sm text-slate-400 mt-1">
              {urlError || audioState.error || 'Failed to load audio file'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (audioState.isLoading || !resolvedUrl) {
    return (
      <div className="rounded-xl bg-slate-900/50 border border-slate-700/50 p-6">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p>Loading audio...</p>
        </div>
      </div>
    )
  }

  const progress = audioState.duration > 0 && isFinite(audioState.duration)
    ? (audioState.currentTime / audioState.duration) * 100 
    : 0

  return (
    <div className="rounded-xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-4">
      <div className="space-y-3">
        {/* Time Display */}
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span className="font-mono">{formatTime(audioState.currentTime)}</span>
          <span className="font-mono">{formatTime(audioState.duration || providedDuration || 0)}</span>
        </div>
        
        {/* Progress Bar */}
        <div 
          className="relative h-2 bg-slate-700/50 rounded-full cursor-pointer group"
          onClick={(e) => {
            if (!audioState.duration || audioState.duration <= 0) return
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            const percentage = x / rect.width
            const seekTime = percentage * audioState.duration
            if (isFinite(seekTime)) {
              audioControls.seek(seekTime)
            }
          }}
        >
          <motion.div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
          
          {/* Scrubber */}
          <div className="absolute inset-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div 
              className="h-4 w-4 bg-white rounded-full shadow-lg"
              style={{ marginLeft: `${progress}%`, transform: 'translateX(-50%)' }}
            />
          </div>
        </div>

        {/* Simple Controls - Play/Pause only */}
        <div className="flex items-center justify-center">
          <button
            onClick={togglePlayPause}
            className="p-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors"
            title={audioState.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {audioState.isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
