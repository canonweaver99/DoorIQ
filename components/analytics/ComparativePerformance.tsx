'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComparativePerformanceProps {
  current: {
    rapport: number
    discovery: number
    objection_handling: number
    closing: number
  }
  userAverage: {
    rapport: number
    discovery: number
    objection_handling: number
    closing: number
  }
  teamAverage: {
    rapport: number
    discovery: number
    objection_handling: number
    closing: number
  }
  trends?: {
    rapport: number
    discovery: number
    objection_handling: number
    closing: number
  }
  recentScores?: {
    rapport: number[]
    discovery: number[]
    objection_handling: number[]
    closing: number[]
  }
}

export function ComparativePerformance({
  current,
  userAverage,
  teamAverage,
  trends = { rapport: 0, discovery: 0, objection_handling: 0, closing: 0 },
  recentScores
}: ComparativePerformanceProps) {
  const categories = [
    { key: 'rapport', label: 'Rapport' },
    { key: 'discovery', label: 'Discovery' },
    { key: 'objection_handling', label: 'Objections' },
    { key: 'closing', label: 'Closing' }
  ] as const
  
  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-400" />
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-400" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }
  
  const getTrendText = (value: number) => {
    if (value > 0) return '↑'
    if (value < 0) return '↓'
    return '→'
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 mb-8"
    >
      <h2 className="text-2xl font-bold text-white mb-6">How You Compare</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Category</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">You</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Your Avg</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Team Avg</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">Trend</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const currentValue = current[category.key]
              const userAvg = userAverage[category.key]
              const teamAvg = teamAverage[category.key]
              const trend = trends[category.key]
              const vsUser = currentValue - userAvg
              const vsTeam = currentValue - teamAvg
              
              return (
                <tr key={category.key} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-white">{category.label}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={cn(
                        "text-sm font-semibold",
                        vsUser < 0 ? 'text-red-400' : vsUser > 0 ? 'text-green-400' : 'text-white'
                      )}>
                        {currentValue}%
                      </span>
                      {getTrendIcon(vsUser)}
                      <span className={cn(
                        "text-xs",
                        vsUser < 0 ? 'text-red-400' : vsUser > 0 ? 'text-green-400' : 'text-gray-400'
                      )}>
                        {getTrendText(vsUser)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-gray-300">{userAvg}%</span>
                      {getTrendIcon(vsUser)}
                      <span className={cn(
                        "text-xs",
                        vsUser < 0 ? 'text-red-400' : vsUser > 0 ? 'text-green-400' : 'text-gray-400'
                      )}>
                        {getTrendText(vsUser)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-gray-300">{teamAvg}%</span>
                      {getTrendIcon(vsTeam)}
                      <span className={cn(
                        "text-xs",
                        vsTeam < 0 ? 'text-red-400' : vsTeam > 0 ? 'text-green-400' : 'text-gray-400'
                      )}>
                        {getTrendText(vsTeam)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {trend > 0 ? (
                        <>
                          <ArrowUp className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-green-400 font-semibold font-sans">+{Math.abs(trend)}%</span>
                        </>
                      ) : trend < 0 ? (
                        <>
                          <ArrowDown className="w-4 h-4 text-red-400" />
                          <span className="text-xs text-red-400 font-semibold font-sans">{trend}%</span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 font-sans">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {/* Trend Summary */}
      <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
        <div className="text-sm text-gray-300">
          <span className="font-semibold">Trend: </span>
          {(() => {
            const avgTrend = (trends.rapport + trends.discovery + trends.objection_handling + trends.closing) / 4
            return avgTrend < 0 ? (
              <span className="text-red-400">↓ Declining</span>
            ) : avgTrend > 0 ? (
              <span className="text-green-400">↑ Improving</span>
            ) : (
              <span className="text-gray-400">→ Stable</span>
            )
          })()}
          <span className="text-gray-400"> (last 3 sessions)</span>
        </div>
      </div>
    </motion.div>
  )
}

