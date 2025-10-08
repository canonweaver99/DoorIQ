'use client'

import { Users, Target, Shield, HandshakeIcon, DollarSign, ChevronDown, Sparkles, Lightbulb, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

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
  }
  feedback: {
    strengths: string[]
    improvements: string[]
    specific_tips: string[]
  }
  virtualEarnings: number
  insightsByCategory?: Record<string, Array<{ quote: string; impact: string }>>
  grading?: boolean
}

export default function ScoresView({ overallScore, scores, feedback, virtualEarnings, insightsByCategory = {}, grading = false }: ScoresViewProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#a855f7' // purple
    if (score >= 60) return '#ec4899' // pink
    if (score >= 40) return '#f59e0b' // amber
    return '#ef4444' // red
  }

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-purple-400'
    if (score >= 60) return 'text-pink-400'
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
    if (score >= 80) return 'border-purple-500/30'
    if (score >= 60) return 'border-pink-500/30'
    if (score >= 40) return 'border-amber-500/30'
    return 'border-red-500/30'
  }

  const getMetricGlow = (score: number) => {
    if (score >= 80) return '0 10px 40px -25px rgba(168,85,247,0.4)'
    if (score >= 60) return '0 10px 40px -25px rgba(236,72,153,0.4)'
    if (score >= 40) return '0 10px 40px -25px rgba(245,158,11,0.3)'
    return '0 10px 40px -25px rgba(239,68,68,0.3)'
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Overall Score Section */}
      <section className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-3xl px-8 py-10 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center gap-10">
          <div className="relative flex items-center justify-center">
            <div
              className="absolute inset-0 blur-3xl opacity-40"
              style={{
                background: `radial-gradient(circle at center, ${getScoreColor(overallScore)}, transparent 70%)`
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative w-60 h-60 flex items-center justify-center"
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
                  style={{
                    filter: `drop-shadow(0 0 12px ${getScoreColor(overallScore)}88)`
                  }}
                />
              </svg>
              <div className="relative text-center space-y-2">
                <div className={`text-6xl font-bold tracking-tight ${getScoreTextColor(overallScore)}`}>
                  {overallScore}
                </div>
                <div className="text-slate-500 text-xs uppercase tracking-[0.15em]">Score</div>
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getScoreTextColor(overallScore)}`}
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${getScoreColor(overallScore)}40` }}
                >
                  {getGradeLetter(overallScore)} Grade
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Performance Summary
              </div>
              <p className="text-slate-200 text-lg leading-relaxed">
                {overallScore >= 80
                  ? `Outstanding work. ${feedback.strengths[0] || 'You maintained strong control throughout.'}`
                  : overallScore >= 60
                  ? `Solid foundation with room to grow. ${feedback.improvements[0] ? `Focus on ${feedback.improvements[0].toLowerCase()}.` : 'Keep refining your approach.'}`
                  : `Every challenging session builds skill. ${feedback.improvements[0] || 'Concentrate on opening, discovery, and objection handling fundamentals.'}`
                }
              </p>
            </div>

            {virtualEarnings > 0 && (
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-purple-200 font-medium shadow-lg shadow-purple-500/20">
                <DollarSign className="w-4 h-4" />
                ${virtualEarnings.toFixed(2)} virtual earnings
              </div>
            )}
          </div>
        </div>

        {grading && (
          <div className="mt-8 flex items-center gap-3 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Finalizing grading insights...
          </div>
        )}
      </section>

      {/* Main Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mainMetrics.map((metric, idx) => {
          const Icon = metric.icon
          const quotes = insightsByCategory?.[metric.id] || []

          return (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={`bg-slate-900/80 backdrop-blur-xl border ${getMetricBorder(metric.score)} rounded-3xl overflow-hidden`}
              style={{ boxShadow: getMetricGlow(metric.score) }}
            >
              <div
                className="h-1 w-full"
                style={{ 
                  background: `linear-gradient(90deg, ${getScoreColor(metric.score)}, transparent)` 
                }}
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <Icon className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className={`text-3xl font-semibold ${getScoreTextColor(metric.score)}`}>{metric.score}%</div>
                      <div className="text-sm text-slate-400">{metric.name}</div>
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
                      background: `linear-gradient(90deg, ${getScoreColor(metric.score)}, ${getScoreColor(metric.score)}cc)`,
                      boxShadow: `0 0 10px ${getScoreColor(metric.score)}66`
                    }}
                  />
                </div>

                {quotes.length > 0 && (
                  <details className="mt-5 group">
                    <summary className="flex items-center justify-between text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">
                      <span>View highlights ({quotes.length})</span>
                      <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="mt-4 space-y-2">
                      {quotes.map((item, idx) => (
                        <div key={idx} className="rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3">
                          <p className="text-sm text-slate-200 leading-relaxed">"{item.quote}"</p>
                          <p className="text-xs text-slate-500 mt-2">{item.impact}</p>
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

      {/* Feedback Section */}
      {(feedback.strengths.length > 0 || feedback.improvements.length > 0) && (
        <section className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-3xl px-8 py-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <div className="text-sm uppercase tracking-[0.25em] text-slate-500">
              Session Highlights
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] mb-5">
            <span className="text-emerald-400">Pros</span>
            <span className="w-px h-3 bg-slate-700" />
            <span className="text-rose-400">Cons</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {feedback.strengths.map((text, index) => (
              <motion.div
                key={`strength-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="rounded-xl px-4 py-4 border border-emerald-500/20 bg-emerald-500/5"
                style={{ 
                  boxShadow: '0 8px 25px -15px rgba(16,185,129,0.3)',
                  borderLeft: '3px solid rgba(16,185,129,0.5)'
                }}
              >
                <div className="text-sm text-emerald-100 leading-relaxed">
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
                className="rounded-xl px-4 py-4 border border-rose-500/20 bg-rose-500/5"
                style={{ 
                  boxShadow: '0 8px 25px -15px rgba(239,68,68,0.3)',
                  borderLeft: '3px solid rgba(239,68,68,0.5)'
                }}
              >
                <div className="text-sm text-rose-100 leading-relaxed">
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
          className="rounded-3xl px-8 py-10 border border-purple-500/30 text-center space-y-5 shadow-2xl shadow-purple-500/10"
          style={{ 
            background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.12))',
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/10 border border-white/20 mb-1">
            <Lightbulb className="w-6 h-6 text-purple-200" />
          </div>
          <div className="text-xs uppercase tracking-[0.3em] text-purple-300/80">Pro Tips</div>
          <h3 className="text-2xl font-semibold bg-gradient-to-b from-white to-slate-200 bg-clip-text text-transparent">
            High-impact adjustments for next session
          </h3>
          <div className="grid grid-cols-1 gap-3 max-w-2xl mx-auto text-left">
            {feedback.specific_tips.map((tip, index) => (
              <div 
                key={index} 
                className="rounded-xl border border-white/20 bg-white/5 px-5 py-4 text-slate-100 leading-relaxed backdrop-blur-sm"
              >
                {tip}
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Response Quality Legend */}
      <div className="flex flex-wrap gap-2 items-center justify-center text-xs">
        <span className="uppercase tracking-[0.25em] text-slate-500 mr-2">Response Quality</span>
        <span className="px-3 py-1.5 rounded-full text-white border border-purple-500/30" style={{ background: 'rgba(168,85,247,0.2)' }}>Excellent</span>
        <span className="px-3 py-1.5 rounded-full text-white border border-pink-500/30" style={{ background: 'rgba(236,72,153,0.2)' }}>Good</span>
        <span className="px-3 py-1.5 rounded-full text-white border border-amber-500/30" style={{ background: 'rgba(245,158,11,0.2)' }}>Average</span>
        <span className="px-3 py-1.5 rounded-full text-white border border-red-500/30" style={{ background: 'rgba(239,68,68,0.2)' }}>Needs Work</span>
      </div>
    </div>
  )
}