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
                            // Use analysis if available
                            if (moment.analysis?.whatWorked) {
                              return moment.analysis.whatWorked
                            }
                            
                            // Generate specific feedback based on transcript content and moment type
                            const transcriptLower = (moment.transcript || '').toLowerCase()
                            const isSuccess = moment.outcome === 'success'
                            const isFailure = moment.outcome === 'failure'
                            
                            // Objection handling feedback
                            if (moment.type === 'objection') {
                              if (isSuccess) {
                                if (transcriptLower.includes('understand') || transcriptLower.includes('hear')) {
                                  return `You acknowledged their concern first (${transcriptLower.includes('understand') ? 'showing understanding' : 'listening actively'}), which made them more receptive to your response. This validation approach builds trust before addressing objections.`
                                }
                                return `You handled this objection effectively by addressing their specific concern. Your response maintained the conversation flow and kept them engaged.`
                              }
                              if (isFailure) {
                                return `This objection wasn't fully resolved. Consider acknowledging their concern more directly before pivoting to your response.`
                              }
                              return `You addressed an objection here. To improve, try acknowledging their concern first, then provide a solution that addresses their specific worry.`
                            }
                            
                            // Close attempt feedback
                            if (moment.type === 'close_attempt') {
                              if (isSuccess) {
                                if (transcriptLower.includes('when') && !transcriptLower.includes('if')) {
                                  return `Your use of assumptive language ("when" instead of "if") created forward momentum. This confident approach helped move the conversation toward commitment.`
                                }
                                if (transcriptLower.includes('ready') || transcriptLower.includes('get started')) {
                                  return `Your direct closing approach worked well. You created a clear path forward and made it easy for them to say yes.`
                                }
                                return `Your closing attempt was effective. You created a natural transition to commitment without being pushy.`
                              }
                              if (isFailure) {
                                if (transcriptLower.includes('if') && !transcriptLower.includes('when')) {
                                  return `You used permission-seeking language ("if") which gave them an easy way out. Next time, try assumptive language like "when we get started" to create forward momentum.`
                                }
                                return `The close attempt didn't land. Consider using more assumptive language and creating urgency around the offer or timing.`
                              }
                              return `You attempted a close here. To improve effectiveness, use assumptive language ("when" instead of "if") and create a clear next step.`
                            }
                            
                            // Rapport building feedback
                            if (moment.type === 'rapport') {
                              if (isSuccess) {
                                if (transcriptLower.includes('neighbor') || transcriptLower.includes('neighborhood')) {
                                  return `You connected by referencing the neighborhood, which created a sense of local connection and trust. This local approach makes you feel more like a neighbor than a salesperson.`
                                }
                                if (transcriptLower.includes('?') && (transcriptLower.includes('how') || transcriptLower.includes('what'))) {
                                  return `You asked genuine questions about them, showing real interest. This personal connection helped build rapport and made them more comfortable.`
                                }
                                return `You built rapport by finding common ground and showing genuine interest. This connection established trust and made them more receptive.`
                              }
                              return `This was a rapport-building moment. To strengthen it, ask more personal questions and find shared experiences or local connections.`
                            }
                            
                            // Discovery feedback
                            if (moment.type === 'discovery') {
                              if (isSuccess) {
                                if (transcriptLower.includes('?') && transcriptLower.length < 100) {
                                  return `Your open-ended question uncovered valuable information. Short, focused questions like this are effective for discovery.`
                                }
                                return `Your discovery question revealed important information about their needs. This insight allowed you to tailor your approach effectively.`
                              }
                              return `This discovery moment could be improved. Try asking more open-ended questions that start with "what," "how," or "why" to uncover deeper needs.`
                            }
                            
                            // Opening feedback
                            if (moment.type === 'opening') {
                              if (isSuccess) {
                                if (transcriptLower.length < 50) {
                                  return `Your concise opening worked well. You got straight to the point without overwhelming them, which respects their time.`
                                }
                                return `Your opening established a positive tone. You introduced yourself clearly and set up the conversation effectively.`
                              }
                              return `The opening could be more effective. Try being more concise, mentioning the neighborhood connection, and getting to value quickly.`
                            }
                            
                            // Generic fallback - but more specific than before
                            if (isSuccess) {
                              return `This moment worked well. You maintained good communication and kept the conversation moving forward effectively.`
                            }
                            if (isFailure) {
                              return `This moment didn't achieve the desired outcome. Review the transcript to identify what could be improved for next time.`
                            }
                            return `This was an important moment in the conversation. Consider how you could strengthen your approach in similar situations.`
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <Lightbulb className="w-6 h-6 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-base sm:text-lg font-semibold text-blue-400 mb-2">What to Try Next Time</div>
                        <p className="text-base sm:text-lg text-gray-200 leading-relaxed">
                          {(() => {
                            // Use analysis if available
                            if (moment.analysis?.whatToImprove) {
                              return moment.analysis.whatToImprove
                            }
                            
                            // Generate specific improvement feedback based on moment type and outcome
                            const transcriptLower = (moment.transcript || '').toLowerCase()
                            const isSuccess = moment.outcome === 'success'
                            const isFailure = moment.outcome === 'failure'
                            
                            // Objection handling improvements
                            if (moment.type === 'objection') {
                              if (isFailure) {
                                return `Try acknowledging their concern first with phrases like "I hear you" or "That makes sense" before addressing it. Then ask a discovery question to understand their specific worry before responding.`
                              }
                              return `Even though this worked, you could strengthen it by asking a follow-up question to understand their concern deeper, then addressing the root cause rather than just the surface objection.`
                            }
                            
                            // Close attempt improvements
                            if (moment.type === 'close_attempt') {
                              if (isFailure) {
                                if (transcriptLower.includes('if')) {
                                  return `Replace "if" language with assumptive "when" language. Instead of "if you're interested," try "when we get started" or "once we set this up." This creates forward momentum.`
                                }
                                return `Try using assumptive language ("when" instead of "if"), create urgency around timing or the offer, and make the next step crystal clear.`
                              }
                              return `To make this even stronger, consider creating more urgency around timing or the offer, and use multiple close attempts if they hesitate.`
                            }
                            
                            // Rapport improvements
                            if (moment.type === 'rapport') {
                              return `To deepen rapport, ask more personal questions about their home, family, or neighborhood. Reference specific things they mention and find shared experiences.`
                            }
                            
                            // Discovery improvements
                            if (moment.type === 'discovery') {
                              if (!transcriptLower.includes('?')) {
                                return `Try asking more open-ended questions that start with "what," "how," or "why" instead of yes/no questions. This uncovers deeper needs and motivations.`
                              }
                              return `Follow up with deeper questions. After they answer, ask "What else?" or "Tell me more about that" to uncover additional needs.`
                            }
                            
                            // Opening improvements
                            if (moment.type === 'opening') {
                              if (transcriptLower.length > 100) {
                                return `Your opening was too long. Keep it under 30 seconds - mention the neighborhood connection, get to value quickly, and ask a question to engage them.`
                              }
                              return `Strengthen your opening by mentioning the neighborhood connection earlier, getting to value faster, and asking an engaging question to start the conversation.`
                            }
                            
                            // Generic improvements
                            if (isFailure) {
                              return `Review this moment and identify what didn't work. Consider asking for feedback or practicing this scenario to improve your approach.`
                            }
                            return `Even successful moments can be improved. Consider how you could make this moment even more effective next time by refining your language or timing.`
                          })()}
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

