'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  Play, 
  Pause, 
  MessageSquare, 
  Volume2, 
  Sparkles, 
  ChevronRight,
  Mic,
  Activity,
  SkipForward,
  Rewind,
  Zap
} from 'lucide-react'

interface SessionTimelineProps {
  duration: number // in seconds
  events: any[]
  lineRatings?: any[]
  fullTranscript?: Array<{ speaker: string, text: string, timestamp?: string }>
  customerName?: string
  salesRepName?: string
  dealOutcome?: {
    closed: boolean
    amount: number
    product: string
  }
  audioUrl?: string
}

interface TimelineSegment {
  id: number
  position: number
  timestamp: string
  startTime: number
  endTime: number
  title: string
  type: 'opening' | 'discovery' | 'presentation' | 'closing'
  intensity: 'low' | 'medium' | 'high'
  quickTip: string
  icon: any
  color: string
  feedback: {
    good: string
    improve: string
    tip: string
  }
}

export default function SessionTimeline({ 
  duration, 
  fullTranscript = [],
  customerName = 'Customer',
  salesRepName = 'Sales Rep',
  dealOutcome,
  audioUrl
}: SessionTimelineProps) {
  const [playingSegment, setPlayingSegment] = useState<number | null>(null)
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null)
  const [activeSegment, setActiveSegment] = useState<number | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Create timeline segments with enhanced design
  const segments: TimelineSegment[] = [
    { 
      id: 0,
      position: 15,
      timestamp: formatTime(duration * 0.15),
      startTime: 0,
      endTime: duration * 0.3,
      title: 'Opening & Rapport',
      type: 'opening',
      intensity: 'medium',
      icon: MessageSquare,
      color: 'from-blue-500 to-cyan-500',
      quickTip: 'Build connection with personal touches',
      feedback: {
        good: 'Strong personal connection, used customer name, warm tone',
        improve: 'Add more local references, mirror their energy level',
        tip: 'Try mentioning something specific about their neighborhood or recent local events'
      }
    },
    { 
      id: 1,
      position: 35,
      timestamp: formatTime(duration * 0.35),
      startTime: duration * 0.3,
      endTime: duration * 0.5,
      title: 'Discovery Phase',
      type: 'discovery',
      intensity: 'high',
      icon: Mic,
      color: 'from-purple-500 to-pink-500',
      quickTip: 'Ask open-ended questions',
      feedback: {
        good: 'Asked open-ended questions, listened actively',
        improve: 'Dig deeper into their specific concerns about pests',
        tip: 'Use phrases like "Tell me more about..." to encourage elaboration'
      }
    },
    { 
      id: 2,
      position: 60,
      timestamp: formatTime(duration * 0.6),
      startTime: duration * 0.5,
      endTime: duration * 0.75,
      title: 'Solution Presentation',
      type: 'presentation',
      intensity: 'high',
      icon: Sparkles,
      color: 'from-amber-500 to-orange-500',
      quickTip: 'Focus on value, not features',
      feedback: {
        good: 'Clear explanation of services, addressed safety concerns',
        improve: 'More emphasis on unique value proposition',
        tip: 'Use social proof: "Your neighbor at 123 Main St had similar concerns..."'
      }
    },
    { 
      id: 3,
      position: 85,
      timestamp: formatTime(duration * 0.85),
      startTime: duration * 0.75,
      endTime: duration,
      title: 'Closing & Next Steps',
      type: 'closing',
      intensity: dealOutcome?.closed ? 'high' : 'low',
      icon: Zap,
      color: dealOutcome?.closed ? 'from-green-500 to-emerald-500' : 'from-red-500 to-rose-500',
      quickTip: 'Be direct but not pushy',
      feedback: {
        good: 'Clear call to action, handled objections well',
        improve: 'Create more urgency without being aggressive',
        tip: 'Offer a limited-time incentive: "If we can schedule this week..."'
      }
    }
  ]

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const playSegment = async (segment: TimelineSegment) => {
    if (!audioUrl || !audioRef.current) {
      console.warn('No audio URL available')
      return
    }

    try {
      setAudioLoading(true)
      
      if (audioRef.current.src !== audioUrl) {
        audioRef.current.src = audioUrl
      }

      await audioRef.current.load()
      
      audioRef.current.currentTime = segment.startTime
      
      await audioRef.current.play()
      setIsPlaying(true)
      setPlayingSegment(segment.id)
      setActiveSegment(segment.id)
      
    } catch (error) {
      console.error('Failed to play audio:', error)
    } finally {
      setAudioLoading(false)
    }
  }

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const seekToTime = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }

  // Update progress and check segment boundaries
  useEffect(() => {
    if (!audioRef.current) return

    const updateProgress = () => {
      const current = audioRef.current?.currentTime || 0
      const total = audioRef.current?.duration || duration
      setCurrentTime(current)
      setProgress((current / total) * 100)

      // Check if we've passed the end of the current segment
      if (playingSegment !== null) {
        const segment = segments[playingSegment]
        if (current >= segment.endTime) {
          audioRef.current?.pause()
          setIsPlaying(false)
          setPlayingSegment(null)
        }
      }
    }

    audioRef.current.addEventListener('timeupdate', updateProgress)
    audioRef.current.addEventListener('ended', () => {
      setIsPlaying(false)
      setPlayingSegment(null)
    })

    return () => {
      audioRef.current?.removeEventListener('timeupdate', updateProgress)
      audioRef.current?.removeEventListener('ended', () => {
        setIsPlaying(false)
        setPlayingSegment(null)
      })
    }
  }, [playingSegment, duration])

  const getSegmentStyle = (segment: TimelineSegment) => {
    const isActive = activeSegment === segment.id
    const isHovered = hoveredSegment === segment.id
    const isPlaying = playingSegment === segment.id

    return {
      base: isActive || isHovered ? 'scale-110' : 'scale-100',
      glow: isPlaying ? 'ring-4 ring-white/30' : '',
      intensity: {
        low: 'opacity-60',
        medium: 'opacity-80',
        high: 'opacity-100'
      }[segment.intensity]
    }
  }

  return (
    <div className="relative py-8">
      {/* Conversation Summary Card */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between">
          {/* Left side: Duration and participants */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <Clock className="w-5 h-5 text-slate-400" />
              <span className="text-2xl font-semibold text-white">{formatTime(duration)}</span>
              <span className="text-sm text-slate-400">conversation</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-slate-500">Customer: </span>
                <span className="text-white font-medium">{customerName}</span>
              </div>
              <div className="w-px h-4 bg-slate-700"></div>
              <div>
                <span className="text-slate-500">Sales Rep: </span>
                <span className="text-white font-medium">{salesRepName}</span>
              </div>
            </div>
          </div>
          
          {/* Right side: Deal outcome badge */}
          {dealOutcome && (
            <div className={`
              px-6 py-3 rounded-xl font-semibold text-lg
              ${dealOutcome.closed 
                ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-green-400 border-2 border-green-500/50 shadow-lg shadow-green-500/20' 
                : 'bg-gradient-to-br from-slate-700/20 to-slate-600/20 text-slate-400 border-2 border-slate-600/50'
              }
            `}>
              {dealOutcome.closed 
                ? `✓ Closed: $${dealOutcome.amount.toLocaleString()}`
                : 'Not Closed'
              }
            </div>
          )}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          
          {/* Overall Controls */}
          {audioUrl && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => seekToTime(Math.max(0, currentTime - 10))}
                className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
              >
                <Rewind className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => isPlaying ? pauseAudio() : audioRef.current?.play()}
                className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-slate-400" />
                ) : (
                  <Play className="w-4 h-4 text-slate-400" />
                )}
              </button>
              <button
                onClick={() => seekToTime(Math.min(duration, currentTime + 10))}
                className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
              >
                <SkipForward className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          )}
        </div>

        {/* Current time indicator */}
        {isPlaying && (
          <div className="text-xs font-mono text-slate-500 text-center">
            Playing: {formatTime(currentTime)}
          </div>
        )}
      </div>

      {/* Enhanced Timeline */}
      <div className="relative" ref={timelineRef}>
        {/* Background Track */}
        <div className="relative h-24 rounded-2xl overflow-hidden bg-slate-900/50 border border-slate-800/50">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-red-500/10" />
          
          {/* Progress Bar */}
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-red-500/20 backdrop-blur-sm transition-all duration-300"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 animate-pulse" />
          </div>

          {/* Waveform Visualization (Decorative) */}
          <div className="absolute inset-0 flex items-center justify-around opacity-20">
            {Array.from({ length: 50 }, (_, i) => (
              <div
                key={i}
                className="w-1 bg-slate-400 rounded-full transition-all duration-300"
                style={{
                  height: `${20 + Math.random() * 60}%`,
                  opacity: progress > (i / 50) * 100 ? 0.8 : 0.3
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Segment Pills */}
        <div className="absolute inset-0">
          {segments.map((segment) => {
            const style = getSegmentStyle(segment)
            const Icon = segment.icon
            
            return (
              <motion.div
                key={segment.id}
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${segment.position}%` }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: segment.id * 0.1 }}
              >
                <div
                  className="relative -translate-x-1/2 cursor-pointer"
                  onMouseEnter={() => setHoveredSegment(segment.id)}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                  {/* Pill Marker */}
                  <motion.div
                    className={`
                      relative px-4 py-2 rounded-full
                      bg-gradient-to-r ${segment.color}
                      ${style.intensity} ${style.glow}
                      shadow-lg backdrop-blur-sm
                      transition-all duration-300
                      ${style.base}
                    `}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => playSegment(segment)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-white" />
                      <span className="text-xs font-medium text-white whitespace-nowrap">
                        {segment.title}
                      </span>
                      {playingSegment === segment.id && (
                        <Activity className="w-3 h-3 text-white animate-pulse" />
                      )}
                    </div>
                  </motion.div>

                  {/* Timestamp */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-mono text-slate-500">
                    {segment.timestamp}
                  </div>

                  {/* Hover Playback Card */}
                  <AnimatePresence>
                    {hoveredSegment === segment.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-80 z-50"
                      >
                        <div className="relative rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl overflow-hidden">
                          {/* Gradient Border */}
                          <div className={`absolute inset-0 bg-gradient-to-r ${segment.color} opacity-20`} />
                          
                          <div className="relative p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl bg-gradient-to-r ${segment.color}`}>
                                  <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-white">{segment.title}</h4>
                                  <p className="text-xs text-slate-400">{segment.quickTip}</p>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (audioUrl) {
                                    playSegment(segment)
                                  }
                                }}
                                disabled={audioLoading || !audioUrl}
                                className={`
                                  p-3 rounded-xl transition-all
                                  ${!audioUrl ? 'opacity-30 cursor-not-allowed' : ''}
                                  ${playingSegment === segment.id
                                    ? 'bg-red-500/20 hover:bg-red-500/30' 
                                    : 'bg-white/10 hover:bg-white/20'
                                  }
                                  ${audioLoading ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                                title={!audioUrl ? 'Audio not available for this session' : ''}
                              >
                                {audioLoading ? (
                                  <div className="w-5 h-5 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
                                ) : playingSegment === segment.id ? (
                                  <Pause className="w-5 h-5 text-white" />
                                ) : (
                                  <Play className="w-5 h-5 text-white" />
                                )}
                              </button>
                            </div>

                            {/* Feedback */}
                            <div className="space-y-3">
                              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                                <div className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5" />
                                  <div>
                                    <p className="text-xs font-medium text-green-400 mb-1">What worked well</p>
                                    <p className="text-xs text-slate-300">{segment.feedback.good}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <div className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5" />
                                  <div>
                                    <p className="text-xs font-medium text-amber-400 mb-1">Area to improve</p>
                                    <p className="text-xs text-slate-300">{segment.feedback.improve}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                <div className="flex items-start gap-2">
                                  <Sparkles className="w-4 h-4 text-purple-400 mt-0.5" />
                                  <div>
                                    <p className="text-xs font-medium text-purple-400 mb-1">Pro tip</p>
                                    <p className="text-xs text-slate-300">{segment.feedback.tip}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Playback Controls */}
                            <div className="mt-4 pt-4 border-t border-slate-700/50">
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>Duration: {formatTime(segment.endTime - segment.startTime)}</span>
                                <span>{segment.timestamp} - {formatTime(segment.endTime)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Time markers */}
        <div className="absolute -bottom-8 left-0 right-0 flex justify-between text-xs font-mono text-slate-500">
          <span>0:00</span>
          <span>{formatTime(duration / 2)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Hidden Audio Element */}
      {audioUrl && (
        <audio 
          ref={audioRef} 
          preload="metadata"
          onLoadStart={() => setAudioLoading(true)}
          onLoadedData={() => setAudioLoading(false)}
        />
      )}
    </div>
  )
}