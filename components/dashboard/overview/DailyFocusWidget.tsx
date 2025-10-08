'use client'

import { motion } from 'framer-motion'
import { Target } from 'lucide-react'
import { useEffect, useState } from 'react'

interface DailyFocusWidgetProps {
  current: number
  goal: number
  type: 'sessions' | 'score'
  delay?: number
}

export default function DailyFocusWidget({ current, goal, type, delay = 0 }: DailyFocusWidgetProps) {
  const [progress, setProgress] = useState(0)
  const percentage = Math.min((current / goal) * 100, 100)
  const isComplete = current >= goal

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(percentage)
    }, 300)
    return () => clearTimeout(timer)
  }, [percentage])

  const getMotivationalMessage = () => {
    if (isComplete) return "🎉 Goal crushed!"
    if (percentage >= 75) return "Almost there!"
    if (percentage >= 50) return "Halfway there!"
    if (percentage >= 25) return "Good start!"
    return "Let's go!"
  }

  const circumference = 2 * Math.PI * 36 // radius is 36
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-indigo-600/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative bg-[#1e1e30] border border-white/10 rounded-2xl p-4 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 h-[140px] flex flex-col items-center justify-center">
        {/* Circular Progress Ring */}
        <div className="relative">
          <svg width="80" height="80" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="6"
            />
            {/* Progress circle */}
            <motion.circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke={isComplete ? "#10B981" : "#8B5CF6"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Target className={`w-5 h-5 mb-1 ${isComplete ? 'text-green-400' : 'text-purple-400'}`} />
            <span className="text-lg font-bold text-white">
              {current}/{goal}
            </span>
          </div>
        </div>

        {/* Label */}
        <div className="text-center mt-2">
          <p className="text-xs text-slate-400 mb-0.5">
            {type === 'sessions' ? 'Daily Sessions' : 'Target Score'}
          </p>
          <motion.p
            key={getMotivationalMessage()}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-xs font-semibold ${isComplete ? 'text-green-400' : 'text-purple-400'}`}
          >
            {getMotivationalMessage()}
          </motion.p>
        </div>

        {/* Celebration animation */}
        {isComplete && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 rounded-2xl border-2 border-green-400 pointer-events-none"
          />
        )}
      </div>
    </motion.div>
  )
}

