'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface CircularProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
  delay?: number
}

export default function CircularProgress({ 
  percentage = 0, 
  size = 60, 
  strokeWidth = 4,
  delay = 0
}: CircularProgressProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0)
  
  // Determine color based on percentage
  const getColor = (pct: number) => {
    if (pct >= 90) return '#10b981' // Bright green
    if (pct >= 80) return '#22c55e' // Green
    if (pct >= 70) return '#eab308' // Yellow
    if (pct >= 60) return '#f97316' // Orange
    return '#ef4444' // Red
  }
  
  const color = getColor(percentage)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedPercentage / 100) * circumference
  
  useEffect(() => {
    const timer = setTimeout(() => {
      // Animate from 0 to target percentage
      const duration = 1500 // 1.5 seconds
      const steps = 60
      const increment = percentage / steps
      let current = 0
      
      const interval = setInterval(() => {
        current += increment
        if (current >= percentage) {
          setAnimatedPercentage(percentage)
          clearInterval(interval)
        } else {
          setAnimatedPercentage(current)
        }
      }, duration / steps)
      
      return () => clearInterval(interval)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [percentage, delay])
  
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#374151"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.5s ease-out'
          }}
        />
      </svg>
      
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-bold text-white">
          {Math.round(animatedPercentage)}%
        </span>
      </div>
    </div>
  )
}

