'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Video } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PERSONA_METADATA } from '@/components/trainer/personas'

interface OnboardingElementsProps {
  totalSessions: number
}

export default function OnboardingElements({ totalSessions }: OnboardingElementsProps) {
  const router = useRouter()
  const [showWelcomeVideo, setShowWelcomeVideo] = useState(false)
  const [showFirstSessionPrompt, setShowFirstSessionPrompt] = useState(totalSessions === 0)
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false)

  useEffect(() => {
    // Check if user has seen welcome video before
    const seenWelcome = localStorage.getItem('dooriq_seen_welcome')
    setHasSeenWelcome(!!seenWelcome)
  }, [])

  const handleStartFirstSession = () => {
    // Navigate to Average Austin (beginner-friendly)
    const averageAustin = PERSONA_METADATA['Average Austin']
    const agentId = averageAustin?.card?.elevenAgentId
    if (agentId) {
      router.push(`/trainer?agent=${encodeURIComponent(agentId)}`)
    } else {
      router.push('/trainer')
    }
    setShowFirstSessionPrompt(false)
  }

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
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {/* Embed video here - replace with actual video URL */}
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-white/60 text-sm">Video placeholder - Add your welcome video URL</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowWelcomeVideo(true)}
              className="w-full aspect-video bg-black/50 border border-white/10 rounded-lg flex items-center justify-center hover:border-purple-500/40 transition-colors group"
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

      {/* Guided First Session Prompt */}
      <AnimatePresence>
        {showFirstSessionPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] rounded-lg p-6 mb-6 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center flex-shrink-0">
                <Play className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-2">
                  Try Your First Practice Session
                </h3>
                <p className="text-white/70 text-sm mb-4">
                  We'll walk you through your first practice with Average Austin. 
                  This is a great way to learn the basics and build confidence.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleStartFirstSession}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/20"
                  >
                    Start Guided Session
                  </button>
                  <button
                    onClick={() => setShowFirstSessionPrompt(false)}
                    className="px-4 py-2.5 text-white/60 hover:text-white transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

