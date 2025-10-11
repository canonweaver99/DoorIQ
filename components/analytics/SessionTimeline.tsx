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
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null)
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null)
  const [hoveredZone, setHoveredZone] = useState<number | null>(null)
  const [filter, setFilter] = useState<string[]>(['win', 'opportunity', 'signal', 'critical'])
  const timelineRef = useRef<HTMLDivElement>(null)

  // Calculate momentum and success rate
  const successRate = events.length > 0 
    ? Math.round((events.filter(e => e.type === 'win').length / events.length) * 100)
    : 0
  const momentum = events.filter(e => e.type === 'win').length > events.filter(e => e.type === 'opportunity').length
    ? 'positive'
    : 'negative'

  const durationMinutes = Math.ceil(duration / 60)
  const timeMarkers = Array.from({ length: Math.min(5, durationMinutes + 1) }, (_, i) => ({
    time: (duration / 4) * i,
    label: formatTime((duration / 4) * i)
  }))

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function parseTimestamp(timestamp: string): number {
    const [mins, secs] = timestamp.split(':').map(Number)
    return (mins || 0) * 60 + (secs || 0)
  }

  // Calculate performance zones based on line ratings
  const performanceZones = []
  if (lineRatings.length > 0) {
    const zoneSize = duration / 10 // 10 zones
    for (let i = 0; i < 10; i++) {
      const start = i * zoneSize
      const end = (i + 1) * zoneSize
      
      // Find ratings in this zone
      const ratingsInZone = lineRatings.filter(r => {
        const ts = parseTimestamp(r.timestamp || '0:0')
        return ts >= start && ts < end
      })
      
      if (ratingsInZone.length > 0) {
        const avgScore = ratingsInZone.reduce((sum, r) => sum + r.score, 0) / ratingsInZone.length
        performanceZones.push({
          start: (i * 10),
          width: 10,
          score: avgScore,
          color: avgScore >= 80 ? '#10b981' : avgScore >= 60 ? '#3b82f6' : avgScore >= 40 ? '#f59e0b' : '#ef4444'
        })
      }
    }
  }

  // Filter events
  const filteredEvents = events.filter(e => filter.includes(e.type))

  // Calculate event statistics
  const eventStats = {
    total: events.length,
    wins: events.filter(e => e.type === 'win').length,
    opportunities: events.filter(e => e.type === 'opportunity').length,
    signals: events.filter(e => e.type === 'signal').length,
    critical: events.filter(e => e.type === 'critical').length
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'win': return { bg: '#10b981', border: '#10b98150' }
      case 'opportunity': return { bg: '#f59e0b', border: '#f59e0b50' }
      case 'signal': return { bg: '#3b82f6', border: '#3b82f650' }
      case 'critical': return { bg: '#ef4444', border: '#ef444450' }
      default: return { bg: '#6b7280', border: '#6b728050' }
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'win': return CheckCircle2
      case 'opportunity': return AlertCircle
      case 'signal': return Sparkles
      case 'critical': return Zap
      default: return Clock
    }
  }

  // Calculate conversation phases
  const phases = [
    { name: 'Discovery', start: 0, end: duration * 0.25, color: '#3b82f6' },
    { name: 'Building Trust', start: duration * 0.25, end: duration * 0.5, color: '#8b5cf6' },
    { name: 'Handling Objections', start: duration * 0.5, end: duration * 0.75, color: '#f59e0b' },
    { name: 'Closing', start: duration * 0.75, end: duration, color: '#10b981' }
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

      {/* Enhanced Statistics Bar */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">Duration: <span className="text-white font-medium">{formatTime(duration)}</span></span>
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-white font-medium">{eventStats.wins}</span>
              <span className="text-slate-400">Wins</span>
            </span>
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              <span className="text-white font-medium">{eventStats.opportunities}</span>
              <span className="text-slate-400">Opportunities</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span className="text-white font-medium">{eventStats.signals}</span>
              <span className="text-slate-400">Signals</span>
            </span>
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          <div className="flex items-center gap-2">
            {momentum === 'positive' ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-xs">
              <span className={momentum === 'positive' ? 'text-emerald-400' : 'text-amber-400'}>
                {successRate}%
              </span>
              <span className="text-slate-400"> success rate</span>
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <button
            onClick={() => setFilter(['win', 'opportunity', 'signal', 'critical'])}
            className="px-3 py-1 text-xs rounded-lg bg-white/5 border border-slate-700 hover:bg-white/10 transition-colors text-slate-300"
          >
            All
          </button>
          <button
            onClick={() => setFilter(['win'])}
            className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
              filter.length === 1 && filter[0] === 'win'
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : 'bg-white/5 border-slate-700 text-slate-400 hover:bg-white/10'
            }`}
          >
            Wins
          </button>
          <button
            onClick={() => setFilter(['opportunity'])}
            className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
              filter.length === 1 && filter[0] === 'opportunity'
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                : 'bg-white/5 border-slate-700 text-slate-400 hover:bg-white/10'
            }`}
          >
            Opportunities
          </button>
        </div>
      </div>

      {/* Timeline Track */}
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6">
        {/* Phase Labels */}
        <div className="flex mb-4">
          {phases.map((phase, i) => (
            <div 
              key={i}
              className="flex-1 text-center"
              style={{ flex: `${((phase.end - phase.start) / duration) * 100}%` }}
            >
              <div 
                className="text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: phase.color }}
              >
                {phase.name}
              </div>
              <div className="h-1 rounded-full" style={{ background: `${phase.color}40` }}></div>
            </div>
          ))}
        </div>

        {/* Time markers */}
        <div className="flex justify-between mb-2 px-2">
          {timeMarkers.map((marker, i) => (
            <div key={i} className="text-xs text-slate-500 font-mono">
              {marker.label}
            </div>
          ))}
        </div>

        {/* Timeline track with performance zones */}
        <div ref={timelineRef} className="relative h-20 rounded-xl overflow-hidden bg-slate-900/30 border border-slate-800/50">
          {/* Performance zones background */}
          <div className="absolute inset-0 flex">
            {performanceZones.map((zone, i) => {
              const isHovered = hoveredZone === i
              return (
                <div
                  key={i}
                  className="relative transition-all duration-300 cursor-pointer group"
                  style={{
                    width: `${zone.width}%`,
                    background: `linear-gradient(to bottom, ${zone.color}30, ${zone.color}10)`,
                    borderRight: i < performanceZones.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none'
                  }}
                  onMouseEnter={() => setHoveredZone(i)}
                  onMouseLeave={() => setHoveredZone(null)}
                >
                  {/* Score wave visualization */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 transition-all duration-300"
                    style={{
                      height: `${(zone.score / 100) * 100}%`,
                      background: `${zone.color}${isHovered ? '60' : '40'}`,
                      boxShadow: isHovered ? `0 -4px 20px ${zone.color}40` : 'none'
                    }}
                  />
                  
                  {/* Hover overlay */}
                  {isHovered && (
                    <div className="absolute inset-0 bg-white/5 flex items-center justify-center">
                      <div className="text-xs font-mono text-white bg-slate-900/90 px-2 py-1 rounded">
                        {Math.round(zone.score)}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Enhanced engagement gradient overlay */}
          <motion.div
            className="absolute top-0 left-0 h-full pointer-events-none"
            style={{
              background: 'linear-gradient(to right, #1e3a8a40, #3b82f680, #eab30880, #10b98180, #8b5cf680)'
            }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, ease: 'easeOut' }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-purple-400 via-pink-400 to-emerald-400 shadow-lg shadow-purple-500/50" />
          </motion.div>

          {/* Event markers */}
          {filteredEvents.map((event, i) => {
            const eventTime = parseTimestamp(event.timestamp)
            const position = (eventTime / duration) * 100
            const colors = getEventColor(event.type)
            const Icon = getEventIcon(event.type)
            const isHovered = hoveredEvent === i
            const isSelected = selectedEvent === i
            const size = event.impact === 'high' ? 16 : event.impact === 'medium' ? 12 : 10

            return (
              <motion.div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 cursor-pointer group z-10"
                style={{ left: `${position}%` }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 + 0.5 }}
                onMouseEnter={() => setHoveredEvent(i)}
                onMouseLeave={() => setHoveredEvent(null)}
                onClick={() => {
                  setSelectedEvent(isSelected ? null : i)
                  onEventClick?.(event)
                  // Scroll to card
                  const card = document.getElementById(`event-card-${i}`)
                  if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                }}
              >
                {/* Pulse animation for important events */}
                {(event.impact === 'high' || isSelected) && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ background: colors.bg }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                )}

                {/* Vertical connecting line */}
                <div 
                  className="absolute top-full mt-0 w-[2px] h-12 transition-all"
                  style={{ 
                    background: isHovered || isSelected ? colors.bg : `${colors.bg}40`,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    opacity: isHovered || isSelected ? 1 : 0.3
                  }}
                />

                {/* Marker dot */}
                <motion.div
                  className="relative rounded-full flex items-center justify-center cursor-pointer"
                  style={{
                    width: size * 3,
                    height: size * 3,
                    background: isHovered || isSelected ? colors.bg : `${colors.bg}CC`,
                    border: `3px solid ${isSelected ? '#fff' : colors.border}`,
                    boxShadow: isHovered || isSelected ? `0 0 30px ${colors.bg}, 0 0 60px ${colors.bg}40` : `0 0 10px ${colors.bg}40`
                  }}
                  animate={{
                    scale: isHovered ? 1.4 : isSelected ? 1.3 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon className="w-4 h-4 text-white" />
                </motion.div>

                {/* Enhanced Hover tooltip - positioned below timeline */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full mt-16 left-1/2 -translate-x-1/2 w-64 p-4 rounded-xl bg-slate-900/98 backdrop-blur-xl border shadow-2xl pointer-events-none z-50"
                      style={{ 
                        borderColor: colors.border,
                        boxShadow: `0 20px 60px ${colors.bg}40, 0 0 0 1px ${colors.border}`
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-semibold" style={{ color: colors.bg }}>{event.timestamp}</span>
                        {event.impact && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium ${
                            event.impact === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            event.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                          }`}>
                            {event.impact} impact
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-white mb-1">{event.title}</div>
                      <div className="text-xs text-slate-300 leading-relaxed">{event.description}</div>
                      {event.score > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-700/50">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Performance</span>
                            <span className="text-white font-semibold">{event.score}/100</span>
                          </div>
                          <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${event.score}%`,
                                background: colors.bg
                              }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 mt-3 text-center flex items-center justify-center gap-1">
                        <Zap className="w-3 h-3" />
                        Click to view full details
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {/* Time markers bottom */}
        <div className="flex justify-between mt-2 px-2">
          {timeMarkers.map((marker, i) => (
            <div key={i} className="w-px h-2 bg-slate-700"></div>
          ))}
        </div>
      </div>

      {/* Moment Cards */}
      <div className="space-y-3">
        {filteredEvents.map((event, i) => {
          const colors = getEventColor(event.type)
          const Icon = getEventIcon(event.type)
          const isSelected = selectedEvent === i
          const isHovered = hoveredEvent === i

          return (
            <motion.div
              key={i}
              id={`event-card-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative rounded-2xl backdrop-blur-xl border p-5 transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-white/10 border-white/30 shadow-2xl scale-[1.02]' 
                  : isHovered
                  ? 'bg-white/8 border-white/20 shadow-xl'
                  : 'bg-white/5 border-slate-700/50 hover:bg-white/8'
              }`}
              onClick={() => setSelectedEvent(isSelected ? null : i)}
              onMouseEnter={() => setHoveredEvent(i)}
              onMouseLeave={() => setHoveredEvent(null)}
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: isSelected || isHovered ? colors.bg : `${colors.bg}80`,
                boxShadow: isSelected ? `0 0 40px ${colors.bg}40` : 'none'
              }}
            >
              <div className="flex items-start gap-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${colors.bg}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: colors.bg }} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-slate-500">{event.timestamp}</span>
                    <span className="text-xs font-mono text-slate-600">Line {event.line}</span>
                    <span 
                      className="text-sm font-semibold"
                      style={{ color: colors.bg }}
                    >
                      {event.title}
                    </span>
                    {event.impact && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        event.impact === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        event.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}>
                        {event.impact}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-slate-300 leading-relaxed">{event.description}</p>
                  
                  {event.score > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${event.score}%` }}
                          transition={{ delay: i * 0.05 + 0.3, duration: 0.5 }}
                          style={{ background: colors.bg }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{event.score}/100</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">No events match the current filter</p>
        </div>
      )}
    </div>
  )
}

