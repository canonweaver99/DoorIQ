'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Zap, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge, getBadgesForSession } from './Badge'
import { ProgressRing } from './ProgressRing'

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
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-sm uppercase tracking-[0.25em] text-slate-500 mb-2 font-sans">AI-Powered Training Results</div>
                  <h2 className="text-2xl font-bold text-white font-space">Overall Performance</h2>
                </div>
                <div className="text-right flex items-start gap-4">
                  <div className="flex flex-col items-end">
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
              
              {/* Comparison Metrics */}
              <div className="space-y-2 text-sm mb-6">
                <div className="flex items-center gap-2 text-gray-300">
                  {vsUserAverage > 0 ? (
                    <ArrowUp className="w-4 h-4 text-green-400" />
                  ) : vsUserAverage < 0 ? (
                    <ArrowDown className="w-4 h-4 text-red-400" />
                  ) : null}
                  <span>
                    vs Your Average: <span className={cn(
                      vsUserAverage >= 0 ? 'text-green-400' : 'text-red-400'
                    )}>{getTrendText(vsUserAverage)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  {vsTeamAverage > 0 ? (
                    <ArrowUp className="w-4 h-4 text-green-400" />
                  ) : vsTeamAverage < 0 ? (
                    <ArrowDown className="w-4 h-4 text-red-400" />
                  ) : null}
                  <span>
                    vs Team Average: <span className={cn(
                      vsTeamAverage >= 0 ? 'text-green-400' : 'text-red-400'
                    )}>{getTrendText(vsTeamAverage)}</span>
                  </span>
                </div>
                <div className="text-gray-400">
                  Percentile: <span className="text-white font-semibold">{percentileLabel} this week</span>
                </div>
              </div>
            </div>
            
            {/* Right Column - Badges, Deal Status, and Quick Verdict */}
            <div className="lg:col-span-1 space-y-4">
              {/* Badges Row */}
              <div className="flex flex-wrap gap-2">
                {getBadgesForSession(overallScore, vsUserAverage, vsTeamAverage, saleClosed, trends).map((badgeType) => (
                  <Badge key={badgeType} type={badgeType} size="sm" />
                ))}
              </div>
              
              {/* Deal Status Card with Earnings Breakdown */}
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-300">Deal Status:</span>
                  <span className={cn(
                    "text-sm font-bold",
                    saleClosed ? 'text-green-400' : 'text-red-400'
                  )}>
                    {saleClosed ? 'CLOSED' : 'NOT CLOSED'}
                  </span>
                </div>
                
                {saleClosed && virtualEarnings > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-sans">Deal Value</span>
                      <span className="text-white font-medium font-sans">${dealValue.toFixed(0)}</span>
                    </div>
                    {commissionEarned > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-sans">Commission (30%)</span>
                        <span className="text-emerald-400 font-medium font-sans">${commissionEarned.toFixed(2)}</span>
                      </div>
                    )}
                    {totalBonus > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 font-sans">Bonuses</span>
                        <span className="text-yellow-400 font-medium font-sans">${totalBonus.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-emerald-500/20 flex justify-between">
                      <span className="text-white font-semibold font-space">Total Virtual Earnings</span>
                      <span className="text-emerald-400 font-bold text-lg font-space">${virtualEarnings.toFixed(2)}</span>
                    </div>
                    {dealDetails?.product_sold && (
                      <div className="pt-2 border-t border-emerald-500/20">
                        <div className="text-xs text-slate-400 mb-1 font-sans">Product Sold</div>
                        <div className="text-sm text-white font-sans">{dealDetails.product_sold}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Potential:</span>
                      <span className="text-white font-semibold">${dealValue.toFixed(0)}</span>
                    </div>
                    {dealValue > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Lost:</span>
                        <span className="text-red-400 font-semibold">${dealValue.toFixed(0)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Quick Verdict Card */}
              {quickVerdict && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-blue-400">Quick Verdict:</span>
                  </div>
                  <div className="text-white text-sm leading-relaxed">"{quickVerdict}"</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

