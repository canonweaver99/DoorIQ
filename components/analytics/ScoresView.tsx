'use client'

import { Users, Target, Shield, HandshakeIcon, DollarSign, ChevronDown, Sparkles, Lightbulb, Loader2, Mic, MessageSquare, HelpCircle, Ear, TrendingUp, Activity, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import EarningsBreakdown from './EarningsBreakdown'
import ObjectionAnalysis from './ObjectionAnalysis'
import CoachingPlan from './CoachingPlan'
import ConversationDynamics from './ConversationDynamics'
import FailureAnalysis from './FailureAnalysis'

interface ScoresViewProps {
  overallScore: number
  scores: {
    rapport: number
    discovery: number
    objection_handling: number
    closing: number
    safety: number
    introduction: number
    listening: number
    // New enhanced metrics
    speaking_pace?: number
    filler_words?: number
    question_ratio?: number
    active_listening?: number
    assumptive_language?: number
  }
  enhancedMetrics?: {
    speaking_pace?: {
      avg_wpm: number
      pace_variation: string
      rushed_sections: number[]
      clear_sections: number[]
      score_breakdown: string
    }
    filler_words?: {
      total_count: number
      per_minute: number
      common_fillers: Record<string, number>
      clusters: Array<{ line_range: string; density: string }>
      score_breakdown: string
    }
    question_ratio?: {
      percentage: number
      total_questions: number
      open_ended: number
      closed: number
      by_category: Record<string, number>
      score_breakdown: string
    }
    active_listening?: {
      acknowledgments: number
      empathy_statements: number
      paraphrasing_count: number
      building_on_responses: number
      score_breakdown: string
    }
    assumptive_language?: {
      assumptive_phrases: number
      tentative_phrases: number
      confidence_ratio: number
      strong_closes: string[]
      score_breakdown: string
    }
  }
  feedback: {
    strengths: string[]
    improvements: string[]
    specific_tips: string[]
  }
  virtualEarnings: number
  earningsData?: any
  dealDetails?: any
  objectionAnalysis?: any
  coachingPlan?: any
  conversationDynamics?: any
  failureAnalysis?: any
  saleClosed?: boolean
  insightsByCategory?: Record<string, Array<{ quote: string; impact: string }>>
  grading?: boolean
}

export default function ScoresView({ overallScore, scores, feedback, virtualEarnings, earningsData, dealDetails, objectionAnalysis, coachingPlan, conversationDynamics, failureAnalysis, saleClosed = false, insightsByCategory = {}, grading = false, enhancedMetrics }: ScoresViewProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981' // emerald
    if (score >= 60) return '#3b82f6' // blue
    if (score >= 40) return '#f59e0b' // amber
    return '#ef4444' // red
  }

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-blue-400'
    if (score >= 40) return 'text-amber-400'
    return 'text-red-400'
  }

  const getGradeLetter = (score: number) => {
    if (score >= 95) return 'A+'
    if (score >= 90) return 'A'
    if (score >= 85) return 'B+'
    if (score >= 80) return 'B'
    if (score >= 75) return 'C+'
    if (score >= 70) return 'C'
    if (score >= 65) return 'D'
    return 'F'
  }

  const mainMetrics = [
    {
      id: 'rapport',
      name: 'Rapport Building',
      score: scores.rapport,
      icon: Users,
    },
    {
      id: 'discovery',
      name: 'Discovery',
      score: scores.discovery,
      icon: Target,
    },
    {
      id: 'objection_handling',
      name: 'Objection Handling',
      score: scores.objection_handling,
      icon: Shield,
    },
    {
      id: 'closing',
      name: 'Closing Technique',
      score: scores.closing,
      icon: HandshakeIcon,
    }
  ]

  const circumference = 2 * Math.PI * 90
  const strokeDashoffset = circumference - (overallScore / 100) * circumference

  const getMetricBorder = (score: number) => {
    if (score >= 80) return 'border-emerald-500/30'
    if (score >= 60) return 'border-blue-500/30'
    if (score >= 40) return 'border-amber-500/30'
    return 'border-red-500/30'
  }

  const getIconColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-blue-400'
    if (score >= 40) return 'text-amber-400'
    return 'text-red-400'
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Overall Score Section */}
      <section className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl sm:rounded-3xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 sm:gap-8 lg:gap-10">
          <div className="relative flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative w-48 h-48 sm:w-56 sm:h-56 lg:w-60 lg:h-60 flex items-center justify-center"
            >
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 220 220">
                <circle
                  cx="110"
                  cy="110"
                  r="90"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="11"
                  fill="none"
                />
                <motion.circle
                  cx="110"
                  cy="110"
                  r="90"
                  stroke={getScoreColor(overallScore)}
                  strokeWidth="11"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                />
              </svg>
              <div className="relative text-center space-y-1.5 sm:space-y-2">
                <div className={`text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight ${getScoreTextColor(overallScore)}`}>
                  {overallScore}
                </div>
                <div className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-[0.15em]">Score</div>
                <div
                  className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${getScoreTextColor(overallScore)}`}
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${getScoreColor(overallScore)}40` }}
                >
                  {getGradeLetter(overallScore)} Grade
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex-1 space-y-4 sm:space-y-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-slate-500">
                Performance Summary
              </div>
              <p className="text-slate-200 text-base sm:text-lg leading-relaxed">
                {overallScore >= 80
                  ? `Outstanding work. ${feedback.strengths[0] || 'You maintained strong control throughout.'}`
                  : overallScore >= 60
                  ? `Solid foundation with room to grow. ${feedback.improvements[0] ? `Focus on ${feedback.improvements[0].toLowerCase()}.` : 'Keep refining your approach.'}`
                  : `Every challenging session builds skill. ${feedback.improvements[0] || 'Concentrate on opening, discovery, and objection handling fundamentals.'}`
                }
              </p>
            </div>

          </div>
        </div>

        {grading && (
          <div className="mt-8 flex items-center gap-3 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Finalizing grading insights...
          </div>
        )}
      </section>

      {/* Earnings Breakdown */}
      {(virtualEarnings > 0 || saleClosed) && (
        <EarningsBreakdown 
          earningsData={earningsData || {}}
          dealDetails={dealDetails || {}}
          saleClosed={saleClosed}
        />
      )}

      {/* Conversation Dynamics */}
      {conversationDynamics && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-purple-400" />
            <div className="text-sm uppercase tracking-[0.25em] text-slate-500">
              Conversation Dynamics
            </div>
          </div>
          <ConversationDynamics conversationDynamics={conversationDynamics} />
        </section>
      )}

      {/* Failure Analysis */}
      {failureAnalysis && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-red-400" />
            <div className="text-sm uppercase tracking-[0.25em] text-slate-500">
              Critical Analysis
            </div>
          </div>
          <FailureAnalysis failureAnalysis={failureAnalysis} />
        </section>
      )}

      {/* Objection Analysis */}
      {objectionAnalysis && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-orange-400" />
            <div className="text-sm uppercase tracking-[0.25em] text-slate-500">
              Objection Handling Analysis
            </div>
          </div>
          <ObjectionAnalysis objectionAnalysis={objectionAnalysis} />
        </section>
      )}

      {/* Coaching Plan */}
      {coachingPlan && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-indigo-400" />
            <div className="text-sm uppercase tracking-[0.25em] text-slate-500">
              Your Coaching Plan
            </div>
          </div>
          <CoachingPlan coachingPlan={coachingPlan} />
        </section>
      )}

      {/* Main Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {mainMetrics.map((metric, idx) => {
          const Icon = metric.icon
          const quotes = insightsByCategory?.[metric.id] || []

          return (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={`bg-slate-900/80 backdrop-blur-xl border ${getMetricBorder(metric.score)} rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg`}
            >
              <div
                className="h-1 w-full"
                style={{ 
                  background: `linear-gradient(90deg, ${getScoreColor(metric.score)}, transparent)` 
                }}
              />
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/5 border border-white/10">
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${getIconColor(metric.score)}`} />
                    </div>
                    <div>
                      <div className={`text-2xl sm:text-3xl font-semibold ${getScoreTextColor(metric.score)}`}>{metric.score}%</div>
                      <div className="text-xs sm:text-sm text-slate-400">{metric.name}</div>
                    </div>
                  </div>
                </div>

                <div className="h-2 rounded-full bg-white/5 overflow-hidden backdrop-blur">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.score}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1 + 0.3 }}
                    style={{ 
                      background: `linear-gradient(90deg, ${getScoreColor(metric.score)}, ${getScoreColor(metric.score)}cc)`
                    }}
                  />
                </div>

                {quotes.length > 0 && (
                  <details className="mt-4 sm:mt-5 group">
                    <summary className="flex items-center justify-between text-xs sm:text-sm text-slate-400 hover:text-white transition-colors cursor-pointer touch-manipulation">
                      <span>View highlights ({quotes.length})</span>
                      <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="mt-3 sm:mt-4 space-y-2">
                      {quotes.map((item, idx) => (
                        <div key={idx} className="rounded-lg sm:rounded-xl bg-white/[0.03] border border-white/5 px-3 sm:px-4 py-2.5 sm:py-3">
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">"{item.quote}"</p>
                          <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 sm:mt-2">{item.impact}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </motion.div>
          )
        })}
      </section>

      {/* Enhanced Metrics Section */}
      {(scores.speaking_pace !== undefined || scores.filler_words !== undefined || 
        scores.question_ratio !== undefined || scores.active_listening !== undefined || 
        scores.assumptive_language !== undefined) && (
        <section className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl sm:rounded-3xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 shadow-xl">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            <div className="text-xs sm:text-sm uppercase tracking-[0.25em] text-slate-500">
              Enhanced Performance Metrics
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {scores.speaking_pace !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                    <span className="text-xs sm:text-sm text-slate-300">Speaking Pace</span>
                  </div>
                  <span className={`text-xl sm:text-2xl font-semibold ${getScoreTextColor(scores.speaking_pace)}`}>
                    {scores.speaking_pace}%
                  </span>
                </div>
                {enhancedMetrics?.speaking_pace && (
                  <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs text-slate-400">
                    <div>Avg: {enhancedMetrics.speaking_pace.avg_wpm} WPM</div>
                    <div className="text-slate-500">{enhancedMetrics.speaking_pace.score_breakdown}</div>
                  </div>
                )}
              </motion.div>
            )}

            {scores.filler_words !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                    <span className="text-xs sm:text-sm text-slate-300">Filler Words</span>
                  </div>
                  <span className={`text-xl sm:text-2xl font-semibold ${scores.filler_words > 10 ? 'text-red-400' : scores.filler_words > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {scores.filler_words}
                  </span>
                </div>
                <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs text-slate-400">
                  <div className="text-slate-500">-{scores.filler_words}% overall score penalty</div>
                  {enhancedMetrics?.filler_words && (
                    <>
                      <div>{enhancedMetrics.filler_words.per_minute?.toFixed(1)}/min average</div>
                      {Object.keys(enhancedMetrics.filler_words.common_fillers || {}).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.entries(enhancedMetrics.filler_words.common_fillers).map(([word, count]) => (
                            <span key={word} className="px-2 py-0.5 rounded-full bg-slate-800/50 text-slate-400 text-[10px]">
                              {word}: {count}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {scores.question_ratio !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                    <span className="text-xs sm:text-sm text-slate-300">Question Ratio</span>
                  </div>
                  <span className={`text-xl sm:text-2xl font-semibold ${getScoreTextColor(scores.question_ratio)}`}>
                    {scores.question_ratio}%
                  </span>
                </div>
                {enhancedMetrics?.question_ratio && (
                  <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs text-slate-400">
                    <div>{enhancedMetrics.question_ratio.percentage}% questions</div>
                    <div className="text-slate-500">{enhancedMetrics.question_ratio.score_breakdown}</div>
                  </div>
                )}
              </motion.div>
            )}

            {scores.active_listening !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Ear className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                    <span className="text-xs sm:text-sm text-slate-300">Active Listening</span>
                  </div>
                  <span className={`text-xl sm:text-2xl font-semibold ${getScoreTextColor(scores.active_listening)}`}>
                    {scores.active_listening}%
                  </span>
                </div>
                {enhancedMetrics?.active_listening && (
                  <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs text-slate-400">
                    <div>{enhancedMetrics.active_listening.acknowledgments} acknowledgments</div>
                    <div className="text-slate-500">{enhancedMetrics.active_listening.score_breakdown}</div>
                  </div>
                )}
              </motion.div>
            )}

            {scores.assumptive_language !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                    <span className="text-xs sm:text-sm text-slate-300">Assumptive Language</span>
                  </div>
                  <span className={`text-xl sm:text-2xl font-semibold ${getScoreTextColor(scores.assumptive_language)}`}>
                    {scores.assumptive_language}%
                  </span>
                </div>
                {enhancedMetrics?.assumptive_language && (
                  <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs text-slate-400">
                    <div>Confidence: {(enhancedMetrics.assumptive_language.confidence_ratio * 100).toFixed(0)}%</div>
                    <div className="text-slate-500">{enhancedMetrics.assumptive_language.score_breakdown}</div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* Feedback Section */}
      {(feedback.strengths.length > 0 || feedback.improvements.length > 0) && (
        <section className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl sm:rounded-3xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 shadow-xl">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            <div className="text-xs sm:text-sm uppercase tracking-[0.25em] text-slate-500">
              Session Highlights
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-4 sm:mb-5">
            <span className="text-emerald-400">Pros</span>
            <span className="w-px h-3 bg-slate-700" />
            <span className="text-rose-400">Cons</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
            {feedback.strengths.map((text, index) => (
              <motion.div
                key={`strength-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="rounded-lg sm:rounded-xl px-3 sm:px-4 py-3 sm:py-4 border border-emerald-500/20 bg-emerald-500/5"
                style={{ 
                  borderLeft: '3px solid rgba(16,185,129,0.5)'
                }}
              >
                <div className="text-sm sm:text-base text-emerald-100 leading-relaxed">
                  {text}
                </div>
              </motion.div>
            ))}
            {feedback.improvements.map((text, index) => (
              <motion.div
                key={`improvement-${index}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="rounded-lg sm:rounded-xl px-3 sm:px-4 py-3 sm:py-4 border border-rose-500/20 bg-rose-500/5"
                style={{ 
                  borderLeft: '3px solid rgba(239,68,68,0.5)'
                }}
              >
                <div className="text-sm sm:text-base text-rose-100 leading-relaxed">
                  {text}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Pro Tips Section */}
      {feedback.specific_tips.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-2xl sm:rounded-3xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 border border-purple-500/30 text-center space-y-4 sm:space-y-5 shadow-xl"
          style={{ 
            background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.12))',
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="inline-flex items-center justify-center p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/10 border border-white/20 mb-1">
            <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-purple-200" />
          </div>
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-purple-300/80">Pro Tips</div>
          <h3 className="text-xl sm:text-2xl font-semibold bg-gradient-to-b from-white to-slate-200 bg-clip-text text-transparent">
            High-impact adjustments for next session
          </h3>
          <div className="grid grid-cols-1 gap-2.5 sm:gap-3 max-w-2xl mx-auto text-left">
            {feedback.specific_tips.map((tip, index) => (
              <div 
                key={index} 
                className="rounded-lg sm:rounded-xl border border-white/20 bg-white/5 px-4 sm:px-5 py-3 sm:py-4 text-sm sm:text-base text-slate-100 leading-relaxed backdrop-blur-sm"
              >
                {tip}
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Response Quality Legend */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center justify-center text-[10px] sm:text-xs">
        <span className="uppercase tracking-[0.25em] text-slate-500 mr-1 sm:mr-2">Response Quality</span>
        <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-white border border-emerald-500/30" style={{ background: 'rgba(16,185,129,0.2)' }}>Excellent</span>
        <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-white border border-blue-500/30" style={{ background: 'rgba(59,130,246,0.2)' }}>Good</span>
        <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-white border border-amber-500/30" style={{ background: 'rgba(245,158,11,0.2)' }}>Average</span>
        <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-white border border-red-500/30" style={{ background: 'rgba(239,68,68,0.2)' }}>Needs Work</span>
      </div>
    </div>
  )
}