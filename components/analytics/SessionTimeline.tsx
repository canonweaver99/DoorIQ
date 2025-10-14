'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react'

interface TimelineEvent {
  type: 'win' | 'opportunity' | 'signal' | 'critical'
  line: number
  timestamp: string
  title: string
  description: string
  score: number
  impact?: 'high' | 'medium' | 'low'
  duration?: number
}

interface SessionTimelineProps {
  duration: number // in seconds
  events: TimelineEvent[]
  lineRatings?: any[]
  fullTranscript?: Array<{ speaker: string, text: string, timestamp?: string }>
  onEventClick?: (event: TimelineEvent) => void
  customerName?: string
  salesRepName?: string
  dealOutcome?: {
    closed: boolean
    amount: number
    product: string
  }
  failurePoint?: number // Line number where deal was lost (if applicable)
}

export default function SessionTimeline({ 
  duration, 
  events, 
  lineRatings = [],
  fullTranscript = [],
  onEventClick,
  customerName = 'Customer',
  salesRepName = 'Sales Rep',
  dealOutcome,
  failurePoint
}: SessionTimelineProps) {
  const [hoveredDot, setHoveredDot] = useState<number | null>(null)
  const [showingIntroAnimation, setShowingIntroAnimation] = useState(true)
  const [currentlyAnimatingDot, setCurrentlyAnimatingDot] = useState<number | null>(0)
  
  // Animate tooltips in sequence on mount
  useEffect(() => {
    console.log('🎬 Timeline mounted - starting intro animation')
    console.log('📊 Events received:', events.length)
    console.log('📊 Events data:', events)
    
    // Show first tooltip
    setCurrentlyAnimatingDot(0)
    console.log('👉 Showing tooltip 0')
    
    // Show second tooltip after 1 second
    const timer1 = setTimeout(() => {
      setCurrentlyAnimatingDot(1)
      console.log('👉 Showing tooltip 1')
    }, 1000)
    
    // Show third tooltip after 2 seconds
    const timer2 = setTimeout(() => {
      setCurrentlyAnimatingDot(2)
      console.log('👉 Showing tooltip 2')
    }, 2000)
    
    // Hide all tooltips after 3 seconds
    const timer3 = setTimeout(() => {
      setCurrentlyAnimatingDot(null)
      setShowingIntroAnimation(false)
      console.log('✅ Intro animation complete - tooltips now only show on hover')
    }, 3500)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])
  
  // Use the events data directly (already contains timeline_key_moments from grading)
  const mappedDots = events.map((event, idx) => {
    console.log(`🔍 Mapping event ${idx}:`, event)
    
    // Calculate position percentage from timestamp
    const eventTime = parseTimestamp(event.timestamp)
    const position = (eventTime / duration) * 100
    
    return {
      position: position,
      timestamp: event.timestamp,
      label: event.title,
      quote: event.description,
      lineNumber: event.line,
      isSuccess: event.type === 'win',
      isAfterFailure: false,
      isFailurePoint: event.type === 'critical',
      effectiveness: event.score >= 80 ? 'excellent' : event.score >= 70 ? 'good' : event.score >= 60 ? 'average' : 'poor',
      score: event.score
    }
  })
  
  console.log('✅ Mapped dots:', mappedDots.length, mappedDots)

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function parseTimestamp(timestamp: string): number {
    const [mins, secs] = timestamp.split(':').map(Number)
    return (mins || 0) * 60 + (secs || 0)
  }

  // Time markers for the bottom
  const timeMarkers = [
    { position: 0, label: '0:00' },
    { position: 25, label: formatTime(duration * 0.25) },
    { position: 50, label: formatTime(duration * 0.5) },
    { position: 75, label: formatTime(duration * 0.75) },
    { position: 100, label: formatTime(duration) }
  ]

  return (
    <div className="space-y-6">
      {/* Conversation Context Header */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-lg font-semibold text-white">{formatTime(duration)}</span>
                <span className="text-sm text-slate-400">conversation</span>
              </div>
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
          
          {dealOutcome && (
            <div className={`px-4 py-2 rounded-xl border ${
              dealOutcome.closed 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-slate-500/10 border-slate-500/30'
            }`}>
              <div className="flex items-center gap-2">
                {dealOutcome.closed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Clock className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <div className={`text-sm font-semibold ${dealOutcome.closed ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {dealOutcome.closed ? 'Closed' : 'No Sale'}
                  </div>
                  {dealOutcome.closed && (
                    <div className="text-xs text-white">
                      ${dealOutcome.amount} - {dealOutcome.product}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Timeline with 3 Key Dots */}
      <div className="relative py-8">
        {/* Gradient bar with failure point handling */}
        <div className="relative h-2.5 rounded-full overflow-hidden">
          {/* Main gradient up to failure point (or full if successful) */}
          <div 
            className="absolute inset-y-0 left-0 transition-all duration-500"
            style={{
              width: failurePoint !== undefined ? `${(failurePoint / fullTranscript.length) * 100}%` : '100%',
              background: 'linear-gradient(to right, #3b82f6, #8b5cf6, #f59e0b, #ef4444)'
            }}
          />
          
          {/* Grayed out section after failure */}
          {failurePoint !== undefined && (
            <div 
              className="absolute inset-y-0 bg-slate-700/30"
              style={{
                left: `${(failurePoint / fullTranscript.length) * 100}%`,
                right: 0
              }}
            />
          )}
          
          {/* 3 Key moment dots */}
          {mappedDots.map((dot, i) => {
            const isHovered = hoveredDot === i
            const isAnimating = showingIntroAnimation && currentlyAnimatingDot === i
            const shouldShowTooltip = isHovered || isAnimating
            
            // Determine dot color
            let dotColor = 'bg-white'
            if (dot.isAfterFailure) {
              dotColor = 'bg-slate-500/50' // Grayed out
            } else if (dot.isFailurePoint) {
              dotColor = 'bg-red-500' // Red failure dot
            } else if (dot.isSuccess) {
              dotColor = 'bg-green-400' // Success
            } else if (dot.score >= 60) {
              dotColor = 'bg-yellow-400' // Neutral
            } else {
              dotColor = 'bg-red-400' // Negative
            }
            
            return (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
                style={{ left: `${dot.position}%` }}
                onMouseEnter={() => setHoveredDot(i)}
                onMouseLeave={() => setHoveredDot(null)}
              >
                {/* Dot */}
                <motion.div
                  className={`w-5 h-5 rounded-full cursor-pointer transition-all duration-200 ${dotColor}`}
                  style={{
                    boxShadow: isHovered 
                      ? '0 0 0 4px rgba(255,255,255,0.3), 0 4px 20px rgba(0,0,0,0.4)' 
                      : '0 2px 8px rgba(0,0,0,0.3)',
                    opacity: dot.isAfterFailure ? 0.4 : 1
                  }}
                  animate={{
                    scale: isHovered ? 1.3 : (dot.isFailurePoint ? [1, 1.1, 1] : 1)
                  }}
                  transition={{
                    scale: dot.isFailurePoint ? {
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeInOut"
                    } : undefined
                  }}
                />
                
                {/* Enhanced tooltip - shows on intro animation or hover */}
                <AnimatePresence>
                  {shouldShowTooltip && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      transition={{ type: "spring", duration: 0.5 }}
                      className="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 w-80 p-5 rounded-xl bg-slate-900/98 backdrop-blur-xl border border-slate-700/50 shadow-2xl pointer-events-none z-50"
                    >
                      {/* Header with success indicator */}
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-700/50">
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-mono text-purple-400">{dot.timestamp}</div>
                          {dot.isSuccess ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <div className="text-xs font-semibold text-slate-400">{dot.label}</div>
                      </div>
                      
                      {/* Conversation Quote */}
                      <div className="mb-3">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">What was said:</div>
                        <div className="text-sm text-slate-200 italic leading-relaxed bg-slate-800/50 p-3 rounded-lg border-l-2 border-purple-500/50">
                          "{dot.quote}"
                        </div>
                      </div>
                      
                      {/* Performance indicator */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Performance:</div>
                          <div className={`text-xs font-semibold ${
                            dot.effectiveness === 'excellent' ? 'text-green-400' :
                            dot.effectiveness === 'good' ? 'text-blue-400' :
                            dot.effectiveness === 'average' ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {dot.effectiveness?.toUpperCase()}
                          </div>
                        </div>
                        <div className={`text-lg font-bold ${
                          dot.score >= 80 ? 'text-green-400' :
                          dot.score >= 60 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {dot.score}/100
                        </div>
                      </div>
                      
                      {/* Deal killer indicator */}
                      {dot.isFailurePoint && (
                        <div className="mt-3 pt-3 border-t border-red-500/30 flex items-center gap-2 text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs font-semibold">DEAL KILLER - Sale lost here</span>
                        </div>
                      )}
                      
                      {/* Success indicator for final dot */}
                      {i === 2 && dot.isSuccess && dealOutcome?.closed && (
                        <div className="mt-3 pt-3 border-t border-green-500/30 flex items-center gap-2 text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs font-semibold">
                            CLOSED: ${dealOutcome.amount} - {dealOutcome.product}
                          </span>
                        </div>
                      )}
                      
                      {/* Tooltip arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="w-3 h-3 bg-slate-900 border-r border-b border-slate-700/50 rotate-45"></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
          
          {/* Dotted continuation line after failure */}
          {failurePoint !== undefined && (
            <div 
              className="absolute inset-y-0 border-t-2 border-dashed border-slate-600/50"
              style={{
                left: `${(failurePoint / fullTranscript.length) * 100}%`,
                right: 0,
                top: '50%'
              }}
            />
          )}
        </div>
        
        {/* Time markers */}
        <div className="flex justify-between mt-4 px-1">
          {timeMarkers.map((marker, i) => (
            <div key={i} className="text-xs text-slate-500 font-mono">
              {marker.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

