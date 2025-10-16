import { createClient } from '@supabase/supabase-js'

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'none'

export interface UserSubscription {
  status: SubscriptionStatus
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  hasActiveSubscription: boolean
  isTrialing: boolean
  isPastDue: boolean
  daysRemainingInTrial: number | null
}

// Feature keys that can be checked
export const FEATURES = {
  ALL_AGENTS: 'all_agents',
  UNLIMITED_SESSIONS: 'unlimited_sessions',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  CALL_RECORDING: 'call_recording',
  EXPORT_REPORTS: 'export_reports',
  CUSTOM_SCENARIOS: 'custom_scenarios',
  TEAM_FEATURES: 'team_features',
  PRIORITY_SUPPORT: 'priority_support',
  BASIC_AGENTS: 'basic_agents',
  BASIC_SESSIONS: 'basic_sessions'
} as const

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES]

/**
 * Check if user has access to a specific feature
 * This is a server-side function that should be called from API routes or server components
 */
export async function checkFeatureAccess(
  userId: string,
  featureKey: FeatureKey
): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase.rpc('user_has_feature_access', {
    p_user_id: userId,
    p_feature_key: featureKey
  })

  if (error) {
    console.error('Error checking feature access:', error)
    return false
  }

  return data === true
}

/**
 * Get user's subscription details
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('users')
    .select('subscription_status, trial_ends_at, subscription_current_period_end, subscription_cancel_at_period_end')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return {
      status: 'none',
      trialEndsAt: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      hasActiveSubscription: false,
      isTrialing: false,
      isPastDue: false,
      daysRemainingInTrial: null
    }
  }

  const status = (data.subscription_status || 'none') as SubscriptionStatus
  const trialEndsAt = data.trial_ends_at
  const isTrialing = status === 'trialing' && trialEndsAt ? new Date(trialEndsAt) > new Date() : false
  const hasActiveSubscription = status === 'active' || isTrialing

  let daysRemainingInTrial: number | null = null
  if (isTrialing && trialEndsAt) {
    const now = new Date()
    const trialEnd = new Date(trialEndsAt)
    daysRemainingInTrial = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  return {
    status,
    trialEndsAt,
    currentPeriodEnd: data.subscription_current_period_end,
    cancelAtPeriodEnd: data.subscription_cancel_at_period_end || false,
    hasActiveSubscription,
    isTrialing,
    isPastDue: status === 'past_due',
    daysRemainingInTrial
  }
}

/**
 * Check if user can start a new session (respects session limits for free users)
 */
export async function checkSessionLimit(userId: string): Promise<{
  canStartSession: boolean
  sessionsRemaining: number
  sessionsUsed: number
  sessionsLimit: number
  isUnlimited: boolean
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check if user has active subscription (unlimited sessions)
  const subscription = await getUserSubscription(userId)
  if (subscription.hasActiveSubscription) {
    return {
      canStartSession: true,
      sessionsRemaining: -1, // -1 indicates unlimited
      sessionsUsed: 0,
      sessionsLimit: -1,
      isUnlimited: true
    }
  }

  // Check session limit for free users
  const { data: canStart } = await supabase.rpc('check_user_session_limit', {
    p_user_id: userId
  })

  // Get current session count
  const { data: limitData } = await supabase
    .from('user_session_limits')
    .select('sessions_this_month, sessions_limit')
    .eq('user_id', userId)
    .single()

  const sessionsUsed = limitData?.sessions_this_month || 0
  const sessionsLimit = limitData?.sessions_limit || 10
  const sessionsRemaining = Math.max(0, sessionsLimit - sessionsUsed)

  return {
    canStartSession: canStart === true,
    sessionsRemaining,
    sessionsUsed,
    sessionsLimit,
    isUnlimited: false
  }
}

/**
 * Increment session count for a user (only affects free tier users)
 */
export async function incrementSessionCount(userId: string): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await supabase.rpc('increment_user_session_count', {
    p_user_id: userId
  })
}

/**
 * Get list of accessible agent IDs for the user based on subscription
 */
export async function getAccessibleAgents(userId: string): Promise<string[]> {
  const hasAllAgents = await checkFeatureAccess(userId, FEATURES.ALL_AGENTS)
  
  // All 12 agent IDs
  const allAgents = [
    'austin',
    'karen',
    'sarah',
    'michael',
    'jessica',
    'robert',
    'emily',
    'david',
    'sophia',
    'james',
    'olivia',
    'william'
  ]

  // Basic 3 agents for free tier
  const basicAgents = ['austin', 'karen', 'sarah']

  return hasAllAgents ? allAgents : basicAgents
}

/**
 * Check if user needs to be shown upgrade prompt
 */
export async function shouldShowUpgradePrompt(userId: string): Promise<{
  show: boolean
  reason: 'no_subscription' | 'trial_ending' | 'session_limit' | null
  message: string
}> {
  const subscription = await getUserSubscription(userId)
  
  // No subscription
  if (subscription.status === 'none' || subscription.status === 'canceled') {
    return {
      show: true,
      reason: 'no_subscription',
      message: 'Upgrade to access all premium features with a 7-day free trial!'
    }
  }

  // Trial ending soon (less than 2 days)
  if (subscription.isTrialing && subscription.daysRemainingInTrial !== null && subscription.daysRemainingInTrial <= 2) {
    return {
      show: true,
      reason: 'trial_ending',
      message: `Your trial ends in ${subscription.daysRemainingInTrial} day${subscription.daysRemainingInTrial !== 1 ? 's' : ''}. Continue with full access!`
    }
  }

  // Check session limit for free users
  if (!subscription.hasActiveSubscription) {
    const sessionInfo = await checkSessionLimit(userId)
    if (sessionInfo.sessionsRemaining <= 2 && sessionInfo.sessionsRemaining >= 0) {
      return {
        show: true,
        reason: 'session_limit',
        message: `Only ${sessionInfo.sessionsRemaining} practice session${sessionInfo.sessionsRemaining !== 1 ? 's' : ''} remaining this month. Upgrade for unlimited access!`
      }
    }
  }

  return {
    show: false,
    reason: null,
    message: ''
  }
}

