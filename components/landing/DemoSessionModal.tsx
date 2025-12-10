'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DemoOnboarding } from './DemoOnboarding'

interface DemoSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onStartDemo: (sessionId: string) => void
}

export function DemoSessionModal({ isOpen, onClose, onStartDemo }: DemoSessionModalProps) {
  const [showOnboarding, setShowOnboarding] = useState(true)

  const handleStartDemo = async () => {
    setShowOnboarding(false)
    
    // Track demo start
    fetch('/api/analytics/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'started' })
    }).catch(() => {})

    // Create demo session
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_name: 'Average Austin',
          agent_id: 'agent_7001k5jqfjmtejvs77jvhjf254tz',
          is_free_demo: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        onStartDemo(data.id)
        onClose() // Close modal, demo will show in laptop
      } else {
        alert('Failed to start demo. Please try again.')
      }
    } catch (error) {
      console.error('Error creating demo session:', error)
      alert('Failed to start demo. Please try again.')
    }
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
