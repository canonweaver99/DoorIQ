'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Clock, Mic } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PerformanceSnapshotProps {
  overallScore: number
  avgDurationSeconds: number
  toneScore: number
  trend?: {
    score: number
    duration: number
    tone: number
  }
}

export default function PerformanceSnapshot({
  overallScore,
  avgDurationSeconds,
  toneScore,
  trend,
}: PerformanceSnapshotProps) {
  const router = useRouter()

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatTrend = (value: number) => {
    if (value === 0) return null
    const isPositive = value > 0
    return {
      value: Math.abs(value),
      isPositive,
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? 'text-purple-400' : 'text-white/60',
    }
  }

  const scoreTrend = trend ? formatTrend(trend.score) : null
  const durationTrend = trend ? formatTrend(trend.duration) : null
  const toneTrend = trend ? formatTrend(trend.tone) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] rounded-lg p-6 transition-all"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white font-bold text-xl">YOUR PERFORMANCE SNAPSHOT</h2>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
        >
          View Full Analytics →
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] rounded-lg p-4 transition-all"
        >
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="text-4xl font-bold text-white"
              >
                {overallScore}
              </motion.span>
              <span className="text-xl text-white/60">/100</span>
            </div>
            <p className="text-white/70 text-sm mb-2">Overall Score</p>
            {scoreTrend && (
              <div className={`flex items-center justify-center gap-1 ${scoreTrend.color}`}>
                {scoreTrend.icon === TrendingUp ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span className="text-xs font-semibold">
                  ↑ +{scoreTrend.value}%
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Avg Call Duration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] rounded-lg p-4 transition-all"
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="text-2xl font-bold text-white"
              >
                {formatDuration(avgDurationSeconds)}
              </motion.span>
            </div>
            <p className="text-white/70 text-sm mb-2">Avg Call Duration</p>
            {durationTrend && (
              <div className={`flex items-center justify-center gap-1 ${durationTrend.color}`}>
                {durationTrend.icon === TrendingUp ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span className="text-xs font-semibold">
                  ↑ +{durationTrend.value}m
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Confidence Rating */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] rounded-lg p-4 transition-all"
        >
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="text-4xl font-bold text-white"
              >
                {toneScore}
              </motion.span>
              <span className="text-xl text-white/60">/100</span>
            </div>
            <p className="text-white/70 text-sm mb-2">Confidence Rating</p>
            {toneTrend && (
              <div className={`flex items-center justify-center gap-1 ${toneTrend.color}`}>
                {toneTrend.icon === TrendingUp ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span className="text-xs font-semibold">
                  ↑ +{toneTrend.value}pts
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

