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
  agentName?: string | null
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

// Get color based on outcome
function getOutcomeColor(outcome: string): { border: string; bg: string } {
  if (outcome === 'success') return { border: 'border-green-500/40', bg: 'bg-green-500/10' }
  if (outcome === 'failure') return { border: 'border-red-500/40', bg: 'bg-red-500/10' }
  if (outcome === 'missed_opportunity') return { border: 'border-yellow-500/40', bg: 'bg-yellow-500/10' }
  return { border: 'border-blue-500/40', bg: 'bg-blue-500/10' }
}

export function CriticalMomentsTimeline({ 
  moments, 
  sessionStartTime, 
  durationSeconds,
  agentName
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

  // Sort by importance - show all moments, not just top 1
  const sortedMoments = [...moments]
    .sort((a, b) => (b.importance || 0) - (a.importance || 0))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 mb-8"
    >
      <h2 className="text-3xl font-bold text-white mb-6">Key Moments That Defined This Session</h2>
      
      <div className="space-y-6">
        {sortedMoments.map((moment, index) => {
          const ratingColors = getOutcomeColor(moment.outcome)
          const isSuccess = moment.outcome === 'success'
          const isFailure = moment.outcome === 'failure'
          const isMissed = moment.outcome === 'missed_opportunity'
          const isNeutral = moment.outcome === 'neutral'
          
          // Determine visual category
          const getOutcomeCategory = () => {
            if (isSuccess) return { label: 'Success Moment', color: 'green' }
            if (isMissed) return { label: 'Opportunity', color: 'yellow' }
            if (isFailure) return { label: 'Critical Miss', color: 'red' }
            return { label: 'Insight', color: 'blue' }
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
                ratingColors.bg,
                ratingColors.border
              )}>
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {isSuccess ? (
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  ) : isFailure ? (
                    <XCircle className="w-8 h-8 text-red-400" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-yellow-400" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                      <span className="text-sm sm:text-base font-medium text-gray-300">
                        {formatTimestamp(moment.timestamp, sessionStartTime, durationSeconds)}
                      </span>
                      <span className="text-sm sm:text-base font-semibold text-white">
                        - {getMomentTypeLabel(moment.type)}
                      </span>
                      {isSuccess && (
                        <span className="px-2 py-1 text-xs sm:text-sm font-semibold bg-green-500/20 text-green-400 rounded-full">
                          Success
                        </span>
                      )}
                      {isFailure && (
                        <span className="px-2 py-1 text-xs sm:text-sm font-semibold bg-red-500/20 text-red-400 rounded-full">
                          Critical Failure
                        </span>
                      )}
                      {isMissed && (
                        <span className="px-2 py-1 text-xs sm:text-sm font-semibold bg-yellow-500/20 text-yellow-400 rounded-full">
                          Missed Opportunity
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Transcript Quote - Single quote only */}
                  <div className="mb-4 p-3 sm:p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <p className="text-sm sm:text-base text-gray-200 italic mb-2">
                      "{(() => {
                        // Use transcript directly - it should already be extracted from conversation
                        let transcriptText = moment.transcript || ''
                        
                        // Replace "homeowner:" with agent name if available (case-insensitive)
                        if (agentName && transcriptText) {
                          transcriptText = transcriptText.replace(/homeowner\s*:/gi, `${agentName}:`)
                        }
                        
                        // Return empty string if no transcript
                        if (!transcriptText || transcriptText.trim().length === 0) {
                          return 'No transcript available'
                        }
                        
                        // Clean up the transcript text
                        transcriptText = transcriptText.trim()
                        
                        // Remove any leading/trailing quotes if present
                        transcriptText = transcriptText.replace(/^["']|["']$/g, '')
                        
                        // If it's a long quote, truncate to ~120 chars for better display
                        if (transcriptText.length > 120) {
                          // Try to truncate at a sentence boundary
                          const truncated = transcriptText.slice(0, 120)
                          const lastPeriod = truncated.lastIndexOf('.')
                          const lastQuestion = truncated.lastIndexOf('?')
                          const lastExclamation = truncated.lastIndexOf('!')
                          const lastPunctuation = Math.max(lastPeriod, lastQuestion, lastExclamation)
                          
                          if (lastPunctuation > 80) {
                            return transcriptText.slice(0, lastPunctuation + 1)
                          }
                          return truncated + '...'
                        }
                        
                        return transcriptText
                      })()}"
                    </p>
                    {/* Success Indicator - Interest Level Change */}
                    {interestChange && interestChange > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-green-400 text-sm font-semibold">
                        <span>📈</span>
                        <span>Interest Level: +{interestChange}% (They engaged!)</span>
                      </div>
                    )}
                  </div>
                  
                  {/* What Worked and What to Try Next Time - Always shown */}
                  <div className="space-y-3 mt-4">
                    <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <Lightbulb className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-green-400 mb-1.5">What Worked</div>
                        <p className="text-sm text-gray-200">
                          {moment.analysis?.whatWorked || 'This moment showed effective communication and engagement.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-blue-400 mb-1.5">What to Try Next Time</div>
                        <p className="text-sm text-gray-200">
                          {moment.analysis?.whatToImprove || 'Consider alternative approaches to enhance this moment further.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

