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
    if (score >= 80) return '#10b981' // green
    if (score >= 60) return '#f59e0b' // amber
    return '#ef4444' // red
  }

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-amber-500'
    return 'text-red-500'
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

  const feedbackItems = [
    ...feedback.strengths.map((text) => ({ type: 'strength', text })),
    ...feedback.improvements.map((text) => ({ type: 'improvement', text })),
  ]

  const getMetricAccent = (score: number) => {
    if (score >= 80) return 'rgba(16,185,129,0.3)'
    if (score >= 60) return 'rgba(245,158,11,0.3)'
    return 'rgba(239,68,68,0.3)'
  }

  const getMetricTint = (score: number) => {
    if (score >= 80) return 'rgba(16,185,129,0.05)'
    if (score >= 60) return 'rgba(245,158,11,0.05)'
    return 'rgba(239,68,68,0.05)'
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-[#0c0c0c] border border-gray-800 rounded-3xl px-8 py-10">
        <div className="flex flex-col lg:flex-row lg:items-center gap-10">
          <div className="relative flex items-center justify-center">
            <div
              className="absolute inset-0 blur-2xl opacity-60"
              style={{
                background: `radial-gradient(circle at center, ${getScoreColor(overallScore)}33, transparent 65%)`
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
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="12"
                  fill="none"
                />
                <motion.circle
                  cx="110"
                  cy="110"
                  r="90"
                  stroke={getScoreColor(overallScore)}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.1, ease: 'easeOut' }}
                />
              </svg>
              <div className="relative text-center space-y-2">
                <div className={`text-6xl font-semibold tracking-tight ${getScoreTextColor(overallScore)}`}>
                  {overallScore}
                </div>
                <div className="text-gray-500 text-sm uppercase tracking-widest">Score</div>
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getScoreTextColor(overallScore)} bg-white/5`}
                >
                  {getGradeLetter(overallScore)} Grade
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-gray-500">
                Performance Summary
              </div>
              <p className="text-gray-300 text-lg leading-relaxed max-w-2xl">
                {overallScore >= 80
                  ? `Outstanding performance. ${feedback.strengths[0] || 'You maintained strong control of the conversation.'}`
                  : overallScore >= 60
                  ? `Solid effort with momentum building. ${feedback.improvements[0] ? `Focus on ${feedback.improvements[0].toLowerCase()}.` : 'Look for opportunities to tighten your flow.'}`
                  : `Good reps come from challenging sessions. ${feedback.improvements[0] || 'Concentrate on the opening, discovery and objection handling fundamentals.'}`
                }
              </p>
            </div>

            {virtualEarnings > 0 && (
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl border border-green-500/30 bg-green-500/10 text-green-400 font-medium">
                <DollarSign className="w-4 h-4" />
                ${virtualEarnings.toFixed(2)} virtual earnings this session
              </div>
            )}
          </div>
        </div>

        {grading && (
          <div className="mt-8 flex items-center gap-3 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Finalizing grading insights...
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mainMetrics.map((metric) => {
          const Icon = metric.icon
          const quotes = insightsByCategory?.[metric.id] || []
          const accent = getMetricAccent(metric.score)
          const tint = getMetricTint(metric.score)

          return (
            <div
              key={metric.id}
              className="rounded-3xl border border-gray-800 bg-[#0c0c0c] overflow-hidden"
              style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.02)` }}
            >
              <div
                className="h-[3px] w-full"
                style={{ background: accent }}
              />
              <div className="p-6" style={{ background: tint ? `linear-gradient(180deg, ${tint} 0%, transparent 100%)` : undefined }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                      <Icon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold text-white">{metric.score}%</div>
                      <div className="text-sm text-gray-500">{metric.name}</div>
                    </div>
                  </div>
                </div>

                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${metric.score}%`, background: accent }}
                  />
                </div>

                {quotes.length > 0 && (
                  <details className="mt-5 group">
                    <summary className="flex items-center justify-between text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
                      <span>Transcript highlights ({quotes.length})</span>
                      <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="mt-4 space-y-3">
                      {quotes.map((item, idx) => (
                        <div key={idx} className="rounded-2xl border border-white/5 bg-white/3 px-4 py-3">
                          <p className="text-sm text-gray-200">“{item.quote}”</p>
                          <p className="text-xs text-gray-500 mt-2">{item.impact}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          )
        })}
      </section>

      {feedbackItems.length > 0 && (
        <section className="bg-[#0c0c0c] border border-gray-800 rounded-3xl px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-gray-500">
              <Sparkles className="w-4 h-4" />
              Session Highlights
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {feedbackItems.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/5 px-4 py-4"
                style={{
                  background: item.type === 'strength' ? 'rgba(16,185,129,0.05)' : 'rgba(245,158,11,0.05)',
                  borderLeft: item.type === 'strength' ? '3px solid rgba(16,185,129,0.4)' : '3px solid rgba(245,158,11,0.4)'
                }}
              >
                <div className="text-sm text-gray-200 leading-relaxed">
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {feedback.specific_tips.length > 0 && (
        <section
          className="rounded-3xl px-8 py-8 border border-purple-500/30"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.08))' }}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/20">
              <Lightbulb className="w-5 h-5 text-purple-200" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm uppercase tracking-[0.3em] text-purple-200/80">Pro Tips</div>
                <h3 className="text-2xl font-semibold text-white mt-2">High-impact adjustments for next session</h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {feedback.specific_tips.map((tip, index) => (
                  <div key={index} className="rounded-2xl border border-white/20 bg-white/5 px-4 py-4 text-gray-200 leading-relaxed">
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-2 items-center text-xs text-gray-400">
        <span className="uppercase tracking-[0.3em] text-gray-500 mr-2">Response Quality</span>
        <span className="px-3 py-1 rounded-full text-white" style={{ background: 'rgba(16,185,129,0.25)' }}>Excellent</span>
        <span className="px-3 py-1 rounded-full text-white" style={{ background: 'rgba(59,130,246,0.25)' }}>Good</span>
        <span className="px-3 py-1 rounded-full text-white" style={{ background: 'rgba(245,158,11,0.25)' }}>Average</span>
        <span className="px-3 py-1 rounded-full text-white" style={{ background: 'rgba(239,68,68,0.25)' }}>Needs Work</span>
      </div>
    </div>
  )
}