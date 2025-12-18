'use client'

import { motion } from 'framer-motion'
import { Trophy, TrendingUp } from 'lucide-react'
import type { SessionPerformance } from '@/app/dashboard/types'

interface ProgressMilestoneProps {
  session: SessionPerformance | null
}

export default function ProgressMilestone({ session }: ProgressMilestoneProps) {
  if (!session) {
    return null
  }

  const { overallScore, grade } = session

  // Calculate next milestone
  const getNextMilestone = () => {
    if (overallScore >= 90) {
      return {
        target: 100,
        label: 'Perfect Score',
        progress: overallScore,
        message: 'You\'re almost at perfection!'
      }
    } else if (overallScore >= 80) {
      return {
        target: 90,
        label: 'A Grade',
        progress: overallScore,
        message: 'Push for that A grade!'
      }
    } else if (overallScore >= 70) {
      return {
        target: 80,
        label: 'B Grade',
        progress: overallScore,
        message: 'You\'re close to a B grade!'
      }
    } else if (overallScore >= 60) {
      return {
        target: 70,
        label: 'C Grade',
        progress: overallScore,
        message: 'Keep improving to reach C grade'
      }
    } else {
      return {
        target: 60,
        label: 'D Grade',
        progress: overallScore,
        message: 'Focus on fundamentals to reach D grade'
      }
    }
  }

  const milestone = getNextMilestone()
  const progressPercent = Math.min(100, (milestone.progress / milestone.target) * 100)
  const remaining = milestone.target - milestone.progress

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.9 }}
      className="bg-white/[0.02] border border-white/10 rounded-xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-6 h-6 text-yellow-400" />
        <h2 className="text-xl font-bold text-white">
          PROGRESS TO NEXT MILESTONE
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 font-semibold">
              {milestone.label}
            </span>
            <span className="text-white/60 text-sm">
              {milestone.progress} / {milestone.target}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, delay: 1 }}
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </motion.div>
          </div>

          <p className="text-white/60 text-sm mt-2">
            {remaining > 0 ? `${remaining} points to go` : 'Milestone reached!'}
          </p>
        </div>

        <div className="flex items-start gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <TrendingUp className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-purple-400 font-semibold text-sm mb-1">Motivation</p>
            <p className="text-white/80 text-sm">{milestone.message}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}








