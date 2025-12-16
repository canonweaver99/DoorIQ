'use client'

import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, TrendingDown, Award } from 'lucide-react'

interface EarningsSummaryProps {
  totalEarnings?: number
  averagePerSession?: number
  bestSession?: number
  trend?: number // positive = up, negative = down, 0 = neutral
}

export default function EarningsSummary({ 
  totalEarnings = 0,
  averagePerSession = 0,
  bestSession = 0,
  trend = 0
}: EarningsSummaryProps) {
  if (totalEarnings === 0 && averagePerSession === 0 && bestSession === 0) {
    return null
  }

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : DollarSign
  const trendColor = trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-white/60'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
    >
      {/* Total Earnings */}
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-green-500/30 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70 text-sm font-space">Total Earnings</span>
          <DollarSign className="w-5 h-5 text-green-400" />
        </div>
        <p className="text-3xl font-bold text-white font-space">${totalEarnings.toFixed(2)}</p>
        <p className="text-xs text-white/60 mt-1">All-time</p>
      </div>

      {/* Average Per Session */}
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-blue-500/30 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70 text-sm font-space">Avg Per Session</span>
          <TrendingUp className="w-5 h-5 text-blue-400" />
        </div>
        <p className="text-3xl font-bold text-white font-space">${averagePerSession.toFixed(2)}</p>
        <p className="text-xs text-white/60 mt-1">Per session</p>
      </div>

      {/* Best Session */}
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-yellow-500/30 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70 text-sm font-space">Best Session</span>
          <Award className="w-5 h-5 text-yellow-400" />
        </div>
        <p className="text-3xl font-bold text-white font-space">${bestSession.toFixed(2)}</p>
        <p className="text-xs text-white/60 mt-1">Highest single</p>
      </div>

      {/* Trend */}
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-purple-500/30 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70 text-sm font-space">Trend</span>
          <TrendIcon className={`w-5 h-5 ${trendColor}`} />
        </div>
        <p className={`text-3xl font-bold font-space ${trendColor}`}>
          {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
        </p>
        <p className="text-xs text-white/60 mt-1">Week-over-week</p>
      </div>
    </motion.div>
  )
}







