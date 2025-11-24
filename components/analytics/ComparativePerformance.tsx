'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProgressRing } from './ProgressRing'

interface ComparativePerformanceProps {
  currentOverall: number
  userAverageOverall: number
  teamAverageOverall: number
  currentClosePercentage?: number
  userAverageClosePercentage?: number
  teamAverageClosePercentage?: number
  closeAttempts?: {
    total: number
    successful: number
    recent5: number
    previous5: number
  }
  teamCloseAttempts?: {
    total: number
    successful: number
  } | null
}

export function ComparativePerformance({
  currentOverall,
  userAverageOverall,
  teamAverageOverall,
  currentClosePercentage = 0,
  userAverageClosePercentage = 0,
  teamAverageClosePercentage = 0,
  closeAttempts,
  teamCloseAttempts
}: ComparativePerformanceProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#3b82f6'
    if (score >= 40) return '#f59e0b'
    return '#ef4444'
  }
  
  const vsUser = currentOverall - userAverageOverall
  
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
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Metric</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">This Session</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">Your Avg (Last 10)</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">Team Avg</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
              <td className="py-3 px-4 text-sm font-medium text-white">Overall Score</td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-center">
                  <ProgressRing
                    value={currentOverall}
                    max={100}
                    size={60}
                    strokeWidth={6}
                    color={getScoreColor(currentOverall)}
                    showValue={true}
                  />
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-center">
                  <ProgressRing
                    value={userAverageOverall}
                    max={100}
                    size={60}
                    strokeWidth={6}
                    color={getScoreColor(userAverageOverall)}
                    showValue={true}
                  />
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-center">
                  <ProgressRing
                    value={teamAverageOverall}
                    max={100}
                    size={60}
                    strokeWidth={6}
                    color={getScoreColor(teamAverageOverall)}
                    showValue={true}
                  />
                </div>
              </td>
            </tr>
            <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
              <td className="py-3 px-4 text-sm font-medium text-white">
                <div>Close %</div>
                {closeAttempts && (
                  <div className="text-xs text-gray-500 mt-1 font-sans">
                    {closeAttempts.successful}/{closeAttempts.total} attempts
                    {teamCloseAttempts && (
                      <span className="ml-2">
                        (Team avg: {teamCloseAttempts.successful} in {teamCloseAttempts.total})
                      </span>
                    )}
                  </div>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-col items-center justify-center gap-2">
                  <ProgressRing
                    value={currentClosePercentage}
                    max={100}
                    size={60}
                    strokeWidth={6}
                    color={getScoreColor(currentClosePercentage)}
                    showValue={true}
                  />
                  {closeAttempts && (
                    <div className="text-xs text-gray-400 text-center font-sans">
                      {closeAttempts.successful > 0 ? '✓ Closed' : '✗ No close'}
                    </div>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-col items-center justify-center gap-2">
                  <ProgressRing
                    value={userAverageClosePercentage}
                    max={100}
                    size={60}
                    strokeWidth={6}
                    color={getScoreColor(userAverageClosePercentage)}
                    showValue={true}
                  />
                  {closeAttempts && closeAttempts.total >= 10 && (
                    <div className="text-xs text-gray-400 text-center font-sans">
                      <div>Last 5: {closeAttempts.recent5} closes</div>
                      <div className="text-gray-500">Prev 5: {closeAttempts.previous5} closes</div>
                    </div>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-center">
                  <ProgressRing
                    value={teamAverageClosePercentage}
                    max={100}
                    size={60}
                    strokeWidth={6}
                    color={getScoreColor(teamAverageClosePercentage)}
                    showValue={true}
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

