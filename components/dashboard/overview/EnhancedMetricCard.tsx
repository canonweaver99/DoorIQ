'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'
import { useState, useEffect } from 'react'

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-indigo-600/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative bg-[#1e1e30] border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 h-[90px] max-h-[90px] flex flex-col justify-between">
        {/* Header: Title + Trend */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500/10 rounded-lg">
              <Icon className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="text-sm font-medium text-slate-400">{title}</span>
          </div>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            {trendUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span className="text-xs font-semibold">{trend}%</span>
          </div>
        </div>

        {/* Main Value */}
        <div>
          <span className="text-4xl font-bold text-white leading-none">
            {typeof value === 'number' ? displayValue : value}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

