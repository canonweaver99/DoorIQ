'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Play } from 'lucide-react'

interface OnboardingElementsProps {
  totalSessions: number
}

export default function OnboardingElements({ totalSessions }: OnboardingElementsProps) {
  const [showWelcomeVideo, setShowWelcomeVideo] = useState(false)
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false)

  useEffect(() => {
    // Check if user has seen welcome video before
    const seenWelcome = localStorage.getItem('dooriq_seen_welcome')
    setHasSeenWelcome(!!seenWelcome)
  }, [])

  const handleCloseWelcome = () => {
    setShowWelcomeVideo(false)
    localStorage.setItem('dooriq_seen_welcome', 'true')
    setHasSeenWelcome(true)
  }

  // Don't show onboarding if user has sessions
  if (totalSessions > 0 && hasSeenWelcome) {
    return null
  }

  return (
    <>
      {/* Welcome Video */}
      {!hasSeenWelcome && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] rounded-lg p-6 mb-6 transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Welcome to DoorIQ!</h3>
              <p className="text-white/70 text-sm">
                Learn how DoorIQ works in 2 minutes
              </p>
            </div>
            <button
              onClick={handleCloseWelcome}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {showWelcomeVideo ? (
            <div className="aspect-video bg-black rounded-lg overflow-hidden w-1/2 mx-auto">
              {/* Embed video here - replace with actual video URL */}
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-white/60 text-sm">Video placeholder - Add your welcome video URL</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowWelcomeVideo(true)}
              className="w-1/2 mx-auto aspect-video bg-black/50 border border-white/10 rounded-lg flex items-center justify-center hover:border-purple-500/40 transition-colors group"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-purple-500/20 rounded-full flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <Play className="w-8 h-8 text-purple-400 ml-1" />
                </div>
                <p className="text-white font-medium">Watch How DoorIQ Works</p>
                <p className="text-white/60 text-sm mt-1">2 minutes</p>
              </div>
            </button>
          )}
        </motion.div>
      )}
    </>
  )
}

