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
  totalSessions?: number
}

export default function PerformanceDashboard({
  overallScore,
  metrics,
  weeklyData,
  trend,
  totalSessions = 0
}: PerformanceDashboardProps) {
  const router = useRouter()
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m`
  }

  // Check if this is an empty state (no sessions completed)
  // Primary check: totalSessions (most reliable), fallback to metrics check if totalSessions not provided
  const isEmpty = totalSessions !== undefined 
    ? totalSessions === 0 
    : (overallScore === 0 && metrics.closeRate === 0 && metrics.avgDurationSeconds === 0 && metrics.toneScore === 0)

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
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => router.push('/trainer')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 text-white font-bold rounded-lg transition-all shadow-md shadow-purple-500/15"
            >
              Start Practice Now →
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  return null
}

