'use client'

import { motion } from 'framer-motion'

interface SparklineChartProps {
  data: number[]
  color?: string
  width?: number
  height?: number
}

export default function SparklineChart({ 
  data, 
  color = '#8B5CF6',
  width = 60,
  height = 20
}: SparklineChartProps) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="inline-block">
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
    </svg>
  )
}

