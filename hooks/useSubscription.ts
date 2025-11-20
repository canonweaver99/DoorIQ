'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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
    // Stripe/billing removed - always return no subscription
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
    sessionsLimit: 5,
    isUnlimited: false,
    loading: true
  })

  const fetchSessionLimit = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setData(prev => ({ ...prev, loading: false }))
      return
    }

    try {
      // Stripe/billing removed - use default free tier limits
      // Get session limit data
      const { data: limitData } = await supabase
        .from('user_session_limits')
        .select('sessions_this_month, sessions_limit, monthly_credits, purchased_credits')
        .eq('user_id', user.id)
        .single()

      // Calculate total available credits (free tier only)
      const monthlyCredits = limitData?.monthly_credits || null
      const purchasedCredits = limitData?.purchased_credits || 0
      const totalLimit = limitData?.sessions_limit || 5
      const sessionsUsed = limitData?.sessions_this_month || 0
      const sessionsRemaining = Math.max(0, totalLimit - sessionsUsed)
      const canStartSession = sessionsUsed < totalLimit

      setData({
        canStartSession,
        sessionsRemaining,
        sessionsUsed,
        sessionsLimit: totalLimit,
        isUnlimited: false, // No longer unlimited for paid users
        loading: false
      })
    } catch (error) {
      console.error('Error fetching session limit:', error)
      setData(prev => ({ ...prev, loading: false }))
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

