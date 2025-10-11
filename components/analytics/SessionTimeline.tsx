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
  onEventClick?: (event: TimelineEvent) => void
  customerName?: string
  salesRepName?: string
  dealOutcome?: {
    closed: boolean
    amount: number
    product: string
  }
}

export default function SessionTimeline({ 
  duration, 
  events, 
  lineRatings = [], 
  onEventClick,
  customerName = 'Customer',
  salesRepName = 'Sales Rep',
  dealOutcome
}: SessionTimelineProps) {
  const [hoveredDot, setHoveredDot] = useState<number | null>(null)
  
  // Extract exactly 6 key moments from the conversation
  const keyDots = [
    { position: 15, label: 'Opening', defaultQuote: 'Initial contact' },
    { position: 30, label: 'Problem Revealed', defaultQuote: 'Customer shares issue' },
    { position: 45, label: 'Trust Moment', defaultQuote: 'Connection established' },
    { position: 60, label: 'Objection', defaultQuote: 'Customer concern' },
    { position: 75, label: 'Resistance', defaultQuote: 'Final hesitation' },
    { position: 90, label: 'Close', defaultQuote: 'Deal outcome' }
  ]
  
  // Try to match key dots to actual events
  const mappedDots = keyDots.map((dot, idx) => {
    const targetTime = (duration * dot.position) / 100
    const nearbyEvents = events.filter(e => {
      const eventTime = parseTimestamp(e.timestamp)
      return Math.abs(eventTime - targetTime) < duration * 0.15 // Within 15% of target
    })
    
    const matchedEvent = nearbyEvents[0]
    
    return {
      position: dot.position,
      timestamp: matchedEvent?.timestamp || formatTime(targetTime),
      label: matchedEvent?.title || dot.label,
      quote: matchedEvent?.description || dot.defaultQuote
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

      {/* Simplified Timeline with 6 Key Dots */}
      <div className="relative py-8">
        {/* Single gradient bar */}
        <div className="relative h-2.5 rounded-full overflow-hidden">
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to right, #3b82f6, #8b5cf6, #f59e0b, #ef4444)'
            }}
          />
          
          {/* 6 Key moment dots */}
          {mappedDots.map((dot, i) => {
            const isHovered = hoveredDot === i
            
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
                  className="w-5 h-5 rounded-full bg-white cursor-pointer transition-all duration-200"
                  style={{
                    boxShadow: isHovered 
                      ? '0 0 0 4px rgba(255,255,255,0.3), 0 4px 20px rgba(0,0,0,0.4)' 
                      : '0 2px 8px rgba(0,0,0,0.3)'
                  }}
                  animate={{
                    scale: isHovered ? 1.3 : 1
                  }}
                />
                
                {/* Hover tooltip */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 w-72 p-4 rounded-xl bg-slate-900/98 backdrop-blur-xl border border-slate-700/50 shadow-2xl pointer-events-none"
                    >
                      <div className="text-xs font-mono text-purple-400 mb-2">{dot.timestamp}</div>
                      <div className="text-sm font-semibold text-white mb-2">{dot.label}</div>
                      <div className="text-sm text-slate-300 italic leading-relaxed">"{dot.quote}"</div>
                      
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

