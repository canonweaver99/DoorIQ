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
    if (!seconds || isNaN(seconds)) return '0:00'
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
    audioControls.seek(audioState.currentTime - 10)
  }, [audioState.currentTime, audioControls])

  // Seek forward 10 seconds
  const seekForward = useCallback(() => {
    audioControls.seek(audioState.currentTime + 10)
  }, [audioState.currentTime, audioControls])

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

  const progress = audioState.duration > 0 
    ? (audioState.currentTime / audioState.duration) * 100 
    : 0

  return (
    <div className="rounded-xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6">
      <div className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
            <span className="font-mono">{formatTime(audioState.currentTime)}</span>
            <span className="font-mono">{formatTime(audioState.duration || providedDuration || 0)}</span>
          </div>
          
          <div 
            className="relative h-2 bg-slate-700/50 rounded-full cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const percentage = x / rect.width
              audioControls.seek(percentage * audioState.duration)
            }}
          >
            <motion.div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
            
            {/* Hover indicator */}
            <div className="absolute inset-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div 
                className="h-4 w-4 bg-white rounded-full shadow-lg"
                style={{ marginLeft: `${progress}%`, transform: 'translateX(-50%)' }}
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={seekBackward}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Rewind 10s"
            >
              <SkipBack className="w-5 h-5" />
            </button>

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

            <button
              onClick={seekForward}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Forward 10s"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Speed Control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Speed:</span>
            <div className="flex gap-1">
              {speeds.map(speed => (
                <button
                  key={speed}
                  onClick={() => audioControls.setSpeed(speed)}
                  className={`
                    px-2 py-1 rounded text-xs font-medium transition-colors
                    ${audioState.playbackRate === speed 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }
                  `}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              {audioState.volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="100"
              value={audioState.volume}
              onChange={(e) => audioControls.setVolume(Number(e.target.value))}
              className="w-24 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500
                [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:border-0"
            />
          </div>
        </div>

        {/* Current Segment Indicator */}
        {currentSegment >= 0 && transcript[currentSegment] && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-xs text-purple-400 font-medium">
                Current Segment • {transcript[currentSegment].timestamp}
              </span>
            </div>
            <p className="text-sm text-slate-300">
              <strong className="text-white">{transcript[currentSegment].speaker}:</strong>{' '}
              {transcript[currentSegment].text}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
