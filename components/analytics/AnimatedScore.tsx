'use client'

import { useState, useEffect } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { Star } from 'lucide-react'

interface AnimatedScoreProps {
  score: number
  maxScore?: number
  duration?: number
  className?: string
}

export default function AnimatedScore({ 
  score, 
  maxScore = 100, 
  duration = 1.5,
  className = ""
}: AnimatedScoreProps) {
  const [currentScore, setCurrentScore] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const starControls = useAnimationControls()
  const ringControls = useAnimationControls()
  
  // Color coding based on score
  const getScoreColor = (score: number) => {
    if (score >= 71) return { text: 'text-green-500', ring: '#10b981', bg: 'bg-green-50' }
    if (score >= 41) return { text: 'text-yellow-500', ring: '#eab308', bg: 'bg-yellow-50' }
    return { text: 'text-red-500', ring: '#ef4444', bg: 'bg-red-50' }
  }

  const getScoreLabel = (score: number) => {
    if (score >= 95) return 'Outstanding!'
    if (score >= 85) return 'Excellent'
    if (score >= 71) return 'Good Job!'
    if (score >= 55) return 'Needs Work'
    return 'Needs Improvement'
  }

  const getStarRating = (score: number) => {
    if (score >= 95) return 5
    if (score >= 85) return 4
    if (score >= 70) return 3
    if (score >= 55) return 2
    return 1
  }

  const colors = getScoreColor(score)
  const percentage = (score / maxScore) * 100
  const circumference = 2 * Math.PI * 90 // radius = 90
  
  useEffect(() => {
    if (hasAnimated) return
    
    const startAnimation = async () => {
      // Start count-up animation
      const interval = setInterval(() => {
        setCurrentScore(prev => {
          const increment = score / (duration * 1000 / 50) // 50ms intervals
          const next = Math.min(prev + increment, score)
          if (next >= score) {
            clearInterval(interval)
            setHasAnimated(true)
          }
          return Math.round(next)
        })
      }, 50)

      // Start ring animation
      await ringControls.start({
        strokeDashoffset: circumference - (percentage / 100) * circumference,
        transition: { duration, ease: "easeInOut" }
      })

      // Animate stars sequentially
      const starCount = getStarRating(score)
      for (let i = 0; i < starCount; i++) {
        await starControls.start((index) => 
          index === i 
            ? {
                scale: [1, 1.3, 1],
                opacity: [0.3, 1, 1],
                transition: { duration: 0.3 }
              }
            : {}
        )
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    const timer = setTimeout(startAnimation, 300) // Small delay for mount
    return () => clearTimeout(timer)
  }, [score, maxScore, duration, hasAnimated, percentage, circumference, starControls, ringControls])

  return (
    <div className={`text-center py-12 ${className}`}>
      {/* Circular Progress Ring with Score */}
      <div className="relative inline-flex items-center justify-center mb-8">
        <svg
          className="w-64 h-64 transform -rotate-90"
          viewBox="0 0 200 200"
        >
          {/* Background ring */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200"
          />
          {/* Progress ring */}
          <motion.circle
            cx="100"
            cy="100"
            r="90"
            fill="transparent"
            stroke={colors.ring}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={ringControls}
            initial={{ strokeDashoffset: circumference }}
            className="filter drop-shadow-sm"
          />
        </svg>
        
        {/* Score in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div 
              className={`text-7xl font-bold ${colors.text}`}
              animate={{ scale: hasAnimated ? [1, 1.05, 1] : 1 }}
              transition={{ duration: 0.5, delay: duration }}
            >
              {currentScore}
              <span className="text-3xl text-gray-400">/{maxScore}</span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Star Rating */}
      <div className="flex justify-center mb-6">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            animate={starControls}
            initial={{ scale: 1, opacity: i < getStarRating(score) ? 0.3 : 0.3 }}
          >
            <Star
              className={`w-10 h-10 mx-1 ${
                i < getStarRating(score)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </motion.div>
        ))}
      </div>
      
      {/* Score Label */}
      <motion.div 
        className="text-2xl font-semibold text-gray-700 mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: duration + 0.5, duration: 0.5 }}
      >
        {getScoreLabel(score)}
      </motion.div>

      {/* Motivational Message */}
      <motion.div 
        className="text-lg text-gray-500"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: duration + 0.7, duration: 0.5 }}
      >
        {score >= 85 
          ? "Keep up the excellent work!" 
          : score >= 70 
          ? "You're on the right track!" 
          : "Every expert was once a beginner"
        }
      </motion.div>
    </div>
  )
}
