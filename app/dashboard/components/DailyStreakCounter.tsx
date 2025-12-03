'use client'

import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import { motion } from 'framer-motion'

interface DailyStreakCounterProps {
  className?: string
}

export default function DailyStreakCounter({ className = '' }: DailyStreakCounterProps) {
  const [streak, setStreak] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStreak()
  }, [])

  const fetchStreak = async () => {
    try {
      const response = await fetch('/api/homepage/streak')
      if (response.ok) {
        const data = await response.json()
        setStreak(data.streak || 0)
      }
    } catch (error) {
      console.error('Error fetching streak:', error)
      setStreak(0)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return null
  }

  // Don't show anything when streak is 0
  if (streak === 0 || streak === null) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] transition-all ${className}`}
    >
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Flame className="w-4 h-4 text-purple-400" />
      </motion.div>
      <span className="text-white font-semibold text-sm">
        {streak} day{streak !== 1 ? 's' : ''} practice streak!
      </span>
    </motion.div>
  )
}

