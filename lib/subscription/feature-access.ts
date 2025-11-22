import { createServerSupabaseClient } from '@/lib/supabase/server'

// Feature keys matching the database feature_flags table
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
  BASIC_SESSIONS: 'basic_sessions',
  LEARNING_PAGE: 'learning_page',
} as const

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES]

/**
 * Server-side function to check if a user has access to a feature
 * @param userId - The user's ID
 * @param featureKey - The feature key to check
 * @returns Promise<boolean> - Whether the user has access
 */
export async function checkFeatureAccess(
  userId: string,
  featureKey: FeatureKey
): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase.rpc('user_has_feature_access', {
      p_user_id: userId,
      p_feature_key: featureKey,
    })

    if (error) {
      console.error('Error checking feature access:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Error checking feature access:', error)
    return false
  }
}

/**
 * Server-side function to check session limit for a user
 * @param userId - The user's ID
 * @returns Promise<boolean> - Whether user can start a new session
 */
export async function checkSessionLimit(userId: string): Promise<{
  canStartSession: boolean
  sessionsRemaining: number
  sessionsUsed: number
  sessionsLimit: number
}> {
  try {
    const supabase = await createServerSupabaseClient()

    // Check subscription status first
    const { data: user } = await supabase
      .from('users')
      .select('subscription_status, trial_ends_at')
      .eq('id', userId)
      .single()

    // All users now use credit-based system, including paid users (50 credits/month)
    // Removed unlimited access - paid users get 50 credits/month

    // Check session limits using RPC
    const { data: canStart, error: limitError } = await supabase.rpc(
      'check_user_session_limit',
      { p_user_id: userId }
    )

    if (limitError) {
      console.error('Error checking session limit:', limitError)
      return {
        canStartSession: false,
        sessionsRemaining: 0,
        sessionsUsed: 0,
        sessionsLimit: 5,
      }
    }

    // Get current usage
    const { data: limitData } = await supabase
      .from('user_session_limits')
      .select('sessions_this_month, sessions_limit')
      .eq('user_id', userId)
      .single()

    const sessionsUsed = limitData?.sessions_this_month || 0
    const sessionsLimit = limitData?.sessions_limit || 5
    const sessionsRemaining = Math.max(0, sessionsLimit - sessionsUsed)

    return {
      canStartSession: canStart === true,
      sessionsRemaining,
      sessionsUsed,
      sessionsLimit,
    }
  } catch (error) {
    console.error('Error checking session limit:', error)
    return {
      canStartSession: false,
      sessionsRemaining: 0,
      sessionsUsed: 0,
      sessionsLimit: 5,
    }
  }
}

/**
 * Server-side helper to fetch a user's subscription status and derived flags
 */
export async function getUserSubscription(userId: string): Promise<{
  status: string | null
  hasActiveSubscription: boolean
  isTrialing: boolean
  daysRemainingInTrial: number | null
  trialEndsAt: string | null
}> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: user } = await supabase
      .from('users')
      .select('subscription_status, trial_ends_at')
      .eq('id', userId)
      .single()

    const status = (user as any)?.subscription_status ?? null
    const trialEndsAt = (user as any)?.trial_ends_at ?? null
    const now = Date.now()
    const trialEndMs = trialEndsAt ? new Date(trialEndsAt).getTime() : null
    const isTrialing = status === 'trialing' && trialEndMs !== null && trialEndMs > now
    const hasActiveSubscription = status === 'active' || isTrialing
    const daysRemainingInTrial = isTrialing && trialEndMs
      ? Math.max(0, Math.ceil((trialEndMs - now) / (1000 * 60 * 60 * 24)))
      : null

    return {
      status,
      hasActiveSubscription,
      isTrialing,
      daysRemainingInTrial,
      trialEndsAt,
    }
  } catch (error) {
    console.error('Error fetching user subscription:', error)
    return {
      status: null,
      hasActiveSubscription: false,
      isTrialing: false,
      daysRemainingInTrial: null,
      trialEndsAt: null,
    }
  }
}

/**
 * Server-side function to increment session count
 * @param userId - The user's ID
 */
export async function incrementSessionCount(userId: string): Promise<void> {
  try {
    const supabase = await createClient()

    await supabase.rpc('increment_user_session_count', {
      p_user_id: userId,
    })
  } catch (error) {
    console.error('Error incrementing session count:', error)
  }
}
