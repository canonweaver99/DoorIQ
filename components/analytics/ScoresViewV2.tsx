'use client'

import { useState, useEffect } from 'react'
import { Users, Target, Shield, HandshakeIcon, DollarSign, Download, Share2, BookOpen, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Zap, Clock, Award, AlertCircle, CheckCircle2, Sparkles, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import SessionTimeline from './SessionTimeline'
import CoachingChat from './CoachingChat'

interface ScoresViewV2Props {
  sessionId: string
  overallScore: number
  scores: {
    rapport: number
    discovery: number
    objection_handling: number
    closing: number
    safety: number
    introduction: number
    listening: number
    speaking_pace?: number
    filler_words?: number
    question_ratio?: number
    active_listening?: number
    assumptive_language?: number
  }
  feedback: {
    strengths: string[]
    improvements: string[]
    specific_tips: string[]
  }
  virtualEarnings: number
  earningsData?: any
  dealDetails?: any
  conversationDynamics?: any
  failureAnalysis?: any
  saleClosed?: boolean
  lineRatings?: any[]
  fullTranscript?: Array<{ speaker: string, text: string, timestamp?: string }>
  timelineKeyMoments?: Array<{
    position: number
    line_number: number
    timestamp: string
    moment_type: string
    quote: string
    is_positive: boolean
  }>
  agentName?: string
  durationSeconds?: number
  audioUrl?: string
}

export default function ScoresViewV2({
  sessionId,
  overallScore,
  scores,
  feedback,
  virtualEarnings,
  earningsData,
  dealDetails,
  conversationDynamics,
  failureAnalysis,
  saleClosed,
  lineRatings = [],
  fullTranscript = [],
  timelineKeyMoments,
  agentName = 'AI Agent',
  durationSeconds = 600,
  audioUrl
}: ScoresViewV2Props) {
  const [animatedEarnings, setAnimatedEarnings] = useState(0)
  const [showFillerWordsDropdown, setShowFillerWordsDropdown] = useState(false)

  // Animate earnings counter
  useEffect(() => {
    if (virtualEarnings > 0) {
      const duration = 1500
      const steps = 60
      const increment = virtualEarnings / steps
      let current = 0
      
      const timer = setInterval(() => {
        current += increment
        if (current >= virtualEarnings) {
          setAnimatedEarnings(virtualEarnings)
          clearInterval(timer)
        } else {
          setAnimatedEarnings(current)
        }
      }, duration / steps)
      
      return () => clearInterval(timer)
    }
  }, [virtualEarnings])

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#3b82f6'
    if (score >= 40) return '#f59e0b'
    return '#ef4444'
  }

  const getScoreGrade = (score: number) => {
    if (score >= 95) return 'A+'
    if (score >= 90) return 'A'
    if (score >= 85) return 'B+'
    if (score >= 80) return 'B'
    if (score >= 75) return 'C+'
    if (score >= 70) return 'C'
    if (score >= 65) return 'D'
    return 'F'
  }

  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Outstanding Performance!'
    if (score >= 80) return 'Strong Performance'
    if (score >= 70) return 'Good Foundation'
    if (score >= 60) return 'Room for Growth'
    return 'Keep Practicing'
  }

  // Extract key moments - prefer LLM-generated timeline moments, fallback to extraction
  function parseTimestamp(ts: string): number {
    const [mins, secs] = ts.split(':').map(Number)
    return (mins || 0) * 60 + (secs || 0)
  }

  let keyMoments: any[] = []
  
  console.log('🔍 Timeline check:', {
    hasTimelineKeyMoments: !!timelineKeyMoments,
    timelineLength: timelineKeyMoments?.length || 0,
    timelineData: timelineKeyMoments
  })
  
  // If we have pre-generated timeline moments from the LLM, use those (expecting 3 moments now)
  if (timelineKeyMoments && timelineKeyMoments.length >= 1) {
    console.log('✅ Using timeline_key_moments from grading:', timelineKeyMoments.length, 'moments')
    console.log('📋 Session ID:', sessionId) // Log to verify uniqueness
    keyMoments = timelineKeyMoments.map((moment, idx) => {
      // Convert effectiveness to score for timeline display
      const rating = lineRatings?.find((r: any) => r.line_number === moment.line_number)
      const effectivenessScore = rating?.effectiveness === 'excellent' ? 90 :
                                  rating?.effectiveness === 'good' ? 75 :
                                  rating?.effectiveness === 'average' ? 60 : 40
      
      console.log(`📍 Timeline moment ${idx + 1}/${timelineKeyMoments.length}:`, {
        sessionId: sessionId.substring(0, 8), // Show partial ID to verify uniqueness
        line: moment.line_number,
        timestamp: moment.timestamp,
        type: moment.moment_type,
        quote: moment.quote?.substring(0, 50) + '...',
        description: moment.description?.substring(0, 50) + '...'
      })
      
      return {
        type: moment.is_positive ? 'win' : 'critical',
        line: moment.line_number,
        timestamp: moment.timestamp,
        title: moment.moment_type,
        description: moment.description || moment.quote, // Use description if available
        score: effectivenessScore,
        impact: 'high'
      }
    })
    console.log('✅ Mapped', keyMoments.length, 'timeline moments for session', sessionId.substring(0, 8))
  } else {
    // Fallback not needed - we always get timeline_key_moments from grading
    // If missing, just show empty timeline
    console.log('⚠️ No timeline moments found in analytics - timeline will not display')
    console.log('⚠️ Received timelineKeyMoments:', timelineKeyMoments)
  }

  const coreMetrics = [
    { name: 'Rapport', score: scores.rapport, icon: Users, color: '#10b981' },
    { name: 'Discovery', score: scores.discovery, icon: Target, color: '#3b82f6' },
    { name: 'Objection Handling', score: scores.objection_handling, icon: Shield, color: '#f59e0b' },
    { name: 'Closing', score: scores.closing, icon: HandshakeIcon, color: '#8b5cf6' }
  ]

  return (
    <div className="space-y-8">
      {/* Hero Section - "How did I do?" */}
      <section className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Score Card */}
          <div className="lg:col-span-2 relative rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-8 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="text-sm uppercase tracking-[0.25em] text-slate-500 mb-2">Session Performance</div>
                  <h2 className="text-4xl font-bold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
                    {getScoreMessage(overallScore)}
                  </h2>
                </div>
                <div className="text-right">
                  <div className={`text-6xl font-bold mb-1`} style={{ color: getScoreColor(overallScore) }}>
                    {overallScore}
                  </div>
                  <div className="text-sm text-slate-400">Overall Score</div>
                  <div 
                    className="inline-block mt-2 px-4 py-1.5 rounded-full text-lg font-semibold"
                    style={{ 
                      background: `${getScoreColor(overallScore)}20`,
                      color: getScoreColor(overallScore),
                      border: `1px solid ${getScoreColor(overallScore)}40`
                    }}
                  >
                    {getScoreGrade(overallScore)} Grade
                  </div>
                </div>
              </div>

              {/* Filler Word Display - Penalty or Congrats */}
              {scores.filler_words !== undefined && scores.filler_words === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-emerald-300">Congrats, you didn't stutter!</div>
                      <div className="text-xs text-emerald-400/70">Zero filler words detected - crystal clear communication</div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {scores.filler_words && scores.filler_words > 0 && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowFillerWordsDropdown(!showFillerWordsDropdown)}
                    className="w-full p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-300">
                          {scores.filler_words} filler words detected = <strong>-{scores.filler_words}% penalty</strong> applied
                        </span>
                      </div>
                      <motion.div
                        animate={{ rotate: showFillerWordsDropdown ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="w-4 h-4 text-amber-400" />
                      </motion.div>
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {showFillerWordsDropdown && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 p-4 bg-slate-900/50 border border-amber-500/20 rounded-xl max-h-64 overflow-y-auto">
                          <h4 className="text-sm font-semibold text-amber-300 mb-3">Filler Word Locations:</h4>
                          <div className="space-y-2">
                            {fullTranscript?.filter((line, idx) => {
                              const text = line.text || line.message || ''
                              // Only match standalone filler words (not parts of other words)
                              const fillerPattern = /\b(um|uhh?|uh|like|erm|err|hmm)\b/gi
                              const isRepLine = line.speaker === 'rep' || line.speaker === 'user'
                              return isRepLine && fillerPattern.test(text)
                            }).map((line, idx) => {
                              const text = line.text || line.message || ''
                              const lineIndex = fullTranscript.indexOf(line)
                              
                              // Highlight filler words in the text
                              const highlightedText = text.replace(
                                /\b(um|uhh?|uh|like|erm|err|hmm)\b/gi,
                                '<mark class="bg-amber-500/30 text-amber-300 px-1 rounded">$1</mark>'
                              )
                              
                              // Format timestamp to simple M:SS format
                              let displayTime = `Line ${lineIndex}`
                              if (line.timestamp) {
                                try {
                                  const timestamp = line.timestamp
                                  // If it's already in M:SS format, use it
                                  if (/^\d{1,2}:\d{2}$/.test(timestamp)) {
                                    displayTime = timestamp
                                  } else {
                                    // Parse ISO datetime and convert to seconds from start
                                    const date = new Date(timestamp)
                                    // Assuming session start is first line timestamp
                                    const firstLine = fullTranscript[0]
                                    if (firstLine?.timestamp) {
                                      const startDate = new Date(firstLine.timestamp)
                                      const secondsFromStart = Math.floor((date.getTime() - startDate.getTime()) / 1000)
                                      const mins = Math.floor(secondsFromStart / 60)
                                      const secs = secondsFromStart % 60
                                      displayTime = `${mins}:${secs.toString().padStart(2, '0')}`
                                    }
                                  }
                                } catch (e) {
                                  // Keep default Line X format
                                }
                              }
                              
                              return (
                                <div key={idx} className="text-xs p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg hover:bg-amber-500/10 transition-colors">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    <span className="text-amber-400 font-mono">{displayTime}</span>
                                  </div>
                                  <p 
                                    className="text-slate-300 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: `"${highlightedText}"` }}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                {coreMetrics.map((metric, i) => {
                  const Icon = metric.icon
                  return (
                    <motion.div
                      key={metric.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="relative rounded-2xl bg-slate-900/50 border border-slate-700/50 p-4"
                    >
                      <div 
                        className="absolute top-0 left-0 h-1 rounded-t-2xl"
                        style={{ 
                          width: `${metric.score}%`,
                          background: metric.color
                        }}
                      />
                      <Icon className="w-5 h-5 mb-2" style={{ color: metric.color }} />
                      <div className="text-2xl font-bold text-white mb-1">{metric.score}%</div>
                      <div className="text-sm text-slate-200 font-medium">{metric.name}</div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Earnings Card - Always show */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative rounded-3xl backdrop-blur-xl p-8 overflow-hidden ${
              saleClosed && virtualEarnings > 0
                ? 'bg-gradient-to-br from-emerald-900/40 to-green-800/40 border border-emerald-500/30'
                : 'bg-gradient-to-br from-red-900/40 to-rose-800/40 border border-red-500/30'
            }`}
          >
            {/* Sparkle background */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl ${
              saleClosed && virtualEarnings > 0
                ? 'bg-gradient-to-br from-emerald-400/20 to-green-400/20'
                : 'bg-gradient-to-br from-red-400/20 to-rose-400/20'
            }`}></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                {saleClosed && virtualEarnings > 0 ? (
                  <>
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                    <span className="text-sm uppercase tracking-[0.25em] text-emerald-400">You Earned</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-400" />
                    <span className="text-sm uppercase tracking-[0.25em] text-red-400">Close Failed</span>
                  </>
                )}
              </div>
              
              <div className={`text-5xl font-bold text-white mb-6 ${
                !saleClosed || virtualEarnings === 0 ? 'line-through opacity-50' : ''
              }`}>
                ${saleClosed && virtualEarnings > 0 ? animatedEarnings.toFixed(2) : '0.00'}
              </div>

              {saleClosed && virtualEarnings > 0 ? (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Deal Value</span>
                      <span className="text-white font-medium">${dealDetails?.total_contract_value || dealDetails?.base_price || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Commission (30%)</span>
                      <span className="text-emerald-400 font-medium">${earningsData?.commission_earned?.toFixed(2) || '0.00'}</span>
                    </div>
                    {earningsData?.bonus_modifiers && Object.values(earningsData.bonus_modifiers).some((v: any) => v > 0) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Bonuses</span>
                        <span className="text-yellow-400 font-medium">
                          ${Object.values(earningsData.bonus_modifiers).reduce((a: any, b: any) => a + b, 0)}
                        </span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-emerald-500/20 flex justify-between">
                      <span className="text-white font-semibold">Total Virtual Earnings</span>
                      <span className="text-emerald-400 font-bold text-lg">${virtualEarnings.toFixed(2)}</span>
                    </div>
                  </div>

                  {dealDetails?.product_sold && (
                    <div className="mt-4 pt-4 border-t border-emerald-500/20">
                      <div className="text-xs text-slate-400 mb-1">Product Sold</div>
                      <div className="text-sm text-white">{dealDetails.product_sold}</div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between text-base">
                    <span className="text-slate-300 font-medium">Potential Deal Value</span>
                    <span className="text-white/70 font-semibold line-through">$--</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-slate-300 font-medium">Missed Commission</span>
                    <span className="text-red-300 font-semibold">$0.00</span>
                  </div>
                  <div className="pt-4 border-t border-red-500/30">
                    <p className="text-base text-red-200 font-medium leading-relaxed">No sale was closed this session. Review the feedback below to improve your approach.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Timeline - "What specific moments mattered?" */}
      {keyMoments.length > 0 && (
        <section className="rounded-3xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm uppercase tracking-[0.25em] text-slate-500">Session Timeline</h3>
          </div>
          
          <SessionTimeline
            duration={durationSeconds}
            events={keyMoments}
            lineRatings={lineRatings}
            fullTranscript={fullTranscript}
            customerName={agentName}
            salesRepName="Canon Weaver"
            dealOutcome={{
              closed: saleClosed || false,
              amount: dealDetails?.base_price || dealDetails?.total_contract_value || 0,
              product: dealDetails?.product_sold || 'Service'
            }}
            audioUrl={audioUrl}
          />
        </section>
      )}

      {/* AI Coaching Chat - Below Timeline */}
      <CoachingChat
        sessionId={sessionId}
        overallScore={overallScore}
        scores={scores}
        feedback={feedback}
        fullTranscript={fullTranscript}
        saleClosed={saleClosed}
        virtualEarnings={virtualEarnings}
      />

      {/* Patterns - "What patterns should I recognize?" */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm uppercase tracking-[0.25em] text-slate-500">AI-Powered Insights</h3>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Strengths */}
          {feedback.strengths.length > 0 && (
            <div className="rounded-3xl bg-gradient-to-br from-emerald-900/20 to-green-800/20 backdrop-blur-xl border border-emerald-500/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-6 h-6 text-emerald-400" />
                <h4 className="font-bold text-lg text-white">Your Strengths</h4>
              </div>
              <ul className="space-y-3">
                {feedback.strengths.map((strength, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-base font-medium text-white">{strength}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {feedback.improvements.length > 0 && (
            <div className="rounded-3xl bg-gradient-to-br from-amber-900/20 to-orange-800/20 backdrop-blur-xl border border-amber-500/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-amber-400" />
                <h4 className="font-bold text-lg text-white">Growth Opportunities</h4>
              </div>
              <ul className="space-y-3">
                {feedback.improvements.map((improvement, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-base font-medium text-white">{improvement}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actionable Tips */}
        {feedback.specific_tips.length > 0 && (
          <div className="mt-6 rounded-3xl bg-gradient-to-br from-blue-900/20 to-indigo-800/20 backdrop-blur-xl border border-blue-500/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-blue-400" />
              <h4 className="font-bold text-lg text-white">Actionable Tips for Next Session</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {feedback.specific_tips.map((tip, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/5"
                >
                  <Zap className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-base font-medium text-white">{tip}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </section>

    </div>
  )
}

