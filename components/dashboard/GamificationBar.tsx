'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Target, Zap, Users } from 'lucide-react'

interface GamificationData {
  streak: number
}

interface SocialProofData {
  todayPracticeCount: number
}

export default function GamificationBar() {
  const [streakData, setStreakData] = useState<GamificationData | null>(null)
  const [socialProof, setSocialProof] = useState<SocialProofData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [streakResponse, socialResponse] = await Promise.all([
        fetch('/api/homepage/gamification'),
        fetch('/api/homepage/social-proof')
      ])
      
      if (streakResponse.ok) {
        const data = await streakResponse.json()
        setStreakData(data)
      }
      
      if (socialResponse.ok) {
        const data = await socialResponse.json()
        setSocialProof(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return null
  }

  // Show "Start Your Streak" when streak is 0
  if (!streakData || streakData.streak === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-all shadow-sm"
      >
        <Target className="w-4 h-4 text-purple-600" />
        <span className="text-black font-semibold text-sm">
          Start Your Streak Today
        </span>
      </motion.div>
    )
  }

  // Show streak when active
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-all shadow-sm"
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
        <Zap className="w-4 h-4 text-purple-600" />
      </motion.div>
      <span className="text-black font-semibold text-sm">
        {streakData.streak} Day{streakData.streak !== 1 ? 's' : ''} Streak!
      </span>
    </motion.div>
  )
}

