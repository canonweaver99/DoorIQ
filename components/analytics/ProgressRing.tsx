'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressRingProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
  showValue?: boolean
  className?: string
}

export function ProgressRing({
  value,
  max = 100,
  size = 80,
  strokeWidth = 8,
  color = '#3b82f6',
  label,
  showValue = true,
  className
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const offset = circumference - (percentage / 100) * circumference
  
  const getColorClass = () => {
    if (percentage >= 80) return 'stroke-green-400'
    if (percentage >= 60) return 'stroke-yellow-400'
    if (percentage >= 40) return 'stroke-orange-400'
    return 'stroke-red-400'
  }
  
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-700"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={getColorClass()}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <div className="text-lg font-bold text-white">{Math.round(percentage)}%</div>
        )}
        {label && (
          <div className="text-xs text-gray-400 mt-1">{label}</div>
        )}
      </div>
    </div>
  )
}

