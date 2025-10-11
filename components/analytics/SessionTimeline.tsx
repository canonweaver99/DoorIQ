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
}

export default function SessionTimeline({ duration, events, lineRatings = [], onEventClick }: SessionTimelineProps) {
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null)
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null)
  const [filter, setFilter] = useState<string[]>(['win', 'opportunity', 'signal', 'critical'])
  const timelineRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className="space-y-6">
      {/* Statistics Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">Duration: {formatTime(duration)}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              {eventStats.wins} Wins
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-400"></div>
              {eventStats.opportunities} Opportunities
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              {eventStats.signals} Signals
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
        {/* Time markers */}
        <div className="flex justify-between mb-2 px-2">
          {timeMarkers.map((marker, i) => (
            <div key={i} className="text-xs text-slate-500 font-mono">
              {marker.label}
            </div>
          ))}
        </div>

        {/* Timeline track with performance zones */}
        <div ref={timelineRef} className="relative h-20 rounded-xl overflow-hidden">
          {/* Performance zones background */}
          <div className="absolute inset-0 flex">
            {performanceZones.map((zone, i) => (
              <div
                key={i}
                className="relative transition-all duration-300"
                style={{
                  width: `${zone.width}%`,
                  background: `linear-gradient(to right, ${zone.color}20, ${zone.color}10)`,
                  borderRight: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <div 
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    height: `${(zone.score / 100) * 100}%`,
                    background: `${zone.color}40`
                  }}
                />
              </div>
            ))}
          </div>

          {/* Progress line */}
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 backdrop-blur-sm"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />

          {/* Event markers */}
          {filteredEvents.map((event, i) => {
            const eventTime = parseTimestamp(event.timestamp)
            const position = (eventTime / duration) * 100
            const colors = getEventColor(event.type)
            const Icon = getEventIcon(event.type)
            const isHovered = hoveredEvent === i
            const isSelected = selectedEvent === i
            const size = event.impact === 'high' ? 12 : event.impact === 'medium' ? 10 : 8

            return (
              <motion.div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: `${position}%` }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 + 0.5 }}
                onMouseEnter={() => setHoveredEvent(i)}
                onMouseLeave={() => setHoveredEvent(null)}
                onClick={() => {
                  setSelectedEvent(isSelected ? null : i)
                  onEventClick?.(event)
                }}
              >
                {/* Vertical line to card */}
                <div 
                  className="absolute top-full mt-2 w-[2px] h-8 opacity-50"
                  style={{ background: colors.bg, left: '50%', transform: 'translateX(-50%)' }}
                />

                {/* Marker dot */}
                <motion.div
                  className="relative rounded-full flex items-center justify-center"
                  style={{
                    width: size * 4,
                    height: size * 4,
                    background: colors.bg,
                    border: `2px solid ${colors.border}`,
                    boxShadow: isHovered || isSelected ? `0 0 20px ${colors.bg}` : 'none'
                  }}
                  animate={{
                    scale: isHovered ? 1.3 : isSelected ? 1.2 : 1,
                  }}
                >
                  <Icon className="w-3 h-3 text-white" />
                </motion.div>

                {/* Hover tooltip */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 p-3 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl"
                    >
                      <div className="text-xs text-slate-400 mb-1">{event.timestamp}</div>
                      <div className="text-sm font-medium text-white mb-1">{event.title}</div>
                      <div className="text-xs text-slate-300">{event.description}</div>
                      {event.score > 0 && (
                        <div className="text-xs text-slate-400 mt-2">Score: {event.score}/100</div>
                      )}
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

          return (
            <motion.div
              key={i}
              id={`event-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative rounded-2xl backdrop-blur-xl border p-5 transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-white/10 border-white/30 shadow-lg' 
                  : 'bg-white/5 border-slate-700/50 hover:bg-white/8'
              }`}
              onClick={() => setSelectedEvent(isSelected ? null : i)}
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: colors.bg
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

