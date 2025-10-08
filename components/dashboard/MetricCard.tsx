'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'
import { useState, useEffect } from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle: string
  trend?: number
  trendUp?: boolean
  progress?: number
  icon: LucideIcon
  delay?: number
}

export default function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendUp,
  progress,
  icon: Icon,
  delay = 0,
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0)

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative bg-[#1e1e30] border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300">
        {/* Icon */}
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Icon className="w-6 h-6 text-purple-400" />
          </div>
          
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-semibold ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
              {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {trend}%
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-2">
          <h3 className="text-3xl font-bold text-white">
            {typeof value === 'number' ? displayValue : value}
          </h3>
        </div>

        {/* Title & Subtitle */}
        <div>
          <p className="text-sm font-medium text-slate-300 mb-1">{title}</p>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>

        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="mt-4">
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: delay + 0.2 }}
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">{progress}% complete</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

