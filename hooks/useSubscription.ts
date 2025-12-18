'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isFreePeriod, getDaysRemainingInFreePeriod, getFreePeriodEndDate } from '@/lib/subscription/free-period'

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'none'

export interface SubscriptionData {
  status: SubscriptionStatus
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  hasActiveSubscription: boolean
  isTrialing: boolean
  isPastDue: boolean
  daysRemainingInTrial: number | null
  loading: boolean
}

export interface SessionLimitData {
  canStartSession: boolean
  sessionsRemaining: number
  sessionsUsed: number
  sessionsLimit: number
  isUnlimited: boolean
  loading: boolean
}

/**
 * Hook to get current user's subscription status
 */
export function useSubscription(): SubscriptionData & { refetch: () => Promise<void> } {
  const [data, setData] = useState<SubscriptionData>({
    status: 'none',
    trialEndsAt: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    hasActiveSubscription: false,
    isTrialing: false,
    isPastDue: false,
    daysRemainingInTrial: null,
    loading: true
  })

  const fetchSubscription = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setData({
          status: 'none',
          trialEndsAt: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          hasActiveSubscription: false,
          isTrialing: false,
          isPastDue: false,
          daysRemainingInTrial: null,
          loading: false
        })
        return
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('subscription_status, trial_ends_at, subscription_current_period_end, subscription_cancel_at_period_end')
        .eq('id', user.id)
        .single()

      if (error || !userData) {
        setData({
          status: 'none',
          trialEndsAt: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          hasActiveSubscription: false,
          isTrialing: false,
          isPastDue: false,
          daysRemainingInTrial: null,
          loading: false
        })
        return
      }

      // Free period until Jan 1st, 2025 - everyone has full access
      if (isFreePeriod()) {
        const daysRemaining = getDaysRemainingInFreePeriod()
        const freePeriodEnd = getFreePeriodEndDate().toISOString()
        
        setData({
          status: 'active' as SubscriptionStatus,
          trialEndsAt: freePeriodEnd,
          currentPeriodEnd: freePeriodEnd,
          cancelAtPeriodEnd: false,
          hasActiveSubscription: true,
          isTrialing: false,
          isPastDue: false,
          daysRemainingInTrial: daysRemaining,
          loading: false
        })
        return
      }

      // ARCHIVED: All paywalls removed - software is now free for signed-in users
      // Return active subscription status for all authenticated users
      const status = 'active' as SubscriptionStatus
      const hasActiveSubscription = true
      const isTrialing = false

      setData({
        status,
        trialEndsAt: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        hasActiveSubscription,
        isTrialing,
        isPastDue: false,
        daysRemainingInTrial: null,
        loading: false
      })
    } catch (error) {
      console.error('Error fetching subscription:', error)
      setData({
        status: 'none',
        trialEndsAt: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        hasActiveSubscription: false,
        isTrialing: false,
        isPastDue: false,
        daysRemainingInTrial: null,
        loading: false
      })
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [])

  return {
    ...data,
    refetch: fetchSubscription
  }
}

/**
 * Hook to check session limits for the current user
 */
export function useSessionLimit(): SessionLimitData & { refresh: () => Promise<void> } {
  const [data, setData] = useState<SessionLimitData>({
    canStartSession: true,
    sessionsRemaining: 0,
    sessionsUsed: 0,
    sessionsLimit: 75, // Universal 75 limit for all users
    isUnlimited: false,
    loading: true
  })

  const fetchSessionLimit = async () => {
    // During free period (until Jan 1st), unlimited sessions
    if (isFreePeriod()) {
      setData({
        canStartSession: true,
        sessionsRemaining: 999999,
        sessionsUsed: 0,
        sessionsLimit: 999999,
        isUnlimited: true,
        loading: false
      })
      return
    }

    try {
      const response = await fetch('/api/session/check-limit')
      if (response.ok) {
        const limitInfo = await response.json()
        setData({
          canStartSession: limitInfo.canStartSession || false,
          sessionsRemaining: limitInfo.sessionsRemaining || 0,
          sessionsUsed: limitInfo.sessionsUsed || 0,
          sessionsLimit: limitInfo.sessionsLimit || 75,
          isUnlimited: false, // Everyone has 75 limit
          loading: false
        })
      } else if (response.status === 401) {
        // 401 is expected when user is not logged in - silently handle
        setData({
          canStartSession: true,
          sessionsRemaining: 75,
          sessionsUsed: 0,
          sessionsLimit: 75,
          isUnlimited: false,
          loading: false
        })
      } else {
        // Other errors - fallback to default
        setData({
          canStartSession: true,
          sessionsRemaining: 75,
          sessionsUsed: 0,
          sessionsLimit: 75,
          isUnlimited: false,
          loading: false
        })
      }
    } catch (error: any) {
      // Suppress 401 errors (expected when not logged in)
      if (error?.message?.includes('401') || error?.status === 401) {
        setData({
          canStartSession: true,
          sessionsRemaining: 75,
          sessionsUsed: 0,
          sessionsLimit: 75,
          isUnlimited: false,
          loading: false
        })
        return
      }
      // Only log non-401 errors
      console.error('Error fetching session limit:', error)
      // Fallback to default
      setData({
        canStartSession: true,
        sessionsRemaining: 75,
        sessionsUsed: 0,
        sessionsLimit: 75,
        isUnlimited: false,
        loading: false
      })
    }
  }

  useEffect(() => {
    fetchSessionLimit()
  }, [])

  return {
    ...data,
    refresh: fetchSessionLimit
  }
}

/**
 * Hook to check if user has access to a specific feature
 */
export function useFeatureAccess(featureKey: string): {
  hasAccess: boolean
  loading: boolean
} {
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      // During free period (until Jan 1st), everyone has access to all features
      if (isFreePeriod()) {
        setHasAccess(true)
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.rpc('user_has_feature_access', {
          p_user_id: user.id,
          p_feature_key: featureKey
        })

        if (!error) {
          setHasAccess(data === true)
        }
      } catch (error) {
        console.error('Error checking feature access:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [featureKey])

  return { hasAccess, loading }
}

