'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import SparklineChart from './SparklineChart'

interface EnhancedMetricCardProps {
  title: string
  value: string | number
  trend: number
  trendUp: boolean
  icon: LucideIcon
  sparklineData: number[]
  historicalData: {
    sevenDay: number
    thirtyDay: number
    allTime: number
  }
  delay?: number
}

export default function EnhancedMetricCard({
  title,
  value,
  trend,
  trendUp,
  icon: Icon,
  sparklineData,
  historicalData,
  delay = 0,
}: EnhancedMetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [displayValue, setDisplayValue] = useState(0)

  // Animate number counting
  useEffect(() => {
    if (typeof value === 'number') {
      let start = 0
      const end = value
      const duration = 1000
      const increment = end / (duration / 16)

      const timer = setInterval(() => {
        start += increment
        if (start >= end) {
          setDisplayValue(end)
          clearInterval(timer)
        } else {
          setDisplayValue(Math.floor(start))
        }
      }, 16)

      return () => clearInterval(timer)
    }
  }, [value])

  const trendColor = trendUp ? 'text-green-400' : 'text-red-400'
  const sparklineColor = trendUp ? '#10B981' : '#EF4444'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      onHoverStart={() => setShowTooltip(true)}
      onHoverEnd={() => setShowTooltip(false)}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-indigo-600/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative bg-[#1e1e30] border border-white/10 rounded-2xl p-4 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 h-[140px] flex flex-col">
        {/* Header: Icon + Title */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Icon className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-xs text-slate-400 font-medium">{title}</span>
        </div>

        {/* Main Value + Trend */}
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-3xl font-bold text-white">
            {typeof value === 'number' ? displayValue : value}
          </span>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-sm font-semibold">{trend}%</span>
          </div>
        </div>

        {/* Sparkline */}
        <div className="mt-auto">
          <SparklineChart data={sparklineData} color={sparklineColor} width={120} height={24} />
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-[#1a1a2e] border border-white/20 rounded-xl p-3 shadow-2xl min-w-[160px]"
          >
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">7 days:</span>
                <span className="text-white font-semibold">{historicalData.sevenDay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">30 days:</span>
                <span className="text-white font-semibold">{historicalData.thirtyDay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">All time:</span>
                <span className="text-white font-semibold">{historicalData.allTime}</span>
              </div>
            </div>
            {/* Arrow */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1a1a2e] border-l border-t border-white/20 rotate-45" />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

