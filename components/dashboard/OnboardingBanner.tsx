'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, X, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

interface OnboardingStatus {
  onboarding_completed: boolean
  onboarding_dismissed: boolean
}

export function OnboardingBanner() {
  const router = useRouter()
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissing, setDismissing] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/onboarding/status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Error fetching onboarding status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async () => {
    try {
      setDismissing(true)
      await fetch('/api/onboarding/dismiss', {
        method: 'POST',
      })
      setStatus((prev) => (prev ? { ...prev, onboarding_dismissed: true } : null))
    } catch (error) {
      console.error('Error dismissing onboarding:', error)
    } finally {
      setDismissing(false)
    }
  }

  const handleContinue = () => {
    router.push('/dashboard/getting-started')
  }

  if (loading || !status) {
    return null
  }

  // Show banner only if onboarding is not completed and not dismissed
  if (status.onboarding_completed || status.onboarding_dismissed) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6 p-4 bg-gradient-to-r from-[#00d4aa]/20 to-purple-500/20 border border-[#00d4aa]/30 rounded-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#00d4aa]" />
            <div>
              <h3 className="font-semibold text-white mb-1">
                Complete your setup to get the most out of DoorIQ
              </h3>
              <p className="text-sm text-gray-300">
                Finish onboarding to unlock all features and start training your team effectively.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleContinue}
              className="bg-[#00d4aa] hover:bg-[#00c19a] text-black font-semibold"
            >
              Continue Setup
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <button
              onClick={handleDismiss}
              disabled={dismissing}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              {dismissing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

