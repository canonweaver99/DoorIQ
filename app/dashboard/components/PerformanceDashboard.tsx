'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Target, Clock, Mic, Rocket, ArrowRight, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import WeeklyPerformanceGraph from './WeeklyPerformanceGraph'

interface PerformanceMetrics {
  closeRate: number
  avgDurationSeconds: number
  toneScore: number
}

interface PerformanceDashboardProps {
  overallScore: number
  metrics: PerformanceMetrics
  weeklyData: Array<{ date: string; score: number }>
  trend: number
}

export default function PerformanceDashboard({
  overallScore,
  metrics,
  weeklyData,
  trend
}: PerformanceDashboardProps) {
  const router = useRouter()
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m`
  }

  // Check if this is an empty state (no sessions completed)
  const isEmpty = overallScore === 0 && metrics.closeRate === 0 && metrics.avgDurationSeconds === 0 && metrics.toneScore === 0

  // Empty state component with preview/ghost data
  if (isEmpty) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] rounded-lg p-8 md:p-12 relative overflow-hidden transition-all"
        >
          {/* Blurred preview overlay */}
          <div className="absolute inset-0 backdrop-blur-sm bg-black/40 z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/[0.05] rounded-lg flex items-center justify-center border border-white/10">
                <Lock className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Unlock Your Dashboard</h3>
              <p className="text-white/70 text-sm">Complete 1 practice session to see YOUR stats</p>
            </div>
          </div>

          {/* Ghost/Preview Data */}
          <div className="relative opacity-30 blur-sm">
            <h2 className="text-white font-bold text-2xl md:text-3xl mb-6">
              YOUR PERFORMANCE DASHBOARD
            </h2>
            
            {/* Preview Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                <div className="text-4xl font-bold text-white mb-1">85</div>
                <div className="text-white/60 text-sm">/100 Score</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                <div className="text-4xl font-bold text-white mb-1">6.2m</div>
                <div className="text-white/60 text-sm">Duration</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                <div className="text-4xl font-bold text-white mb-1">92</div>
                <div className="text-white/60 text-sm">/100 Tone</div>
              </div>
            </div>

            {/* Preview Graph */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 h-48 mb-6">
              <div className="h-full flex items-end gap-2">
                {[60, 70, 75, 80, 85, 88, 85].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-purple-500/40 to-purple-500/20 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Unlock CTA */}
          <div className="relative z-20 mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/trainer')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-black hover:bg-white/90 font-bold rounded-lg transition-all"
            >
              Start Practice Now →
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Performance Score */}
      <div className="bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] rounded-lg p-6 transition-all">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white/80 text-sm font-medium uppercase tracking-wide">
            Overall Score
          </h2>
          {trend !== 0 && (
            <div className={`flex items-center gap-1 ${trend > 0 ? 'text-purple-400' : 'text-white/60'}`}>
              {trend > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm font-semibold">
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-6xl font-bold text-white">
            {overallScore}
          </span>
          <span className="text-2xl text-white/60">/100</span>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] rounded-lg p-4 transition-all"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-purple-400" />
            <h3 className="text-white/80 text-sm font-medium">Average Close Rate</h3>
          </div>
          <p className="text-3xl font-bold text-white">{metrics.closeRate}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] rounded-lg p-4 transition-all"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <h3 className="text-white/80 text-sm font-medium">How Long You Keep 'Em Talking ⏱️</h3>
          </div>
          <p className="text-3xl font-bold text-white">
            {formatDuration(metrics.avgDurationSeconds)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] rounded-lg p-4 transition-all"
        >
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-5 h-5 text-purple-400" />
            <h3 className="text-white/80 text-sm font-medium">Tone/Confidence</h3>
          </div>
          <p className="text-3xl font-bold text-white">{metrics.toneScore}/100</p>
        </motion.div>
      </div>

      {/* Weekly Performance Graph */}
      <div className="bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] rounded-lg p-6 transition-all">
        <h3 className="text-white/80 text-sm font-medium uppercase tracking-wide mb-4">
          Weekly Performance
        </h3>
        <WeeklyPerformanceGraph data={weeklyData} />
      </div>
    </div>
  )
}

