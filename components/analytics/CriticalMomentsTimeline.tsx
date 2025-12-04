'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle, Clock, Lightbulb, Star } from 'lucide-react'
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

// Convert importance (1-10) to star rating (1-5)
function importanceToStars(importance?: number): number {
  if (!importance) return 3 // Default to 3 stars
  if (importance >= 9) return 5
  if (importance >= 7) return 4
  if (importance >= 5) return 3
  if (importance >= 3) return 2
  return 1
}

// Get color based on star rating
function getRatingColor(rating: number): { border: string; bg: string } {
  if (rating >= 4) return { border: 'border-green-500/40', bg: 'bg-green-500/10' }
  if (rating === 3) return { border: 'border-yellow-500/40', bg: 'bg-yellow-500/10' }
  return { border: 'border-red-500/40', bg: 'bg-red-500/10' }
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

  // Sort by importance and take top 1
  const sortedMoments = [...moments]
    .sort((a, b) => (b.importance || 0) - (a.importance || 0))
    .slice(0, 1)

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
          const starRating = importanceToStars(moment.importance)
          const ratingColors = getRatingColor(starRating)
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
                    {/* Star Rating - Centered */}
                    <div className="flex items-center justify-center sm:justify-start gap-1 mx-auto sm:mx-0 sm:ml-auto">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "w-4 h-4 sm:w-4 sm:h-4",
                            star <= starRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-600"
                          )}
                        />
                      ))}
                      <span className="text-xs sm:text-sm text-gray-400 ml-1">({starRating}/5)</span>
                    </div>
                  </div>
                  
                  {/* Transcript Quote - Single quote only */}
                  <div className="mb-4 p-3 sm:p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <p className="text-sm sm:text-base text-gray-200 italic mb-2">
                      "{(() => {
                        // Extract first meaningful quote (limit to ~80 chars for mobile)
                        let transcriptText = moment.transcript
                        // Replace "homeowner:" with agent name if available (case-insensitive)
                        if (agentName) {
                          transcriptText = transcriptText.replace(/homeowner\s*:/gi, `${agentName}:`)
                        }
                        // Find first quote or meaningful sentence
                        const firstQuoteMatch = transcriptText.match(/["']([^"']{1,80})["']/)
                        if (firstQuoteMatch) {
                          return firstQuoteMatch[1]
                        }
                        // Otherwise, take first sentence or first 80 chars
                        const firstSentence = transcriptText.split(/[.!?]/)[0]
                        if (firstSentence && firstSentence.length <= 80) {
                          return firstSentence.trim()
                        }
                        return transcriptText.slice(0, 80).trim() + (transcriptText.length > 80 ? '...' : '')
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
                  
                  {/* What Worked and Try This Next Time */}
                  {moment.analysis && (moment.analysis.whatWorked || moment.analysis.whatToImprove) && (
                    <div className="space-y-3 mt-4">
                      {moment.analysis.whatWorked && (
                        <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                          <Lightbulb className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-semibold text-green-400 mb-1.5">What Worked</div>
                            <p className="text-sm text-gray-200">{moment.analysis.whatWorked}</p>
                          </div>
                        </div>
                      )}
                      {moment.analysis.whatToImprove && (
                        <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                          <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-semibold text-blue-400 mb-1.5">Try Next Time</div>
                            <p className="text-sm text-gray-200">{moment.analysis.whatToImprove}</p>
                          </div>
                        </div>
                      )}
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

