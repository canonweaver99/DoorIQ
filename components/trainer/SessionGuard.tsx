'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useSubscription, useSessionLimit } from '@/hooks/useSubscription'
import { PaywallModal } from '@/components/subscription/PaywallModal'
import { TrialBanner } from '@/components/subscription/TrialBanner'
import { SessionLimitBanner } from '@/components/subscription/SessionLimitBanner'

interface SessionGuardProps {
  children: ReactNode
  onSessionStart?: () => void
}

/**
 * Component that guards trainer sessions and shows appropriate banners/modals
 */
export default function SessionGuard({ children, onSessionStart }: SessionGuardProps) {
  const subscription = useSubscription()
  const sessionLimit = useSessionLimit()
  const [showPaywall, setShowPaywall] = useState(false)
  const [paywallReason, setPaywallReason] = useState<'feature_locked' | 'session_limit' | 'trial_ended'>('feature_locked')

  // Check if user can start a session
  useEffect(() => {
    const checkAccess = async () => {
      // If subscription is active or trialing, they have full access
      if (subscription.hasActiveSubscription) {
        return
      }

      // If no session limit data yet, wait
      if (sessionLimit.loading) {
        return
      }

      // If they've hit their session limit, show paywall
      if (!sessionLimit.canStartSession) {
        setPaywallReason('session_limit')
        setShowPaywall(true)
      }
    }

    checkAccess()
  }, [subscription, sessionLimit])

  const handleStartSession = async () => {
    // Check if they have access
    if (!subscription.hasActiveSubscription && !sessionLimit.canStartSession) {
      setPaywallReason('session_limit')
      setShowPaywall(true)
      return false
    }

    // Increment session count (only affects free users)
    try {
      await fetch('/api/session/increment', { method: 'POST' })
      sessionLimit.refresh()
    } catch (error) {
      console.error('Failed to increment session count:', error)
    }

    onSessionStart?.()
    return true
  }

  return (
    <>
      {/* Trial Banner - show if user is in trial */}
      {subscription.isTrialing && subscription.daysRemainingInTrial !== null && subscription.trialEndsAt && (
        <TrialBanner
          daysRemaining={subscription.daysRemainingInTrial}
          trialEndsAt={subscription.trialEndsAt}
        />
      )}

      {/* Session Limit Banner - show for free users approaching limit */}
      {!subscription.hasActiveSubscription && !sessionLimit.isUnlimited && (
        <SessionLimitBanner
          sessionsRemaining={sessionLimit.sessionsRemaining}
          sessionsLimit={sessionLimit.sessionsLimit}
          sessionsUsed={sessionLimit.sessionsUsed}
        />
      )}

      {/* Main Content */}
      {children}

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        reason={paywallReason}
        sessionsRemaining={sessionLimit.sessionsRemaining}
      />
    </>
  )
}

// Export the session start handler as a separate hook
export function useSessionGuard() {
  const subscription = useSubscription()
  const sessionLimit = useSessionLimit()
  const [showPaywall, setShowPaywall] = useState(false)

  const checkAndStartSession = async (): Promise<boolean> => {
    // Check if they have access
    if (!subscription.hasActiveSubscription && !sessionLimit.canStartSession) {
      setShowPaywall(true)
      return false
    }

    // Increment session count (only affects free users)
    try {
      await fetch('/api/session/increment', { method: 'POST' })
      await sessionLimit.refresh()
    } catch (error) {
      console.error('Failed to increment session count:', error)
    }

    return true
  }

  return {
    checkAndStartSession,
    showPaywall,
    setShowPaywall,
    subscription,
    sessionLimit
  }
}

