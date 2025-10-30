'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  MessageSquare, 
  Sparkles, 
  Mic,
  Zap,
  CheckCircle2,
  XCircle
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
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null)
  const [activeSegment, setActiveSegment] = useState<number | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Use AI-generated timeline moments
  const segments: TimelineSegment[] = events && events.length > 0 ? events.slice(0, 3).map((event: any, index: number) => {
    const eventTime = typeof event.timestamp === 'string' ? parseTimestamp(event.timestamp) : (event.timestamp || 0)
    // Calculate actual position based on timestamp
    const actualPosition = duration > 0 ? (eventTime / duration) * 100 : [25, 50, 75][index]
    const fixedPositions = [25, 50, 75]
    const position = actualPosition > 0 && actualPosition <= 100 ? actualPosition : fixedPositions[index] || 50
    
    return {
      id: index,
      position: Math.max(5, Math.min(95, position)), // Clamp between 5% and 95%
      timestamp: event.timestamp || formatTime(eventTime),
      startTime: Math.max(0, eventTime - 2.5),
      endTime: Math.min(duration, eventTime + 2.5),
      title: event.moment_type || event.title || 'Key Moment',
      type: (event.moment_type || 'opening').toLowerCase().includes('rapport') ? 'opening' :
            (event.moment_type || 'discovery').toLowerCase().includes('discovery') ? 'discovery' :
            (event.moment_type || 'closing').toLowerCase().includes('clos') ? 'closing' : 'presentation',
      intensity: event.is_positive ? 'high' : 'medium',
      icon: (event.moment_type || '').toLowerCase().includes('rapport') ? MessageSquare :
            (event.moment_type || '').toLowerCase().includes('discovery') ? Mic :
            (event.moment_type || '').toLowerCase().includes('clos') ? Zap : Sparkles,
      color: event.is_positive 
        ? 'from-emerald-400 via-green-400 to-emerald-600' 
        : (event.moment_type || '').toLowerCase().includes('rapport')
          ? 'from-purple-400 via-pink-400 to-purple-600'
          : (event.moment_type || '').toLowerCase().includes('discovery')
          ? 'from-blue-400 via-cyan-400 to-blue-600'
          : (event.moment_type || '').toLowerCase().includes('clos')
          ? 'from-orange-400 via-red-400 to-orange-600'
          : 'from-indigo-400 via-purple-400 to-indigo-600',
      quickTip: event.key_takeaway || event.description || 'Key moment',
      feedback: {
        good: event.key_takeaway || event.description || '',
        improve: '',
        tip: event.key_takeaway || event.description || ''
      }
    }
  }) : []
  
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

  // Helper to convert gradient string to rgba colors
  function getColorFromGradient(gradient: string, opacity: number): string {
    // Map gradient classes to actual colors
    if (gradient.includes('emerald')) return `rgba(16, 185, 129, ${opacity}), rgba(34, 197, 94, ${opacity})`
    if (gradient.includes('purple') && gradient.includes('pink')) return `rgba(192, 132, 252, ${opacity}), rgba(236, 72, 153, ${opacity}), rgba(147, 51, 234, ${opacity})`
    if (gradient.includes('blue') && gradient.includes('cyan')) return `rgba(96, 165, 250, ${opacity}), rgba(34, 211, 238, ${opacity}), rgba(37, 99, 235, ${opacity})`
    if (gradient.includes('orange') && gradient.includes('red')) return `rgba(251, 146, 60, ${opacity}), rgba(239, 68, 68, ${opacity}), rgba(249, 115, 22, ${opacity})`
    if (gradient.includes('indigo') && gradient.includes('purple')) return `rgba(129, 140, 248, ${opacity}), rgba(168, 85, 247, ${opacity}), rgba(99, 102, 241, ${opacity})`
    return `rgba(168, 85, 247, ${opacity}), rgba(99, 102, 241, ${opacity})` // Default purple
  }

  // Calculate minutes and seconds for display
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <div className="relative mb-16">
      {/* Header Card - Redesigned */}
      <div className="mb-8 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6" style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left: Session Info */}
          <div className="flex items-start gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
                <Clock className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white tabular-nums">{formattedDuration}</span>
                  <span className="text-sm text-white/50">duration</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-white/60">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                    <span>{customerName}</span>
                  </div>
                  <div className="w-px h-4 bg-white/10"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span>{salesRepName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right: Outcome Badge */}
          <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 ${
            dealOutcome?.closed 
              ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-emerald-500/50 text-emerald-300' 
              : 'bg-gradient-to-br from-slate-700/20 to-slate-600/20 border-slate-600/50 text-slate-400'
          }`}>
            {dealOutcome?.closed ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <div>
                  <div className="text-sm font-semibold">Closed</div>
                  <div className="text-xs opacity-80">${dealOutcome.amount.toLocaleString()}</div>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5" />
                <div className="text-sm font-semibold">Not Closed</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Timeline - Redesigned */}
      <div className="relative" ref={timelineRef}>
        {/* Progress Bar Background - Static gradient with smooth fade-in */}
        <div className="relative h-3 rounded-full bg-[#1a1a1a] border-2 border-purple-500/30 overflow-hidden shadow-lg">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-purple-500/40 via-blue-500/40 to-emerald-500/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeIn" }}
          />
        </div>
        
        {/* Key Moments */}
        {segments.map((segment, index) => {
          const Icon = segment.icon
          const isHovered = hoveredSegment === segment.id
          const isActive = activeSegment === segment.id
          
          return (
            <div
              key={segment.id}
              className="absolute top-0"
              style={{ left: `${segment.position}%` }}
              onMouseEnter={() => setHoveredSegment(segment.id)}
              onMouseLeave={() => setHoveredSegment(null)}
              onClick={() => setActiveSegment(activeSegment === segment.id ? null : segment.id)}
            >
              {/* Sparkle Icon - Always visible, perfectly centered on timeline bar */}
              {/* Timeline bar is h-3 (12px), center at 6px. Icon is 24px, so center it at 6px */}
              <motion.div
                className={`absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer z-50 ${
                  isHovered || isActive
                    ? 'bg-white border-white'
                    : 'bg-[#1a1a1a] border-purple-400/60'
                }`}
                style={{
                  top: '6px', // Center of h-3 bar (12px / 2 = 6px)
                  transform: 'translateX(-50%) translateY(-50%)' // Center the icon on this point
                }}
                animate={{
                  scale: isHovered || isActive ? 1.3 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                <Sparkles className={`w-3.5 h-3.5 ${isHovered || isActive ? 'text-purple-600' : 'text-purple-400'}`} />
              </motion.div>
              
              {/* Connection Line - Only show when feedback is visible */}
              {(isHovered || isActive) && (
                <div 
                  className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-transparent via-purple-400/40 to-transparent z-10" 
                  style={{
                    top: '6px', // Start from center of timeline bar
                    height: '8rem', // Extend upward
                  }}
                />
              )}
              
              {/* Key Moment Card - Only shown on hover or click, positioned above to not cover icon */}
              {(isHovered || isActive) && (
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 w-72 z-40 cursor-pointer"
                  style={{
                    top: 'calc(-8rem - 1rem)', // Position above connection line (8rem) with extra spacing (1rem)
                    transform: 'translateX(-50%)' // Center horizontally
                  }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div 
                    className="rounded-xl border-2 border-white/30 p-5 bg-[#0a0a0a] backdrop-blur-sm"
                    style={{
                      background: `linear-gradient(135deg, ${getColorFromGradient(segment.color, 0.15)}), rgba(10, 10, 10, 0.95)`,
                      boxShadow: 'none'
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2.5 rounded-lg bg-gradient-to-br ${segment.color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-bold text-white truncate">{segment.title}</div>
                        <div className="text-sm text-white/70 font-mono mt-1">{segment.timestamp}</div>
                      </div>
                    </div>
                    
                    {/* Key Takeaway */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="pt-4 border-t border-white/10"
                    >
                      <p className="text-sm text-white leading-relaxed font-medium">{segment.quickTip}</p>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </div>
          )
        })}
        
        {/* Time Labels */}
        <div className="mt-8 flex justify-between items-center">
          <div className="flex flex-col items-start">
            <div className="text-xs font-mono text-white/40">START</div>
            <div className="text-sm font-mono text-white/60 font-semibold mt-1">0:00</div>
          </div>
          
          {segments.map((segment, idx) => (
            <div key={idx} className="flex flex-col items-center" style={{ position: 'absolute', left: `${segment.position}%`, transform: 'translateX(-50%)', marginTop: '2rem' }}>
              <div className="text-xs font-mono text-white/40">{segment.title.toUpperCase()}</div>
              <div className="text-sm font-mono text-white/60 font-semibold mt-1">{segment.timestamp}</div>
            </div>
          ))}
          
          <div className="flex flex-col items-end">
            <div className="text-xs font-mono text-white/40">END</div>
            <div className="text-sm font-mono text-white/60 font-semibold mt-1">{formatTime(duration)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
