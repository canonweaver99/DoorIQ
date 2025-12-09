'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, ArrowDown, DollarSign, Clock, XCircle, Info, TrendingUp, Trophy, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProgressRing } from './ProgressRing'

// Tooltip Component
function MetricTooltip({ children, content }: { children: React.ReactNode, content: string }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative inline-block">
      <div 
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="cursor-help"
      >
        {children}
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 border border-slate-700 rounded-lg shadow-xl text-xs text-gray-200 font-sans leading-relaxed"
          >
            {content}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-800 border-r border-b border-slate-700 rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface HeroSectionProps {
  overallScore: number
  vsUserAverage: number
  vsTeamAverage: number
  percentileLabel: string
  saleClosed: boolean
  virtualEarnings: number
  earningsData?: any
  dealDetails?: any
  quickVerdict?: string
  trends?: {
    rapport: number
    discovery: number
    objection_handling: number
    closing: number
  }
  currentScores?: {
    rapport: number
    discovery: number
    objection_handling: number
    closing: number
  }
  recentScores?: {
    overall?: number[]
    rapport?: number[]
    discovery?: number[]
    objection_handling?: number[]
    closing?: number[]
  }
  feedback?: {
    strengths?: string[]
    improvements?: string[]
    session_highlight?: string
  }
  failureAnalysis?: {
    critical_moments?: Array<{
      line: number
      event: string
      customer_reaction: string
      rep_recovery_attempted: boolean
      success: boolean
      better_approach: string
    }>
    point_of_no_return?: {
      line: number
      reason: string
      could_have_saved: boolean
      how: string
    }
    missed_pivots?: Array<{
      line: number
      opportunity: string
      suggested_pivot: string
    }>
    recovery_failures?: Array<{
      line: number
      attempt: string
      why_failed: string
      better_approach: string
    }>
  }
  voiceAnalysis?: {
    wpmTimeline?: Array<{ time: number; value: number }>
    volumeTimeline?: Array<{ time: number; value: number }>
  }
  instantMetrics?: {
    conversationBalance?: number
    closeAttempts?: number
  }
}

export function HeroSection({
  overallScore,
  vsUserAverage,
  vsTeamAverage,
  percentileLabel,
  saleClosed,
  virtualEarnings,
  earningsData,
  dealDetails,
  quickVerdict,
  trends = { rapport: 0, discovery: 0, objection_handling: 0, closing: 0 },
  currentScores,
  recentScores,
  failureAnalysis,
  voiceAnalysis,
  instantMetrics,
  feedback
}: HeroSectionProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#3b82f6'
    if (score >= 40) return '#f59e0b'
    return '#ef4444'
  }
  
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
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
  
  const getTrendText = (value: number) => {
    if (value > 0) return `+${value}% ↑`
    if (value < 0) return `${value}% ↓`
    return 'No change'
  }
  
  // Calculate earnings breakdown - prioritize closed_amount from earnings_data
  const dealValue = dealDetails?.total_contract_value || dealDetails?.base_price || 0
  // Use closed_amount from earnings_data if available, otherwise fall back to virtualEarnings
  const totalEarned = earningsData?.closed_amount || earningsData?.total_earned || virtualEarnings || 0
  
  // Calculate strengths for display in earnings card
  const strengths = currentScores ? (() => {
    const strengthList = []
    if (currentScores.rapport >= 80) strengthList.push({ name: 'Rapport Building', score: currentScores.rapport, diff: currentScores.rapport - 70 })
    if (currentScores.objection_handling >= 80) strengthList.push({ name: 'Objection Handling', score: currentScores.objection_handling, diff: currentScores.objection_handling - 70 })
    if (currentScores.discovery >= 75) strengthList.push({ name: 'Needs Discovery', score: currentScores.discovery, diff: currentScores.discovery - 65 })
    return strengthList
  })() : []
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 mb-8"
    >
      {/* Back Navigation */}
      <Link
        href="/sessions"
        className="inline-flex items-center text-gray-400 hover:text-gray-300 text-sm font-medium transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Sessions
      </Link>
      
      {/* Overall Performance Card - Old Grading Style */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-8 overflow-hidden mb-6">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Score and Info */}
            <div className="flex-[2]">
              <div className="mb-6">
                <div className="text-sm uppercase tracking-[0.25em] text-slate-500 mb-2 font-sans">AI-Powered Training Results</div>
                <h2 className="text-2xl font-bold text-white font-space mb-6">Overall Performance</h2>
                
                {/* Score and Circle - Moved below heading */}
                <div className="flex items-start gap-6 mb-6">
                  <div className="flex flex-col">
                    <div className={`text-6xl font-bold mb-1 font-space`} style={{ color: getScoreColor(overallScore) }}>
                      {overallScore}
                    </div>
                    <div className="text-sm text-slate-400 font-sans">Overall Score</div>
                    <div 
                      className="inline-block mt-2 px-4 py-1.5 rounded-full text-lg font-semibold font-space"
                      style={{ 
                        background: `${getScoreColor(overallScore)}20`,
                        color: getScoreColor(overallScore),
                        border: `1px solid ${getScoreColor(overallScore)}40`
                      }}
                    >
                      {getScoreGrade(overallScore)} Grade
                    </div>
                  </div>
                  <ProgressRing
                    value={overallScore}
                    max={100}
                    size={100}
                    strokeWidth={10}
                    color={getScoreColor(overallScore)}
                  />
                </div>
              </div>
              

              {/* Comparison Metrics - Increased font size */}
              <div className="space-y-3 text-base mb-6">
                <div className="flex items-center gap-2 text-gray-300">
                  {vsUserAverage > 0 ? (
                    <ArrowUp className="w-5 h-5 text-green-400" />
                  ) : vsUserAverage < 0 ? (
                    <ArrowDown className="w-5 h-5 text-red-400" />
                  ) : null}
                  <div className="flex-1">
                    <span className="text-lg">
                      vs Your Average: <span className={cn(
                        "font-semibold",
                        vsUserAverage >= 0 ? 'text-green-400' : 'text-red-400'
                      )}>{getTrendText(vsUserAverage)}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  {vsTeamAverage > 0 ? (
                    <ArrowUp className="w-5 h-5 text-green-400" />
                  ) : vsTeamAverage < 0 ? (
                    <ArrowDown className="w-5 h-5 text-red-400" />
                  ) : null}
                  <span className="text-lg">
                    vs Team Average: <span className={cn(
                      "font-semibold",
                      vsTeamAverage >= 0 ? 'text-green-400' : 'text-red-400'
                    )}>{getTrendText(vsTeamAverage)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-lg">
                    Percentile: <span className="text-white font-semibold font-sans">{percentileLabel} this week</span>
                  </span>
                  <MetricTooltip content="Your percentile rank shows how you compare to other users this week. Higher percentiles indicate better performance relative to your peers. This helps you understand your competitive position.">
                    <Info className="w-5 h-5 text-gray-500 hover:text-gray-300 transition-colors" />
                  </MetricTooltip>
                </div>
              </div>
            </div>
            
            {/* Right Column - Deal Status */}
            <div className="flex-[3] min-w-0">
              {/* Earnings Card */}
              <div className="h-full w-full">
                {/* Earnings Card - From Old Grading Page */}
                <div className={`relative rounded-3xl backdrop-blur-xl p-6 overflow-hidden flex flex-col justify-between w-full ${
                  saleClosed && virtualEarnings > 0
                    ? 'bg-gradient-to-br from-emerald-900/70 to-green-800/70 border-2 border-emerald-500/60'
                    : dealDetails?.next_step
                      ? 'bg-gradient-to-br from-amber-900/70 to-yellow-800/70 border-2 border-amber-500/60'
                      : 'bg-gradient-to-br from-red-900/70 to-rose-800/70 border-2 border-red-500/60'
                }`}>
                  {/* Sparkle background */}
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl ${
                    saleClosed && virtualEarnings > 0
                      ? 'bg-gradient-to-br from-emerald-400/40 to-green-400/40'
                      : dealDetails?.next_step
                        ? 'bg-gradient-to-br from-amber-400/40 to-yellow-400/40'
                        : 'bg-gradient-to-br from-red-400/40 to-rose-400/40'
                  }`}></div>
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4">
                      {saleClosed && virtualEarnings > 0 ? (
                        <>
                          <DollarSign className="w-5 h-5 text-emerald-300" />
                          <span className="text-sm uppercase tracking-[0.25em] text-emerald-300 font-space font-bold">You Earned</span>
                        </>
                      ) : dealDetails?.next_step ? (
                        <>
                          <Clock className="w-5 h-5 text-yellow-300" />
                          <span className="text-sm uppercase tracking-[0.25em] text-yellow-300 font-space font-bold">Soft Close</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-300" />
                          <span className="text-sm uppercase tracking-[0.25em] text-red-300 font-space font-bold">Close Failed</span>
                        </>
                      )}
                    </div>
                    
                    <div className={`text-4xl font-bold text-white mb-4 font-space ${
                      !saleClosed || virtualEarnings === 0 ? 'line-through opacity-50' : ''
                    }`}>
                      ${saleClosed && virtualEarnings > 0 ? dealValue.toFixed(2) : '0.00'}
                    </div>

                    <div className="flex-1 flex flex-col justify-end">
                      {saleClosed && virtualEarnings > 0 ? (
                        <>
                          <div className="space-y-3 mb-4">
                            {dealDetails?.product_sold && (
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-300 font-sans">Service</span>
                                <span className="text-white font-medium font-sans">{dealDetails.product_sold}</span>
                              </div>
                            )}
                            
                            {/* Deal Value Breakdown */}
                            {(dealDetails?.base_price || dealDetails?.monthly_value) && (
                              <div className="pt-2 border-t border-emerald-500/20 space-y-1.5">
                                {dealDetails?.base_price && dealDetails.base_price > 0 && (
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-300 font-sans">Initial Service</span>
                                    <span className="text-white font-medium font-sans">${dealDetails.base_price.toFixed(2)}</span>
                                  </div>
                                )}
                                {dealDetails?.monthly_value && dealDetails.monthly_value > 0 && dealDetails?.contract_length && dealDetails.contract_length > 0 && (
                                  <div className="flex justify-between text-xs">
                                    <span className="text-white/70 font-sans">
                                      Monthly ({dealDetails.contract_length} {dealDetails.contract_length === 1 ? 'month' : 'months'})
                                    </span>
                                    <span className="text-white font-medium font-sans">
                                      ${dealDetails.monthly_value.toFixed(2)}/mo × {dealDetails.contract_length} = ${(dealDetails.monthly_value * dealDetails.contract_length).toFixed(2)}
                                    </span>
                                  </div>
                                )}
                                {dealDetails?.monthly_value && dealDetails.monthly_value > 0 && !dealDetails?.contract_length && (
                                  <div className="flex justify-between text-xs">
                                    <span className="text-white/70 font-sans">Monthly</span>
                                    <span className="text-white font-medium font-sans">${dealDetails.monthly_value.toFixed(2)}/mo</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <div className="flex justify-between text-sm pt-2 border-t border-emerald-500/20">
                              <span className="text-slate-300 font-sans">Total Deal Value</span>
                              <span className="text-white font-medium font-sans">${dealValue.toFixed(2)}</span>
                            </div>
                            {totalEarned > 0 && totalEarned !== dealValue && (
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-300 font-sans">Closed Amount</span>
                                <span className="text-emerald-300 font-medium font-sans">${totalEarned.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </>
                      ) : dealDetails?.next_step ? (
                        <div className="space-y-3">
                          <div className="text-xl font-bold text-amber-300 font-space">Next Step ✓</div>
                          <p className="text-sm text-white font-medium leading-relaxed font-sans">{dealDetails.next_step}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex justify-between text-base">
                            <span className="text-slate-300 font-medium font-sans">Potential Deal Value</span>
                            <span className="text-white/70 font-semibold line-through font-sans">$--</span>
                          </div>
                          <div className="flex justify-between text-base">
                            <span className="text-slate-300 font-medium font-sans">Missed Commission</span>
                            <span className="text-red-300 font-semibold font-sans">$0.00</span>
                          </div>
                          
                          {/* Why it failed */}
                          {(() => {
                            const reasons = []
                            const closeAttempts = instantMetrics?.closeAttempts || 0
                            const talkRatio = instantMetrics?.conversationBalance || 0
                            
                            if (closeAttempts === 0) {
                              reasons.push("Didn't ask for the close (no attempt detected)")
                            }
                            
                            if (talkRatio > 70) {
                              reasons.push(`Talk ratio shifted to ${Math.round(talkRatio)}% (should be 60%)`)
                            } else if (talkRatio < 50) {
                              reasons.push(`Talk ratio was ${Math.round(talkRatio)}% (should be 60%)`)
                            }
                            
                            // Check voice analysis for energy drop
                            if (voiceAnalysis?.volumeTimeline && voiceAnalysis.volumeTimeline.length > 10) {
                              const lastTwoMinutes = voiceAnalysis.volumeTimeline.slice(-20)
                              const earlier = voiceAnalysis.volumeTimeline.slice(0, Math.floor(voiceAnalysis.volumeTimeline.length / 2))
                              const avgLater = lastTwoMinutes.reduce((sum, v) => sum + (v.value || 0), 0) / lastTwoMinutes.length
                              const avgEarlier = earlier.reduce((sum, v) => sum + (v.value || 0), 0) / earlier.length
                              
                              if (avgLater < avgEarlier * 0.7) {
                                reasons.push("Energy dropped to " + Math.round(avgLater) + "% in final 2 minutes")
                              }
                            }
                            
                            // Check failure analysis
                            if (failureAnalysis?.point_of_no_return) {
                              reasons.push(failureAnalysis.point_of_no_return.reason)
                            }
                            
                            if (reasons.length > 0) {
                              return (
                                <div className="pt-4 border-t border-red-500/30">
                                  <div className="text-lg font-bold text-amber-300 mb-3">Why it failed:</div>
                                  <ul className="space-y-2">
                                    {reasons.slice(0, 3).map((reason, idx) => (
                                      <li key={idx} className="text-base text-white font-medium flex items-start gap-2">
                                        <span className="text-red-400 mt-0.5 font-bold">•</span>
                                        <span>{reason}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )
                            }
                            return null
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Session Highlight / Win Callout */}
      {(feedback?.strengths && feedback.strengths.length > 0) || feedback?.session_highlight ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 p-6 bg-gradient-to-br from-emerald-900/30 to-green-800/30 border border-emerald-500/40 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <Trophy className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-base font-semibold text-emerald-400 mb-2 uppercase tracking-wide">Session Highlight</div>
              <p className="text-lg text-white leading-relaxed font-sans">
                {feedback?.session_highlight || feedback?.strengths?.[0] || 'Good engagement with the homeowner'}
              </p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </motion.div>
  )
}

