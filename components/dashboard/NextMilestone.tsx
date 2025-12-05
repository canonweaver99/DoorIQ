'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Target, ArrowRight, Zap, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Milestone {
  id: string
  title: string
  description: string
  progress: number
  total: number
  unlock: string
}

interface MilestonesData {
  currentMilestone: Milestone
  completedMilestones: string[]
}

export default function NextMilestone() {
  const router = useRouter()
  const [data, setData] = useState<MilestonesData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMilestones()
  }, [])

  const fetchMilestones = async () => {
    try {
      const response = await fetch('/api/homepage/milestones')
      if (response.ok) {
        const data = await response.json()
        setData(data)
      }
    } catch (error) {
      console.error('Error fetching milestones:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return null
  }

  const { currentMilestone } = data
  const progressPercent = Math.min((currentMilestone.progress / currentMilestone.total > 0
    ? (currentMilestone.progress / currentMilestone.total) * 100
    : 0), 100)

  // Don't show if milestone is completed
  if (currentMilestone.progress >= currentMilestone.total) {
    return null
  }

  // Get unlockable features based on milestone
  const getUnlockableFeatures = () => {
    if (currentMilestone.id === 'first_session') {
      return [
        'Performance Dashboard',
        'Team Leaderboard Access',
        'AI Coaching Feedback',
        'Achievement Badges'
      ]
    }
    return [currentMilestone.unlock]
  }

  const unlockableFeatures = getUnlockableFeatures()
  const teammatesUnlocked = Math.floor(Math.random() * 5) + 1 // Simulated for now

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] rounded-lg p-6 transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center flex-shrink-0">
          <Target className="w-6 h-6 text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-3">
            YOUR NEXT MILESTONE
          </h3>
          <p className="text-white/90 font-medium mb-3">
            Complete {currentMilestone.total} practice session{currentMilestone.total !== 1 ? 's' : ''} to unlock:
          </p>

          {/* Unlockable Features List */}
          <div className="space-y-2 mb-4">
            {unlockableFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span className="text-white/90 text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm">
                Progress: {currentMilestone.progress} / {currentMilestone.total} sessions
              </span>
              <span className="text-white/80 text-sm font-medium">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              />
            </div>
          </div>

          {/* FOMO Element */}
          <div className="flex items-center gap-2 mb-4 text-purple-400 text-sm">
            <Zap className="w-4 h-4" />
            <span>{teammatesUnlocked} teammate{teammatesUnlocked !== 1 ? 's' : ''} unlocked this today</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => router.push('/trainer')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 text-white font-semibold rounded-lg transition-all shadow-md shadow-purple-500/15"
          >
            Start Practice Now →
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

