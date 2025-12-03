'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Clock, Activity, BarChart3 } from 'lucide-react'
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
    if (minutes === 0) return `${remainingSeconds}s`
    return `${minutes}m ${remainingSeconds}s`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-orange-400'
  }

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500/20 via-emerald-500/10 to-transparent'
    if (score >= 60) return 'from-yellow-500/20 via-amber-500/10 to-transparent'
    return 'from-orange-500/20 via-red-500/10 to-transparent'
  }

  const formatTrend = (value: number) => {
    if (value === 0) return null
    const isPositive = value > 0
    return {
      value: Math.abs(value),
      isPositive,
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? 'text-green-400' : 'text-red-400',
    }
  }

  const scoreTrend = trend ? formatTrend(trend.score) : null

  const metrics = [
    {
      label: 'Overall Score',
      value: overallScore,
      suffix: '/100',
      icon: BarChart3,
      color: getScoreColor(overallScore),
      gradient: getScoreGradient(overallScore),
      trend: scoreTrend,
      primary: true,
    },
    {
      label: 'Avg Duration',
      value: formatDuration(avgDurationSeconds),
      suffix: '',
      icon: Clock,
      color: 'text-blue-400',
      gradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
      trend: null,
      primary: false,
    },
    {
      label: 'Confidence',
      value: toneScore,
      suffix: '/100',
      icon: Activity,
      color: toneScore >= 70 ? 'text-purple-400' : 'text-white/70',
      gradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
      trend: null,
      primary: false,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] border border-white/10 rounded-xl p-6 md:p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-white font-space font-medium text-lg md:text-xl tracking-tight">
              Performance Snapshot
            </h2>
            <p className="text-white/60 text-sm">Your recent average metrics</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors hidden sm:block"
        >
          View Full Analytics →
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className={`relative bg-gradient-to-br ${metric.gradient} border border-white/10 rounded-xl p-4 md:p-5 overflow-hidden ${metric.primary ? 'sm:row-span-1' : ''}`}
            >
              {/* Background icon */}
              <div className="absolute top-2 right-2 opacity-10">
                <Icon className="w-12 h-12 text-white" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-4 h-4 ${metric.color}`} />
                  <span className="text-white/70 text-sm font-medium">{metric.label}</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <motion.span
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
                    className={`text-3xl md:text-4xl font-bold ${metric.color}`}
                  >
                    {metric.value}
                  </motion.span>
                  {metric.suffix && (
                    <span className="text-white/50 text-lg">{metric.suffix}</span>
                  )}
                </div>

                {metric.trend && (
                  <div className={`flex items-center gap-1 mt-2 ${metric.trend.color}`}>
                    {metric.trend.isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-xs font-semibold">
                      {metric.trend.isPositive ? '+' : '-'}{metric.trend.value}% vs last week
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Mobile link */}
      <button
        onClick={() => router.push('/dashboard')}
        className="w-full mt-4 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors sm:hidden"
      >
        View Full Analytics →
      </button>
    </motion.div>
  )
}
