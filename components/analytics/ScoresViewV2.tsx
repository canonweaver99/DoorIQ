'use client'

import { useState, useEffect } from 'react'
import { Users, Target, Shield, HandshakeIcon, DollarSign, Download, Share2, BookOpen, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Zap, Clock, Award, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import SessionTimeline from './SessionTimeline'

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
  agentName?: string
  durationSeconds?: number
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
  agentName = 'AI Agent',
  durationSeconds = 600
}: ScoresViewV2Props) {
  const [animatedEarnings, setAnimatedEarnings] = useState(0)

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

  // Enhanced categorization of key moments
  const keyMoments: any[] = []
  
  // Categorize lines by technique/category
  lineRatings.forEach(line => {
    if (!line.timestamp || line.timestamp === '00:00') return
    
    const techniques = line.techniques_used || []
    const category = line.category || 'general'
    
    // Rapport building moments
    if (category === 'rapport' && line.effectiveness !== 'poor') {
      keyMoments.push({
        type: 'win',
        line: line.line_number,
        timestamp: line.timestamp,
        title: '🤝 Rapport Building',
        description: techniques.join(', ') || 'Building connection with customer',
        score: line.score,
        impact: line.effectiveness === 'excellent' ? 'high' : 'medium'
      })
    }
    
    // Discovery questions
    if (category === 'discovery' && line.effectiveness !== 'poor') {
      keyMoments.push({
        type: 'signal',
        line: line.line_number,
        timestamp: line.timestamp,
        title: '❓ Discovery Question',
        description: techniques.join(', ') || 'Gathering customer information',
        score: line.score,
        impact: 'medium'
      })
    }
    
    // Objections
    if (category === 'objection_handling') {
      keyMoments.push({
        type: line.effectiveness === 'poor' ? 'critical' : line.effectiveness === 'excellent' ? 'win' : 'opportunity',
        line: line.line_number,
        timestamp: line.timestamp,
        title: line.effectiveness === 'excellent' ? '✅ Objection Overcome' : '🚫 Objection Raised',
        description: line.improvement_notes || techniques.join(', ') || 'Handling customer concern',
        score: line.score,
        impact: 'high'
      })
    }
    
    // Closing attempts
    if (category === 'closing') {
      keyMoments.push({
        type: line.effectiveness === 'excellent' ? 'win' : 'opportunity',
        line: line.line_number,
        timestamp: line.timestamp,
        title: line.effectiveness === 'excellent' ? '🎯 Close Success' : '🎯 Close Attempt',
        description: techniques.join(', ') || line.improvement_notes || 'Attempting to close',
        score: line.score,
        impact: 'high'
      })
    }
    
    // Excellent lines that aren't already categorized
    if (line.effectiveness === 'excellent' && !['rapport', 'discovery', 'objection_handling', 'closing'].includes(category)) {
      keyMoments.push({
        type: 'win',
        line: line.line_number,
        timestamp: line.timestamp,
        title: '✨ Value Proposition',
        description: techniques.join(', ') || 'Strong performance',
        score: line.score,
        impact: 'medium'
      })
    }
    
    // Poor lines for coaching
    if (line.effectiveness === 'poor' || (line.effectiveness === 'average' && line.missed_opportunities?.length > 0)) {
      keyMoments.push({
        type: 'opportunity',
        line: line.line_number,
        timestamp: line.timestamp,
        title: '💡 Coaching Moment',
        description: line.improvement_notes || line.missed_opportunities?.[0] || 'Could be improved',
        score: line.score,
        impact: line.effectiveness === 'poor' ? 'high' : 'medium'
      })
    }
  })

  // Add buying signals from conversation dynamics
  conversationDynamics?.buying_signals?.forEach((signal: any, idx: number) => {
    const signalText = typeof signal === 'string' ? signal : (signal.signal || signal.signal_description)
    const line = typeof signal === 'object' ? signal.line : 0
    const timestamp = lineRatings[line]?.timestamp || '00:00'
    
    if (timestamp !== '00:00') {
      keyMoments.push({
        type: 'signal',
        line,
        timestamp,
        title: '✨ Buying Signal',
        description: signalText,
        score: 0,
        impact: 'medium'
      })
    }
  })

  // Sort by timestamp
  keyMoments.sort((a, b) => {
    const aTime = parseTimestamp(a.timestamp)
    const bTime = parseTimestamp(b.timestamp)
    return aTime - bTime
  })
  
  function parseTimestamp(ts: string): number {
    const [mins, secs] = ts.split(':').map(Number)
    return (mins || 0) * 60 + (secs || 0)
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

              {/* Filler Word Penalty */}
              {scores.filler_words && scores.filler_words > 0 && (
                <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-300">
                      {scores.filler_words} filler words detected = <strong>-{scores.filler_words}% penalty</strong> applied
                    </span>
                  </div>
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
                      <div className="text-xs text-slate-400">{metric.name}</div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Earnings Card */}
          {saleClosed && virtualEarnings > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-3xl bg-gradient-to-br from-emerald-900/40 to-green-800/40 backdrop-blur-xl border border-emerald-500/30 p-8 overflow-hidden"
            >
              {/* Sparkle background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-green-400/20 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-6 h-6 text-emerald-400" />
                  <span className="text-sm uppercase tracking-[0.25em] text-emerald-400">You Earned</span>
                </div>
                
                <div className="text-5xl font-bold text-white mb-6">
                  ${animatedEarnings.toFixed(2)}
                </div>

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
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Enhanced Timeline - "What specific moments mattered?" */}
      {keyMoments.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm uppercase tracking-[0.25em] text-slate-500">Session Timeline</h3>
          </div>
          
          <SessionTimeline
            duration={durationSeconds}
            events={keyMoments}
            lineRatings={lineRatings}
            customerName="Austin Rodriguez"
            salesRepName="Tyler"
            dealOutcome={saleClosed ? {
              closed: true,
              amount: dealDetails?.base_price || dealDetails?.total_contract_value || 0,
              product: dealDetails?.product_sold || 'Service'
            } : undefined}
          />
        </section>
      )}

      {/* Patterns - "What patterns should I recognize?" */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm uppercase tracking-[0.25em] text-slate-500">AI-Powered Insights</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strengths */}
          {feedback.strengths.length > 0 && (
            <div className="rounded-3xl bg-gradient-to-br from-emerald-900/20 to-green-800/20 backdrop-blur-xl border border-emerald-500/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-5 h-5 text-emerald-400" />
                <h4 className="font-semibold text-white">Your Strengths</h4>
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
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-white/90">{strength}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {feedback.improvements.length > 0 && (
            <div className="rounded-3xl bg-gradient-to-br from-amber-900/20 to-orange-800/20 backdrop-blur-xl border border-amber-500/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <h4 className="font-semibold text-white">Growth Opportunities</h4>
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
                    <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-white/90">{improvement}</span>
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
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h4 className="font-semibold text-white">Actionable Tips for Next Session</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {feedback.specific_tips.map((tip, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/5"
                >
                  <Zap className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-white/90">{tip}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Simplified Bottom Action Bar */}
      <section className="sticky bottom-6 z-20">
        <div className="rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 hover:from-purple-600/30 hover:to-pink-600/30 transition-colors text-sm text-white font-medium">
                <Download className="w-4 h-4" />
                Export & Share
              </button>
              <Link
                href="/sessions"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-slate-700 hover:bg-white/10 transition-colors text-sm text-slate-300"
              >
                Back to Sessions
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 rounded-xl bg-white/5 border border-slate-700 hover:bg-white/10 transition-colors" title="Previous session">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button className="p-2 rounded-xl bg-white/5 border border-slate-700 hover:bg-white/10 transition-colors" title="Next session">
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

