'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle, Clock, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CriticalMoment {
  id: string
  type: 'objection' | 'close_attempt' | 'rapport' | 'discovery' | 'safety' | 'opening'
  startIndex?: number
  endIndex?: number
  transcript: string
  timestamp: string
  importance?: number
  outcome: 'success' | 'failure' | 'neutral' | 'missed_opportunity'
  analysis?: {
    whatHappened?: string
    whatWorked?: string
    whatToImprove?: string
    alternativeResponse?: string
    interestLevelChange?: number
  }
  coachingTip?: string
}

interface CriticalMomentsTimelineProps {
  moments: CriticalMoment[]
  sessionStartTime?: string | Date
  durationSeconds?: number
}

function formatTimestamp(
  timestamp: string, 
  sessionStartTime?: string | Date,
  durationSeconds?: number
): string {
  if (!timestamp) return ''
  
  try {
    // If already in MM:SS format, return as is
    const mmssMatch = timestamp.match(/^(\d+):(\d+)$/)
    if (mmssMatch) {
      return timestamp
    }
    
    // Try parsing as ISO string
    const momentTime = new Date(timestamp)
    if (isNaN(momentTime.getTime())) {
      return timestamp
    }
    
    // If we have session start time, calculate relative time
    if (sessionStartTime) {
      const startTime = new Date(sessionStartTime)
      if (!isNaN(startTime.getTime())) {
        const secondsFromStart = Math.floor((momentTime.getTime() - startTime.getTime()) / 1000)
        const minutes = Math.floor(secondsFromStart / 60)
        const seconds = secondsFromStart % 60
        return `${minutes}:${String(seconds).padStart(2, '0')}`
      }
    }
    
    // Fallback: if we have duration and position info, estimate
    // Otherwise, try to extract from timestamp
    const totalSeconds = Math.floor(momentTime.getTime() / 1000) % 86400
    const minutes = Math.floor(totalSeconds / 60) % 60
    const seconds = totalSeconds % 60
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  } catch {
    // If parsing fails, try to extract MM:SS from string
    const match = timestamp.match(/(\d+):(\d+)/)
    if (match) {
      return `${match[1]}:${match[2]}`
    }
    return timestamp
  }
}

function getMomentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    opening: 'Opening',
    rapport: 'Rapport Building',
    discovery: 'Discovery',
    objection: 'Objection Handling',
    close_attempt: 'Close Attempt',
    safety: 'Safety'
  }
  return labels[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export function CriticalMomentsTimeline({ 
  moments, 
  sessionStartTime, 
  durationSeconds 
}: CriticalMomentsTimelineProps) {
  if (!moments || moments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 text-center"
      >
        <AlertTriangle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <p className="text-slate-400">No critical moments identified for this session</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 mb-8"
    >
      <h2 className="text-2xl font-bold text-white mb-6">Key Moments That Defined This Session</h2>
      
      <div className="space-y-6">
        {moments.slice(0, 5).map((moment, index) => {
          const isSuccess = moment.outcome === 'success'
          const isFailure = moment.outcome === 'failure'
          const isMissed = moment.outcome === 'missed_opportunity'
          const isNeutral = moment.outcome === 'neutral'
          
          // Determine visual category
          const getOutcomeCategory = () => {
            if (isSuccess) return { emoji: '✅', label: 'Success Moment', color: 'green' }
            if (isMissed) return { emoji: '⚠️', label: 'Opportunity', color: 'yellow' }
            if (isFailure) return { emoji: '❌', label: 'Critical Miss', color: 'red' }
            return { emoji: '💡', label: 'Insight', color: 'blue' }
          }
          
          const category = getOutcomeCategory()
          const interestChange = moment.analysis?.interestLevelChange
          
          return (
            <motion.div
              key={moment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              className="relative"
            >
              <div className={cn(
                "flex gap-4 p-6 rounded-xl border-2 transition-all",
                isSuccess 
                  ? "bg-green-500/10 border-green-500/30" 
                  : isFailure
                  ? "bg-red-500/10 border-red-500/30"
                  : isMissed
                  ? "bg-yellow-500/10 border-yellow-500/30"
                  : "bg-blue-500/10 border-blue-500/30"
              )}>
                {/* Status Icon with Emoji */}
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <div className="text-2xl">{category.emoji}</div>
                  {isSuccess ? (
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  ) : isFailure ? (
                    <XCircle className="w-6 h-6 text-red-400" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-yellow-400" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">
                      {formatTimestamp(moment.timestamp, sessionStartTime, durationSeconds)}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      - {getMomentTypeLabel(moment.type)}
                    </span>
                    {isSuccess && (
                      <span className="px-2 py-1 text-xs font-semibold bg-green-500/20 text-green-400 rounded-full">
                        Success
                      </span>
                    )}
                    {isFailure && (
                      <span className="px-2 py-1 text-xs font-semibold bg-red-500/20 text-red-400 rounded-full">
                        Critical Failure
                      </span>
                    )}
                    {isMissed && (
                      <span className="px-2 py-1 text-xs font-semibold bg-yellow-500/20 text-yellow-400 rounded-full">
                        Missed Opportunity
                      </span>
                    )}
                  </div>
                  
                  {/* Transcript Quote */}
                  <div className="mb-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <p className="text-sm text-gray-200 italic mb-2">
                      "{moment.transcript.length > 150 ? moment.transcript.slice(0, 150) + '...' : moment.transcript}"
                    </p>
                    {/* Success Indicator - Interest Level Change */}
                    {interestChange && interestChange > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-green-400 text-xs font-semibold">
                        <span>📈</span>
                        <span>Interest Level: +{interestChange}% (They engaged!)</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Outcome Category Label */}
                  <div className="mb-2">
                    <span className={cn(
                      "text-xs font-semibold px-2 py-1 rounded-full",
                      category.color === 'green' && "bg-green-500/20 text-green-400",
                      category.color === 'yellow' && "bg-yellow-500/20 text-yellow-400",
                      category.color === 'red' && "bg-red-500/20 text-red-400",
                      category.color === 'blue' && "bg-blue-500/20 text-blue-400"
                    )}>
                      {category.emoji} {category.label}
                    </span>
                  </div>
                  
                  {/* Analysis */}
                  {moment.analysis?.whatHappened && (
                    <div className="mb-2 text-sm text-gray-300">
                      {moment.analysis.whatHappened.replace(/\bthe user\b/gi, 'you').replace(/\bthe rep\b/gi, 'you').replace(/\bthe sales rep\b/gi, 'you')}
                    </div>
                  )}
                  
                  {/* What Worked */}
                  {moment.analysis?.whatWorked && (
                    <div className="mb-2 text-sm">
                      <span className="text-green-400 font-medium">✓ What worked: </span>
                      <span className="text-gray-300">
                        {moment.analysis.whatWorked.replace(/\bthe user\b/gi, 'you').replace(/\bthe rep\b/gi, 'you').replace(/\bthe sales rep\b/gi, 'you')}
                      </span>
                    </div>
                  )}
                  
                  {/* What to Improve */}
                  {moment.analysis?.whatToImprove && (
                    <div className="mb-2 text-sm">
                      <span className="text-orange-400 font-medium">⚠ Improvement: </span>
                      <span className="text-gray-300">
                        {moment.analysis.whatToImprove.replace(/\bthe user\b/gi, 'you').replace(/\bthe rep\b/gi, 'you').replace(/\bthe sales rep\b/gi, 'you')}
                      </span>
                    </div>
                  )}
                  
                  {/* Coaching Tip / Alternative Response */}
                  {(moment.coachingTip || moment.analysis?.alternativeResponse) && (
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <span className="text-blue-400 font-medium">💡 Try this instead: </span>
                          <span className="text-blue-200 italic">
                            "{moment.coachingTip || moment.analysis?.alternativeResponse}"
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

