'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, TrendingDown, TrendingUp, Minus } from 'lucide-react'
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
  dealDetails,
  quickVerdict,
  trends = { rapport: 0, discovery: 0, objection_handling: 0, closing: 0 }
}: HeroSectionProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }
  
  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-400" />
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-400" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }
  
  const getTrendText = (value: number) => {
    if (value > 0) return `+${value} points ↑`
    if (value < 0) return `${value} points ↓`
    return 'No change'
  }
  
  // Calculate potential/lost earnings
  const potentialValue = dealDetails?.total_contract_value || dealDetails?.base_amount || 0
  const lostValue = saleClosed ? 0 : potentialValue
  
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
      
      {/* Overall Performance */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">Overall Performance</h2>
            <ProgressRing
              value={overallScore}
              max={100}
              size={100}
              strokeWidth={10}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {getBadgesForSession(overallScore, vsUserAverage, vsTeamAverage, saleClosed, trends).map((badgeType) => (
              <Badge key={badgeType} type={badgeType} size="sm" />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <span className={cn(
            "text-4xl font-bold",
            getScoreColor(overallScore)
          )}>
            {overallScore}
          </span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            {getTrendIcon(vsUserAverage)}
            <span className="text-gray-300">
              vs Your Average: <span className={cn(
                vsUserAverage >= 0 ? 'text-green-400' : 'text-red-400'
              )}>{getTrendText(vsUserAverage)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon(vsTeamAverage)}
            <span className="text-gray-300">
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
      
      {/* Deal Status */}
      <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-300">Deal Status:</span>
          <span className={cn(
            "text-sm font-bold",
            saleClosed ? 'text-green-400' : 'text-red-400'
          )}>
            {saleClosed ? 'CLOSED' : 'NOT CLOSED'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Potential:</span>
          <span className="text-white font-semibold">${potentialValue.toFixed(0)}</span>
        </div>
        {lostValue > 0 && (
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-400">Lost:</span>
            <span className="text-red-400 font-semibold">${lostValue.toFixed(0)}</span>
          </div>
        )}
      </div>
      
      {/* Quick Verdict */}
      {quickVerdict && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="text-sm font-semibold text-blue-400 mb-1">⚡ Quick Verdict:</div>
          <div className="text-white text-sm">"{quickVerdict}"</div>
        </div>
      )}
    </motion.div>
  )
}

