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
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setData(prev => ({ ...prev, loading: false }))
      return
    }

    const { data: subscription } = await supabase
      .from('users')
      .select('subscription_status, trial_ends_at, subscription_current_period_end, subscription_cancel_at_period_end')
      .eq('id', user.id)
      .single()

    if (subscription) {
      const status = (subscription.subscription_status || 'none') as SubscriptionStatus
      const trialEndsAt = subscription.trial_ends_at
      const isTrialing = status === 'trialing' && trialEndsAt ? new Date(trialEndsAt) > new Date() : false
      const hasActiveSubscription = status === 'active' || isTrialing

      let daysRemainingInTrial: number | null = null
      if (isTrialing && trialEndsAt) {
        const now = new Date()
        const trialEnd = new Date(trialEndsAt)
        daysRemainingInTrial = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }

      setData({
        status,
        trialEndsAt,
        currentPeriodEnd: subscription.subscription_current_period_end,
        cancelAtPeriodEnd: subscription.subscription_cancel_at_period_end || false,
        hasActiveSubscription,
        isTrialing,
        isPastDue: status === 'past_due',
        daysRemainingInTrial,
        loading: false
      })
    } else {
      setData(prev => ({ ...prev, loading: false }))
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
    sessionsLimit: 10,
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
      // Check if user has active subscription
      const { data: subscription } = await supabase
        .from('users')
        .select('subscription_status, trial_ends_at')
        .eq('id', user.id)
        .single()

      const status = subscription?.subscription_status
      const isTrialing = status === 'trialing' && subscription?.trial_ends_at && new Date(subscription.trial_ends_at) > new Date()
      const hasActiveSubscription = status === 'active' || isTrialing

      if (hasActiveSubscription) {
        setData({
          canStartSession: true,
          sessionsRemaining: -1,
          sessionsUsed: 0,
          sessionsLimit: -1,
          isUnlimited: true,
          loading: false
        })
        return
      }

      // Get session limit data
      const { data: limitData } = await supabase
        .from('user_session_limits')
        .select('sessions_this_month, sessions_limit')
        .eq('user_id', user.id)
        .single()

      const sessionsUsed = limitData?.sessions_this_month || 0
      const sessionsLimit = limitData?.sessions_limit || 10
      const sessionsRemaining = Math.max(0, sessionsLimit - sessionsUsed)
      const canStartSession = sessionsUsed < sessionsLimit

      setData({
        canStartSession,
        sessionsRemaining,
        sessionsUsed,
        sessionsLimit,
        isUnlimited: false,
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

