'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  MessageSquare, 
  Sparkles, 
  Mic,
  Zap
} from 'lucide-react'

interface SessionTimelineProps {
  duration: number // in seconds
  events: any[]
  lineRatings?: any[]
  fullTranscript?: Array<{ speaker: string, text?: string, message?: string, timestamp?: string }>
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
  events = [],
  fullTranscript = [],
  customerName = 'Customer',
  salesRepName = 'Sales Rep',
  dealOutcome,
  audioUrl
}: SessionTimelineProps) {
  const [playingSegment, setPlayingSegment] = useState<number | null>(null)
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null)
  const [activeSegment, setActiveSegment] = useState<number | null>(null)
  // Audio playback archived – keep visual-only timeline
  const timelineRef = useRef<HTMLDivElement>(null)

  // Use AI-generated timeline moments from grading (not hardcoded)
  const segments: TimelineSegment[] = events && events.length > 0 ? events.map((event: any, index: number) => {
    const eventTime = typeof event.timestamp === 'string' ? parseTimestamp(event.timestamp) : (event.timestamp || 0)
    return {
      id: index,
      position: event.position || ((eventTime / duration) * 100),
      timestamp: event.timestamp || formatTime(eventTime),
      startTime: Math.max(0, eventTime - 2.5), // 5-second clip: 2.5s before
      endTime: Math.min(duration, eventTime + 2.5), // 2.5s after
      title: event.moment_type || event.title || 'Key Moment',
      type: (event.moment_type || 'opening').toLowerCase().includes('rapport') ? 'opening' :
            (event.moment_type || 'discovery').toLowerCase().includes('discovery') ? 'discovery' :
            (event.moment_type || 'closing').toLowerCase().includes('clos') ? 'closing' : 'presentation',
      intensity: event.is_positive ? 'high' : 'medium',
      icon: (event.moment_type || '').toLowerCase().includes('rapport') ? MessageSquare :
            (event.moment_type || '').toLowerCase().includes('discovery') ? Mic :
            (event.moment_type || '').toLowerCase().includes('clos') ? Zap : Sparkles,
      color: event.is_positive ? 'from-green-500 to-emerald-500' : 'from-blue-500 to-purple-500',
      quickTip: event.key_takeaway || event.description || 'Key moment',
      feedback: {
        good: event.key_takeaway || event.description || '',
        improve: '',
        tip: event.key_takeaway || event.description || ''
      }
    }
  }) : []
  
  // Helper to parse "M:SS" timestamp strings
  function parseTimestamp(ts: string): number {
    if (!ts || typeof ts !== 'string') return 0
    const parts = ts.split(':')
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1])
    }
    return 0
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Audio logic removed – timeline is purely visual for now

  const getSegmentStyle = (segment: TimelineSegment) => {
    const isActive = activeSegment === segment.id
    const isHovered = hoveredSegment === segment.id

    return {
      base: isActive || isHovered ? 'scale-110' : 'scale-100',
      glow: '',
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

      {/* Playback Controls removed – audio is archived */}

      {/* Enhanced Timeline */}
      <div className="relative" ref={timelineRef}>
        {/* Background Track (static) */}
        <div className="relative h-24 rounded-2xl overflow-hidden bg-slate-900/50 border border-slate-800/50">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-red-500/10" />
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
                    onClick={() => setActiveSegment(segment.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-white" />
                      <span className="text-xs font-medium text-white whitespace-nowrap">
                        {segment.title}
                      </span>
                    </div>
                  </motion.div>

                  {/* Hover Playback Card */}
                  <AnimatePresence>
                    {hoveredSegment === segment.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-80 z-50"
                      >
                        <div className="relative rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl overflow-hidden">
                          {/* Gradient Border */}
                          <div className={`absolute inset-0 bg-gradient-to-r ${segment.color} opacity-20`} />
                          
                          <div className="relative p-5">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg bg-gradient-to-r ${segment.color}`}>
                                  <Icon className="w-4 h-4 text-white" />
                                </div>
                                <h4 className="text-base font-bold text-white">{segment.title}</h4>
                              </div>
                              {/* Audio controls removed */}
                            </div>

                            {/* Key Takeaway - Simplified */}
                            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                              <div className="flex items-start gap-2">
                                <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-purple-400 mb-2">Key Takeaway</p>
                                  <p className="text-sm text-white leading-relaxed">{segment.feedback.tip}</p>
                                </div>
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
        <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs font-mono text-slate-500">
          <span>0:00</span>
          <span>{formatTime(duration / 2)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Audio element removed */}
    </div>
  )
}