'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { DemoOnboarding } from './DemoOnboarding'

interface DemoSessionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DemoSessionModal({ isOpen, onClose }: DemoSessionModalProps) {
  const [showOnboarding, setShowOnboarding] = useState(true)
  const router = useRouter()

  const handleStartDemo = () => {
    setShowOnboarding(false)
    
    // Track demo start
    fetch('/api/analytics/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'started' })
    }).catch(() => {})

    // Navigate to trainer page with demo mode
    router.push('/trainer?demo=true&agent=agent_7001k5jqfjmtejvs77jvhjf254tz&name=Average%20Austin')
    onClose()
  }

  const handleSkipOnboarding = () => {
    handleStartDemo()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && showOnboarding && (
        <DemoOnboarding
          onSkip={handleSkipOnboarding}
          onStart={handleStartDemo}
        />
      )}
    </AnimatePresence>
  )
}
