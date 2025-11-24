'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Zap, ArrowUp, ArrowDown, DollarSign, Clock, XCircle, Info } from 'lucide-react'
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
  trends = { rapport: 0, discovery: 0, objection_handling: 0, closing: 0 }
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
    if (value > 0) return `+${value} points ↑`
    if (value < 0) return `${value} points ↓`
    return 'No change'
  }
  
  // Calculate earnings breakdown
  const dealValue = dealDetails?.total_contract_value || dealDetails?.base_price || 0
  const commissionEarned = earningsData?.commission_earned || 0
  const bonusModifiers = earningsData?.bonus_modifiers || {}
  const bonusValues = Object.values(bonusModifiers).filter((v): v is number => typeof v === 'number')
  const totalBonus = bonusValues.reduce((sum, val) => sum + val, 0)
  
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Score and Info */}
            <div className="lg:col-span-2">
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
                  <span className="text-lg">
                    vs Your Average: <span className={cn(
                      "font-semibold",
                      vsUserAverage >= 0 ? 'text-green-400' : 'text-red-400'
                    )}>{getTrendText(vsUserAverage)}</span>
                  </span>
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
            
            {/* Right Column - Deal Status, and Quick Verdict */}
            <div className="lg:col-span-1 space-y-4">
              {/* Earnings and Quick Verdict Cards - Side by Side */}
              <div className="grid grid-cols-2 gap-3">
                {/* Earnings Card - From Old Grading Page */}
                <div className={`relative rounded-3xl backdrop-blur-xl p-4 overflow-hidden ${
                  saleClosed && virtualEarnings > 0
                    ? 'bg-gradient-to-br from-emerald-900/40 to-green-800/40 border border-emerald-500/30'
                    : dealDetails?.next_step
                      ? 'bg-gradient-to-br from-amber-900/40 to-yellow-800/40 border border-amber-500/30'
                      : 'bg-gradient-to-br from-red-900/40 to-rose-800/40 border border-red-500/30'
                }`}>
                  {/* Sparkle background */}
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl ${
                    saleClosed && virtualEarnings > 0
                      ? 'bg-gradient-to-br from-emerald-400/20 to-green-400/20'
                      : dealDetails?.next_step
                        ? 'bg-gradient-to-br from-amber-400/20 to-yellow-400/20'
                        : 'bg-gradient-to-br from-red-400/20 to-rose-400/20'
                  }`}></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      {saleClosed && virtualEarnings > 0 ? (
                        <>
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs uppercase tracking-[0.25em] text-emerald-400 font-space">You Earned</span>
                        </>
                      ) : dealDetails?.next_step ? (
                        <>
                          <Clock className="w-4 h-4 text-amber-400" />
                          <span className="text-xs uppercase tracking-[0.25em] text-amber-400 font-space">Soft Close</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-400" />
                          <span className="text-xs uppercase tracking-[0.25em] text-red-400 font-space">Close Failed</span>
                        </>
                      )}
                    </div>
                    
                    <div className={`text-3xl font-bold text-white mb-3 font-space ${
                      !saleClosed || virtualEarnings === 0 ? 'line-through opacity-50' : ''
                    }`}>
                      ${saleClosed && virtualEarnings > 0 ? virtualEarnings.toFixed(2) : '0.00'}
                    </div>

                    {saleClosed && virtualEarnings > 0 ? (
                      <>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-sans">Deal Value</span>
                            <span className="text-white font-medium font-sans">${dealValue.toFixed(0)}</span>
                          </div>
                          {commissionEarned > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400 font-sans">Commission</span>
                              <span className="text-emerald-400 font-medium font-sans">${commissionEarned.toFixed(2)}</span>
                            </div>
                          )}
                          {totalBonus > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400 font-sans">Bonuses</span>
                              <span className="text-yellow-400 font-medium font-sans">${totalBonus.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </>
                    ) : dealDetails?.next_step ? (
                      <div className="space-y-2">
                        <div className="text-lg font-bold text-amber-300 font-space">Next Step ✓</div>
                        <p className="text-xs text-white font-medium leading-relaxed font-sans">{dealDetails.next_step}</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300 font-medium font-sans">Potential Value</span>
                          <span className="text-white/70 font-semibold line-through font-sans">$--</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300 font-medium font-sans">Missed</span>
                          <span className="text-red-300 font-semibold font-sans">$0.00</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Quick Verdict Card - Right of Earnings */}
                {quickVerdict && (
                  <div className={`relative rounded-3xl backdrop-blur-xl p-4 overflow-hidden bg-blue-500/10 border border-blue-500/20`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-blue-400" />
                      <span className="text-xs uppercase tracking-[0.25em] text-blue-400 font-space">Quick Verdict</span>
                    </div>
                    <div className="text-white text-sm leading-relaxed font-sans">"{quickVerdict}"</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

