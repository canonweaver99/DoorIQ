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
  
  // Calculate card positions to prevent overlap when multiple cards are open
  const getCardPosition = (index: number, segmentPosition: number) => {
    const isActive = activeSegment === index
    const isHovered = hoveredSegment === index
    if (!isActive && !isHovered) return null
    
    // Find all other currently visible cards (active or hovered)
    const visibleCards = segments
      .map((seg, idx) => ({ ...seg, idx, isVisible: idx === activeSegment || idx === hoveredSegment }))
      .filter(seg => seg.isVisible && seg.idx !== index)
    
    // Check if any visible cards are nearby (within 25% of timeline to account for card width)
    const nearbyCards = visibleCards.filter(seg => 
      Math.abs(seg.position - segmentPosition) < 25
    )
    
    // Count how many cards are to the left (we'll stack left cards lower)
    const cardsToLeft = nearbyCards.filter(seg => seg.position < segmentPosition).length
    
    // Calculate vertical offset - stack cards with generous spacing
    // Card height is ~10rem, so use 11rem spacing to prevent any overlap
    const baseOffset = 'calc(-10rem - 2rem)' // Base position (10rem connection line + 2rem spacing)
    const stackOffset = cardsToLeft * 13 // 13rem spacing per stacked card
    
    const verticalOffset = nearbyCards.length > 0
      ? `calc(-10rem - 2rem - ${stackOffset}rem)` // Stack with 13rem between cards
      : baseOffset // Normal position
    
    return {
      top: verticalOffset,
      zIndex: 40 + (isActive ? 10 : 0) + index // Active cards on top, increment by index
    }
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
              {/* Sparkle Icon - Always visible, bigger (w-12 h-12) and overlaying timeline bar */}
              {/* Timeline bar is h-3 (12px). Icon is 48px (w-12 h-12), so center it to overlay */}
              <motion.div
                className={`absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-2 flex items-center justify-center cursor-pointer z-[60] ${
                  isHovered || isActive
                    ? 'bg-white border-white shadow-lg shadow-purple-500/50'
                    : 'bg-[#1a1a1a] border-purple-400/60'
                }`}
                style={{
                  top: '0px', // Start at top of timeline container
                  transform: 'translateX(-50%) translateY(-50%)', // Center horizontally, center vertically
                  marginTop: '6px' // Position so center of icon aligns with center of timeline bar (6px = half of 12px)
                }}
                animate={{
                  scale: isHovered || isActive ? 1.15 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                <Sparkles className={`w-7 h-7 ${isHovered || isActive ? 'text-purple-600' : 'text-purple-400'}`} />
              </motion.div>
              
              {/* Connection Line - Only show when feedback is visible, extends upward to card */}
              {(isHovered || isActive) && (() => {
                const cardPos = getCardPosition(index, segment.position)
                if (!cardPos) return null
                
                // Icon center is at 6px (timeline center), icon is 48px tall, so top edge is at -18px
                // Card bottom edge is roughly at cardPos.top (negative value)
                // Line should start from top of icon (-18px) and extend to card bottom
                return (
                  <motion.div 
                    className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-t from-purple-400/60 via-purple-400/40 to-transparent z-[20]" 
                    style={{
                      top: '-18px', // Start from top edge of icon (6px center - 24px radius)
                      height: 'calc(12rem + 18px)', // Extend upward to connect with card (12rem = card height estimate + 18px to reach top)
                      transformOrigin: 'top center',
                    }}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  />
                )
              })()}
              
              {/* Key Moment Card - Only shown on hover or click, positioned above to prevent overlap */}
              {(isHovered || isActive) && (() => {
                const cardPos = getCardPosition(index, segment.position)
                if (!cardPos) return null
                
                return (
                  <motion.div
                    className="absolute left-1/2 -translate-x-1/2 w-72 cursor-pointer"
                    style={{
                      top: cardPos.top,
                      zIndex: cardPos.zIndex,
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
                )
              })()}
            </div>
          )
        })}
        
        {/* Time Labels */}
        <div className="relative mt-8" style={{ minHeight: '4rem' }}>
          {/* START label - positioned at 0% */}
          <div className="absolute left-0 flex flex-col items-start" style={{ transform: 'translateX(0)' }}>
            <div className="text-xs font-mono text-white/40">START</div>
            <div className="text-sm font-mono text-white/60 font-semibold mt-1">0:00</div>
          </div>
          
          {/* Segment labels - positioned at their marker positions */}
          {segments.map((segment, idx) => (
            <div 
              key={idx} 
              className="absolute flex flex-col items-center" 
              style={{ 
                left: `${segment.position}%`, 
                transform: 'translateX(-50%)',
              }}
            >
              <div className="text-xs font-mono text-white/40 whitespace-nowrap">{segment.title.toUpperCase()}</div>
              <div className="text-sm font-mono text-white/60 font-semibold mt-1">{segment.timestamp}</div>
            </div>
          ))}
          
          {/* END label - positioned at 100% */}
          <div className="absolute right-0 flex flex-col items-end" style={{ transform: 'translateX(0)' }}>
            <div className="text-xs font-mono text-white/40">END</div>
            <div className="text-sm font-mono text-white/60 font-semibold mt-1">{formatTime(duration)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
