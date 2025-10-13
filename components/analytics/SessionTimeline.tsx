'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, TrendingUp, TrendingDown, Minus, CheckCircle2, AlertCircle, Sparkles, Zap, Filter } from 'lucide-react'

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
  
  // Define key moment types for the 6 dots
  const dotDefinitions = [
    { position: 15, label: 'Initial Resistance', category: 'introduction' },
    { position: 30, label: 'Problem Discovery', category: 'discovery' },
    { position: 45, label: 'Trust Building', category: 'rapport' },
    { position: 60, label: 'First Objection', category: 'objection_handling' },
    { position: 75, label: 'Critical Moment', category: 'objection_handling' },
    { position: 90, label: 'Close Attempt', category: 'closing' }
  ]
  
  // Map dots to actual conversation moments
  const mappedDots = dotDefinitions.map((dot, idx) => {
    const targetTime = (duration * dot.position) / 100
    const targetLineIndex = Math.floor((fullTranscript.length * dot.position) / 100)
    
    // Find events near this position
    const nearbyEvents = events.filter(e => {
      const eventTime = parseTimestamp(e.timestamp)
      return Math.abs(eventTime - targetTime) < duration * 0.15
    })
    
    // Find line ratings that match this category and are nearby
    const relevantRatings = lineRatings.filter((r: any) => {
      const category = (r.category || '').toLowerCase()
      return category.includes(dot.category) || 
             Math.abs(r.line_number - targetLineIndex) < fullTranscript.length * 0.1
    })
    
    // Get the best matching line rating
    const bestRating = relevantRatings.length > 0 
      ? relevantRatings.reduce((best: any, curr: any) => {
          const bestDist = Math.abs(best.line_number - targetLineIndex)
          const currDist = Math.abs(curr.line_number - targetLineIndex)
          return currDist < bestDist ? curr : best
        })
      : null
    
    // Extract actual quote from transcript
    let actualQuote = dot.label
    let actualTimestamp = formatTime(targetTime)
    let lineNum = targetLineIndex
    let momentType = dot.label
    let isSuccess = true
    
    if (bestRating && fullTranscript[bestRating.line_number]) {
      const transcriptLine = fullTranscript[bestRating.line_number]
      actualQuote = transcriptLine.text || transcriptLine.message || actualQuote
      actualTimestamp = transcriptLine.timestamp || bestRating.timestamp || actualTimestamp
      lineNum = bestRating.line_number
      
      // Determine success based on effectiveness
      isSuccess = ['excellent', 'good'].includes(bestRating.effectiveness)
      
      // Determine moment type from the rating
      if (bestRating.category) {
        momentType = bestRating.category.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
      }
    } else if (nearbyEvents.length > 0) {
      const event = nearbyEvents[0]
      actualTimestamp = event.timestamp
      lineNum = event.line
      momentType = event.title
      isSuccess = event.type !== 'critical'
    }
    
    // For the last dot, check if deal closed
    if (idx === 5) {
      isSuccess = dealOutcome?.closed || false
      momentType = dealOutcome?.closed ? 'Closed Successfully' : 'Deal Lost'
    }
    
    // Check if this dot is after the failure point
    const isAfterFailure = failurePoint !== undefined && lineNum > failurePoint
    const isFailurePoint = failurePoint !== undefined && Math.abs(lineNum - failurePoint) < fullTranscript.length * 0.05
    
    return {
      position: dot.position,
      timestamp: actualTimestamp,
      label: momentType,
      quote: actualQuote,
      lineNumber: lineNum,
      isSuccess,
      isAfterFailure,
      isFailurePoint,
      effectiveness: bestRating?.effectiveness || 'average',
      score: bestRating?.score || 50
    }
  })

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

      {/* Enhanced Timeline with 6 Key Dots */}
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
          
          {/* 6 Key moment dots */}
          {mappedDots.map((dot, i) => {
            const isHovered = hoveredDot === i
            
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
                
                {/* Enhanced hover tooltip */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
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
                      {i === 5 && dot.isSuccess && dealOutcome?.closed && (
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

