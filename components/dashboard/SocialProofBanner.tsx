'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Trophy } from 'lucide-react'

interface SocialProofData {
  todayPracticeCount: number
  featuredScore: {
    score: number
    agentName: string
    userName: string
  } | null
}

export default function SocialProofBanner() {
  const [data, setData] = useState<SocialProofData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentMessage, setCurrentMessage] = useState(0)

  useEffect(() => {
    fetchSocialProof()
    const interval = setInterval(fetchSocialProof, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (data) {
      const interval = setInterval(() => {
        setCurrentMessage(prev => (prev + 1) % 2)
      }, 8000) // Rotate messages every 8 seconds
      return () => clearInterval(interval)
    }
  }, [data])

  const fetchSocialProof = async () => {
    try {
      const response = await fetch('/api/homepage/social-proof')
      if (response.ok) {
        const data = await response.json()
        setData(data)
      }
    } catch (error) {
      console.error('Error fetching social proof:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return null
  }

  const messages = [
    {
      text: `${data.todayPracticeCount || 0} reps practiced today`,
      icon: Zap,
      show: true,
    },
    {
      text: data.featuredScore
        ? `${data.featuredScore.userName} just scored ${data.featuredScore.score}/100 with ${data.featuredScore.agentName}`
        : null,
      icon: Trophy,
      show: !!data.featuredScore,
    },
  ].filter(m => m.show)

  if (messages.length === 0) {
    return null
  }

  const currentMsg = messages[currentMessage % messages.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] rounded-lg px-4 py-2 mb-4 transition-all"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMessage}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 justify-center"
        >
          {currentMsg.icon && <currentMsg.icon className="w-4 h-4 text-purple-400" />}
          <p className="text-white font-medium text-sm">
            {currentMsg.text}
            {currentMessage === 0 && data.todayPracticeCount > 0 && (
              <span className="ml-2 text-purple-300">Join them and start your streak</span>
            )}
          </p>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

