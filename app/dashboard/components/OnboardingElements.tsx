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

  return null
}

