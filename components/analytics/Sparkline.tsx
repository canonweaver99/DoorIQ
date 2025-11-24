'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  className?: string
}

export function Sparkline({
  data,
  width = 60,
  height = 20,
  color = '#3b82f6',
  className
}: SparklineProps) {
  if (!data || data.length === 0) {
    return <div className={cn("w-[60px] h-[20px]", className)} />
  }
  
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(' ')
  
  const pathData = `M ${points}`
  
  // Determine color based on trend
  const firstValue = data[0]
  const lastValue = data[data.length - 1]
  const trend = lastValue - firstValue
  
  const getColor = () => {
    if (trend > 0) return '#10b981' // green
    if (trend < 0) return '#ef4444' // red
    return '#6b7280' // gray
  }
  
  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      <motion.path
        d={pathData}
        fill="none"
        stroke={getColor()}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      {/* Last point indicator */}
      <motion.circle
        cx={width}
        cy={height - ((lastValue - min) / range) * height}
        r="2"
        fill={getColor()}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
      />
    </svg>
  )
}

