'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Play, Pause, MessageSquare, Volume2, Sparkles } from 'lucide-react'

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
  const [audioLoading, setAudioLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Create 4 timeline segments with feedback
  const segments = [
    { 
      id: 0,
      position: 20,
      timestamp: formatTime(duration * 0.2),
      startTime: duration * 0.2,
      title: 'Opening & Rapport',
      quickTip: 'Build connection with personal touches',
      feedback: {
        good: 'Strong personal connection, used customer name, warm tone',
        improve: 'Add more local references, mirror their energy level',
        tip: 'Try mentioning something specific about their neighborhood or recent local events'
      }
    },
    { 
      id: 1,
      position: 40,
      timestamp: formatTime(duration * 0.4),
      startTime: duration * 0.4,
      title: 'Discovery Phase',
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
      startTime: duration * 0.6,
      title: 'Solution Presentation',
      quickTip: 'Focus on value, not features',
      feedback: {
        good: 'Clear explanation of services, addressed safety concerns',
        improve: 'More emphasis on unique value proposition',
        tip: 'Use social proof: "Your neighbor at 123 Main St had similar concerns..."'
      }
    },
    { 
      id: 3,
      position: 80,
      timestamp: formatTime(duration * 0.8),
      startTime: duration * 0.8,
      title: 'Closing Attempt',
      quickTip: 'Assumptive close works best',
      feedback: {
        good: 'Used assumptive language, created urgency',
        improve: 'Stronger trial close earlier in conversation',
        tip: 'Try: "Based on what you\'ve told me, it sounds like Tuesday would work best?"'
      }
    }
  ]

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const playSegment = async (segment: typeof segments[0]) => {
    if (!audioUrl || !audioRef.current) {
      console.warn('No audio URL available')
      return
    }

    try {
      setAudioLoading(true)
      
      // Set time to segment start minus 5 seconds for context
      const startTime = Math.max(0, segment.startTime - 5)
      audioRef.current.currentTime = startTime
      
      await audioRef.current.play()
      setPlayingSegment(segment.id)
      setAudioLoading(false)

      // Stop after 15-20 seconds
      setTimeout(() => {
        if (audioRef.current && playingSegment === segment.id) {
          audioRef.current.pause()
          setPlayingSegment(null)
        }
      }, 15000)

    } catch (err) {
      console.error('Audio playback failed:', err)
      setAudioLoading(false)
      setPlayingSegment(null)
    }
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setPlayingSegment(null)
    }
  }

  // Handle audio ended
  useEffect(() => {
    if (!audioRef.current) return
    
    const handleEnded = () => setPlayingSegment(null)
    const handlePause = () => setPlayingSegment(null)
    
    audioRef.current.addEventListener('ended', handleEnded)
    audioRef.current.addEventListener('pause', handlePause)
    
    return () => {
      audioRef.current?.removeEventListener('ended', handleEnded)
      audioRef.current?.removeEventListener('pause', handlePause)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Hidden audio element */}
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          preload="metadata" 
          className="hidden" 
        />
      )}

      {/* Conversation Header */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-lg font-semibold text-white">{formatTime(duration)}</span>
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
          
          {!audioUrl && (
            <div className="text-xs text-slate-500 italic flex items-center gap-2">
              <Volume2 className="w-3 h-3" />
              Audio not available for this session
            </div>
          )}
        </div>
      </div>

      {/* Timeline with Segments */}
      <div className="relative">
        {/* Progress Bar */}
        <div className="relative h-2.5 rounded-full overflow-hidden bg-slate-800/50">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500"
            style={{ width: '100%' }}
          />
        </div>
        
        {/* Segment Markers */}
        <div className="relative -mt-1.5">
          {segments.map((segment) => {
            const isPlaying = playingSegment === segment.id
            const isHovered = hoveredSegment === segment.id
            
            return (
              <div
                key={segment.id}
                className="absolute -translate-x-1/2"
                style={{ left: `${segment.position}%` }}
                onMouseEnter={() => setHoveredSegment(segment.id)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                {/* White Dot */}
                <div className={`
                  relative w-5 h-5 rounded-full bg-white 
                  border-2 border-slate-700/50 shadow-lg 
                  transition-all duration-200
                  ${isHovered ? 'scale-110' : ''}
                  ${isPlaying ? 'ring-4 ring-purple-400/50' : ''}
                `}>
                  {/* Inner dot for visual interest */}
                  <div className="absolute inset-1 rounded-full bg-slate-100" />
                </div>

                {/* Timestamp */}
                <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 text-xs font-mono text-slate-400">
                  {segment.timestamp}
                </div>

                {/* Hover Card with Play Button */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 z-50"
                    >
                      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl">
                        {/* Header with Play Button */}
                        <div className="flex items-center gap-3 p-4 border-b border-slate-700/50">
                          {/* Play/Pause Button */}
                          <button
                            onClick={() => {
                              if (isPlaying) {
                                stopAudio()
                              } else {
                                playSegment(segment)
                              }
                            }}
                            disabled={!audioUrl || audioLoading}
                            className={`
                              w-10 h-10 rounded-full flex items-center justify-center
                              transition-all duration-200
                              ${audioUrl 
                                ? 'bg-purple-500 hover:bg-purple-400 cursor-pointer' 
                                : 'bg-slate-700 cursor-not-allowed opacity-50'
                              }
                            `}
                          >
                            {audioLoading && playingSegment === segment.id ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : isPlaying ? (
                              <Pause className="w-4 h-4 text-white" />
                            ) : (
                              <Play className="w-4 h-4 text-white ml-0.5" />
                            )}
                          </button>
                          
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-white">{segment.title}</h4>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Sparkles className="w-3 h-3 text-purple-400" />
                              {segment.quickTip}
                            </p>
                          </div>
                        </div>

                        {/* Expanded Feedback (shown when playing) */}
                        <AnimatePresence>
                          {isPlaying && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 space-y-3">
                                {/* What Worked */}
                                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-green-400" />
                                    <span className="text-xs font-medium text-green-400">What Worked</span>
                                  </div>
                                  <p className="text-xs text-slate-300">{segment.feedback.good}</p>
                                </div>

                                {/* Area to Improve */}
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                                    <span className="text-xs font-medium text-amber-400">Area to Improve</span>
                                  </div>
                                  <p className="text-xs text-slate-300">{segment.feedback.improve}</p>
                                </div>

                                {/* Pro Tip */}
                                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                  <div className="flex items-center gap-2 mb-1">
                                    <MessageSquare className="w-3 h-3 text-purple-400" />
                                    <span className="text-xs font-medium text-purple-400">Pro Tip</span>
                                  </div>
                                  <p className="text-xs text-slate-300 italic">"{segment.feedback.tip}"</p>
                                </div>

                                {/* Playing Status */}
                                <div className="flex items-center gap-2 text-xs text-purple-400 pt-2">
                                  <Volume2 className="w-4 h-4 animate-pulse" />
                                  <span>Playing 15-second segment...</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Arrow */}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 
                        border-l-[6px] border-l-transparent
                        border-r-[6px] border-r-transparent
                        border-t-[6px] border-t-slate-900/95"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        {/* Time Labels */}
        <div className="flex justify-between mt-12 text-xs text-slate-500 font-mono">
          <span>0:00</span>
          <span>{formatTime(duration * 0.25)}</span>
          <span>{formatTime(duration * 0.5)}</span>
          <span>{formatTime(duration * 0.75)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}