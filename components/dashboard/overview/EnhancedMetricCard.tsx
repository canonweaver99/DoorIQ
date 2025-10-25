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

  // Map titles to matte color system used in the new dashboard
  const getMatteStyles = () => {
    const key = title.toLowerCase()
    if (key.includes('overall')) {
      return {
        bg: '#2a1a3a',
        border: '#4a2a6a',
        glow: 'rgba(138, 43, 226, 0.1)',
        titleColor: 'text-purple-200',
      }
    }
    if (key.includes('rapport')) {
      return {
        bg: '#1a3a2a',
        border: '#2a6a4a',
        glow: 'rgba(16, 185, 129, 0.1)',
        titleColor: 'text-emerald-200',
      }
    }
    if (key.includes('discovery')) {
      return {
        bg: '#1a2a3a',
        border: '#2a4a6a',
        glow: 'rgba(59, 130, 246, 0.1)',
        titleColor: 'text-blue-200',
      }
    }
    if (key.includes('objection') || key.includes('objections')) {
      return {
        bg: '#3a2a1a',
        border: '#6a4a2a',
        glow: 'rgba(245, 158, 11, 0.1)',
        titleColor: 'text-amber-200',
      }
    }
    if (key.includes('closing')) {
      return {
        bg: '#3a1a2a',
        border: '#6a2a4a',
        glow: 'rgba(236, 72, 153, 0.1)',
        titleColor: 'text-pink-200',
      }
    }
    // Generic metric (Sessions, Earnings, etc.) - neutral matte
    return {
      bg: '#1a1a1a',
      border: '#2a2a2a',
      glow: 'rgba(168, 85, 247, 0.08)',
      titleColor: 'text-slate-300',
    }
  }
  const matte = getMatteStyles()

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
  // If value is a percentage (string like "78%" or number <=100 with title containing 'Score') show %; otherwise show whole number
  const isPercentMetric =
    (typeof value === 'string' && value.toString().trim().endsWith('%')) ||
    (typeof value === 'number' && title.toLowerCase().includes('score'))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative group"
    >
      {/* Subtle matte glow */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{ boxShadow: `inset 0 0 20px ${matte.glow}` }}
      />

      <div
        className="relative rounded-2xl px-4 py-3 transition-all duration-300 h-[90px] max-h-[90px] flex flex-col justify-between"
        style={{
          backgroundColor: matte.bg,
          border: `2px solid ${matte.border}`,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Header: Title + Trend */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <Icon className="w-3.5 h-3.5" style={{ color: '#c4b5fd' }} />
            </div>
            <span className={`text-sm font-semibold ${matte.titleColor}`}>{title}</span>
          </div>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            {trendUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span className="text-xs font-semibold">{trendUp ? '+' : ''}{trend}{isPercentMetric ? '%' : ''}</span>
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

