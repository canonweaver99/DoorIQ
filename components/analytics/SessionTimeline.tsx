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
    <div className="relative mb-20">
      {/* Header Card - Enhanced Visual Design */}
      <div 
        className="mb-10 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#151515] border border-[#2a2a2a]/80 p-6 md:p-8"
        style={{ 
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.1)' 
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left: Session Info */}
          <div className="flex items-start gap-6">
            <div className="flex items-center gap-4">
              <div 
                className="p-3.5 rounded-xl bg-gradient-to-br from-[#0a0a0a] to-[#050505] border border-purple-500/20"
                style={{ boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)' }}
              >
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl md:text-5xl font-bold text-white tabular-nums tracking-tight" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' }}>
                    {formattedDuration}
                  </span>
                  <span className="text-sm font-medium text-white/60 uppercase tracking-wider">duration</span>
                </div>
                <div className="flex items-center gap-5 mt-3 text-sm text-white/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400/50"></div>
                    <span className="font-medium">{customerName}</span>
                  </div>
                  <div className="w-px h-5 bg-white/15"></div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-sm shadow-blue-400/50"></div>
                    <span className="font-medium">{salesRepName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right: Outcome Badge */}
          <div 
            className={`flex items-center gap-3.5 px-6 py-3.5 rounded-xl border-2 transition-all duration-300 ${
              dealOutcome?.closed 
                ? 'bg-gradient-to-br from-emerald-500/25 via-green-500/20 to-emerald-600/25 border-emerald-400/60 text-emerald-200 shadow-lg shadow-emerald-500/20' 
                : 'bg-gradient-to-br from-slate-700/30 via-slate-600/25 to-slate-700/30 border-slate-500/50 text-slate-300 shadow-lg shadow-slate-900/30'
            }`}
          >
            {dealOutcome?.closed ? (
              <>
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold">Closed</div>
                  <div className="text-xs opacity-90 mt-0.5">${dealOutcome.amount.toLocaleString()}</div>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 flex-shrink-0" />
                <div className="text-sm font-bold">Not Closed</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Timeline - Enhanced Visual Design */}
      <div className="relative mb-4" ref={timelineRef}>
        {/* Progress Bar Background - Enhanced with glow effects */}
        <div 
          className="relative h-4 rounded-full bg-gradient-to-r from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f] border-2 border-purple-500/40 overflow-hidden"
          style={{
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.05)'
          }}
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-purple-500/50 via-blue-500/45 to-emerald-500/50"
            style={{
              filter: 'blur(0.5px)',
              boxShadow: 'inset 0 0 20px rgba(139, 92, 246, 0.3)'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50" />
        </div>
        
        {/* Key Moments */}
        {segments.map((segment, index) => {
          const Icon = segment.icon
          const isHovered = hoveredSegment === segment.id
          const isActive = activeSegment === segment.id
          
          return (
            <div
              key={segment.id}
              className="absolute top-0 pointer-events-auto"
              style={{ left: `${segment.position}%`, zIndex: 50 }}
              onMouseEnter={() => setHoveredSegment(segment.id)}
              onMouseLeave={() => setHoveredSegment(null)}
              onClick={() => setActiveSegment(activeSegment === segment.id ? null : segment.id)}
            >
              {/* Sparkle Icon - Enhanced styling with better shadows and transitions */}
              <motion.div
                className={`absolute left-1/2 -translate-x-1/2 w-14 h-14 rounded-full border-2 flex items-center justify-center cursor-pointer z-[60] transition-all duration-300 ${
                  isHovered || isActive
                    ? 'bg-white border-white shadow-xl shadow-purple-500/60'
                    : 'bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border-purple-400/70 shadow-lg shadow-purple-500/20'
                }`}
                style={{
                  top: '0px',
                  transform: 'translateX(-50%) translateY(-50%)',
                  marginTop: '8px'
                }}
                animate={{
                  scale: isHovered || isActive ? 1.2 : 1,
                  boxShadow: isHovered || isActive 
                    ? '0 0 24px rgba(139, 92, 246, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4)'
                    : '0 0 16px rgba(139, 92, 246, 0.3), 0 4px 8px rgba(0, 0, 0, 0.3)'
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <Sparkles className={`w-8 h-8 transition-colors duration-300 ${isHovered || isActive ? 'text-purple-600' : 'text-purple-400'}`} />
              </motion.div>
              
              
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
                    className="rounded-2xl border-2 border-white/40 p-6 bg-gradient-to-br from-[#0a0a0a] to-[#050505] backdrop-blur-xl"
                    style={{
                      background: `linear-gradient(135deg, ${getColorFromGradient(segment.color, 0.2)}), rgba(10, 10, 10, 0.98))`,
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-5">
                      <div 
                        className={`p-3 rounded-xl bg-gradient-to-br ${segment.color} shadow-lg`}
                        style={{ boxShadow: `0 4px 16px ${getColorFromGradient(segment.color, 0.4)}` }}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-lg font-bold text-white truncate mb-1">{segment.title}</div>
                        <div className="text-sm text-white/80 font-mono font-semibold">{segment.timestamp}</div>
                      </div>
                    </div>
                    
                    {/* Key Takeaway */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="pt-5 border-t border-white/15"
                    >
                      <p className="text-sm text-white/95 leading-relaxed font-medium">{segment.quickTip}</p>
                    </motion.div>
                  </div>
                  </motion.div>
                )
              })()}
            </div>
          )
        })}
        
        {/* Time Labels - Enhanced typography and spacing */}
        <div className="relative mt-10 pointer-events-none" style={{ minHeight: '4.5rem' }}>
          {/* START label - positioned at 0% */}
          <div className="absolute left-0 flex flex-col items-start" style={{ transform: 'translateX(0)' }}>
            <div className="text-xs font-mono font-semibold text-white/50 uppercase tracking-wider mb-1.5">START</div>
            <div className="text-base font-mono text-white/90 font-bold">0:00</div>
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
              <div className="text-xs font-mono font-semibold text-white/50 uppercase tracking-wider whitespace-nowrap mb-1.5">
                {segment.title.toUpperCase()}
              </div>
              <div className="text-base font-mono text-white/90 font-bold">{segment.timestamp}</div>
            </div>
          ))}
          
          {/* Subtle visual separator */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          {/* END label - positioned at 100% */}
          <div className="absolute right-0 flex flex-col items-end" style={{ transform: 'translateX(0)' }}>
            <div className="text-xs font-mono font-semibold text-white/50 uppercase tracking-wider mb-1.5">END</div>
            <div className="text-base font-mono text-white/90 font-bold">{formatTime(duration)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
