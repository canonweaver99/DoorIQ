'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle, Clock, Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react'
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
  fullTranscript?: Array<{ speaker: string; text: string; timestamp?: Date | string }>
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
  agentName,
  fullTranscript
}: CriticalMomentsTimelineProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

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

  const currentMoment = sortedMoments[currentIndex]
  const canGoPrevious = currentIndex > 0
  const canGoNext = currentIndex < sortedMoments.length - 1

  const goToPrevious = () => {
    if (canGoPrevious) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const goToNext = () => {
    if (canGoNext) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-white">Key Moments That Defined This Session</h2>
        {sortedMoments.length > 1 && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              {currentIndex + 1} of {sortedMoments.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevious}
                disabled={!canGoPrevious}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  canGoPrevious
                    ? "bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                    : "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                )}
                aria-label="Previous moment"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNext}
                disabled={!canGoNext}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  canGoNext
                    ? "bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                    : "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                )}
                aria-label="Next moment"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="relative">
        {sortedMoments.map((moment, index) => {
          if (index !== currentIndex) return null
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
              initial={{ opacity: 0, x: index < currentIndex ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
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
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" />
                      <span className="text-base sm:text-lg font-medium text-gray-300">
                        {formatTimestamp(moment.timestamp, sessionStartTime, durationSeconds)}
                      </span>
                      <span className="text-base sm:text-lg font-semibold text-white">
                        - {getMomentTypeLabel(moment.type)}
                      </span>
                      {isSuccess && (
                        <span className="px-3 py-1.5 text-sm sm:text-base font-semibold bg-green-500/20 text-green-400 rounded-full">
                          Success
                        </span>
                      )}
                      {isFailure && (
                        <span className="px-3 py-1.5 text-sm sm:text-base font-semibold bg-red-500/20 text-red-400 rounded-full">
                          Critical Failure
                        </span>
                      )}
                      {isMissed && (
                        <span className="px-3 py-1.5 text-sm sm:text-base font-semibold bg-yellow-500/20 text-yellow-400 rounded-full">
                          Missed Opportunity
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Transcript Quote - Multiple lines with speaker labels */}
                  <div className="mb-4 p-4 sm:p-5 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    {(() => {
                      // Get dialogue lines from full transcript if available
                      let dialogueLines: Array<{ speaker: string; text: string }> = []
                      
                      if (fullTranscript && Array.isArray(fullTranscript) && moment.startIndex !== undefined) {
                        // Get multiple lines from transcript using startIndex and endIndex
                        const startIdx = Math.max(0, moment.startIndex)
                        // If endIndex is not provided, get 2-3 lines around startIndex for context
                        const endIdx = moment.endIndex !== undefined 
                          ? Math.min(fullTranscript.length - 1, moment.endIndex)
                          : Math.min(fullTranscript.length - 1, startIdx + 2) // Get up to 3 lines if no endIndex
                        
                        // Also get a few lines before startIndex for context (up to 1 line before)
                        const contextStartIdx = Math.max(0, startIdx - 1)
                        
                        for (let i = contextStartIdx; i <= endIdx && i < fullTranscript.length; i++) {
                          const entry = fullTranscript[i]
                          if (entry && (entry.text || entry.message)) {
                            const speaker = entry.speaker || 'unknown'
                            const text = entry.text || entry.message || ''
                            if (text.trim()) {
                              dialogueLines.push({
                                speaker: speaker === 'user' || speaker === 'rep' ? 'You' : (agentName || 'Homeowner'),
                                text: text.trim()
                              })
                            }
                          }
                        }
                      }
                      
                      // Fallback to single transcript if no full transcript available
                      if (dialogueLines.length === 0 && moment.transcript) {
                        let transcriptText = moment.transcript.trim()
                        
                        // Try to detect if it contains speaker labels
                        if (transcriptText.includes(':') && (transcriptText.includes('homeowner') || transcriptText.includes('rep') || transcriptText.includes('user'))) {
                          // Split by lines and parse speaker labels
                          const lines = transcriptText.split('\n').filter(l => l.trim())
                          lines.forEach(line => {
                            const colonIndex = line.indexOf(':')
                            if (colonIndex > 0) {
                              const speakerLabel = line.substring(0, colonIndex).trim().toLowerCase()
                              const text = line.substring(colonIndex + 1).trim()
                              if (text) {
                                dialogueLines.push({
                                  speaker: speakerLabel.includes('homeowner') 
                                    ? (agentName || 'Homeowner')
                                    : speakerLabel.includes('rep') || speakerLabel.includes('user')
                                    ? 'You'
                                    : speakerLabel,
                                  text
                                })
                              }
                            } else {
                              dialogueLines.push({ speaker: 'Unknown', text: line.trim() })
                            }
                          })
                        } else {
                          // Single quote without speaker info - try to infer from context
                          dialogueLines.push({
                            speaker: moment.type === 'objection' ? (agentName || 'Homeowner') : 'You',
                            text: transcriptText.replace(/^["']|["']$/g, '')
                          })
                        }
                      }
                      
                      if (dialogueLines.length === 0) {
                        return (
                          <p className="text-base sm:text-lg text-gray-400 italic">
                            No transcript available
                          </p>
                        )
                      }
                      
                      return (
                        <div className="space-y-3">
                          {dialogueLines.map((line, idx) => {
                            const isUser = line.speaker === 'You' || line.speaker.toLowerCase().includes('rep') || line.speaker.toLowerCase().includes('user')
                            return (
                              <div key={idx} className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={cn(
                                    "text-xs sm:text-sm font-semibold px-2 py-0.5 rounded",
                                    isUser 
                                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                      : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                  )}>
                                    {line.speaker}
                                  </span>
                                </div>
                                <p className={cn(
                                  "text-base sm:text-lg leading-relaxed pl-4 border-l-2",
                                  isUser 
                                    ? "text-blue-200 border-blue-500/40"
                                    : "text-purple-200 border-purple-500/40"
                                )}>
                                  "{line.text}"
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}
                    {/* Success Indicator - Interest Level Change */}
                    {interestChange && interestChange > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-green-400 text-base sm:text-lg font-semibold">
                        <span>📈</span>
                        <span>Interest Level: +{interestChange}% (They engaged!)</span>
                      </div>
                    )}
                  </div>
                  
                  {/* What Worked and What to Try Next Time - Always shown */}
                  <div className="space-y-3 mt-4">
                    <div className="flex items-start gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                      <Lightbulb className="w-6 h-6 text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-base sm:text-lg font-semibold text-green-400 mb-2">What Worked</div>
                        <p className="text-base sm:text-lg text-gray-200 leading-relaxed">
                          {(() => {
                            // Generate more specific feedback based on moment type and outcome
                            if (moment.analysis?.whatWorked) {
                              return moment.analysis.whatWorked
                            }
                            
                            // Type-specific default feedback
                            if (moment.type === 'objection' && moment.outcome === 'success') {
                              return `You effectively addressed the ${agentName || 'homeowner'}'s concern by acknowledging their position and providing a thoughtful response. Your approach showed empathy and maintained the conversation flow.`
                            }
                            if (moment.type === 'close_attempt' && moment.outcome === 'success') {
                              return `Your closing attempt was well-timed and natural. You created a clear path forward without being pushy, which helped move the conversation toward a decision.`
                            }
                            if (moment.type === 'rapport' && moment.outcome === 'success') {
                              return `You built strong rapport by finding common ground and showing genuine interest. This connection helped establish trust and made the ${agentName || 'homeowner'} more receptive to your message.`
                            }
                            if (moment.type === 'discovery' && moment.outcome === 'success') {
                              return `Your discovery questions uncovered important information about the ${agentName || 'homeowner'}'s needs and situation. This insight allowed you to tailor your approach effectively.`
                            }
                            
                            return 'This moment showed effective communication and engagement. You maintained a professional yet personable tone that kept the conversation moving forward.'
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <Lightbulb className="w-6 h-6 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-base sm:text-lg font-semibold text-blue-400 mb-2">What to Try Next Time</div>
                        <p className="text-base sm:text-lg text-gray-200 leading-relaxed">
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

