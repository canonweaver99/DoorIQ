/**
 * Notification Service
 * Handles sending email notifications via Resend
 */

import { Resend } from 'resend'
import emailTemplates from '../email/templates'
import { createServiceSupabaseClient } from '../supabase/server'

// Lazy initialize Resend
function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured - notifications will be skipped')
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

interface NotificationOptions {
  type: 'sessionComplete' | 'achievement' | 'managerSessionAlert'
  userId: string
  data: any
  skipPreferenceCheck?: boolean
}

/**
 * Send an email notification to a user
 */
export async function sendNotification(options: NotificationOptions): Promise<boolean> {
  try {
    const { type, userId, data, skipPreferenceCheck = false } = options

    // Check if Resend is configured
    const resend = getResendClient()
    if (!resend) {
      console.log(`⏭️  Skipping ${type} notification - Resend not configured`)
      return false
    }

    // Get user email and preferences
    const supabase = await createServiceSupabaseClient()
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (userError || !user || !user.email) {
      console.error(`❌ User not found or no email: ${userId}`, userError)
      return false
    }

    // Check notification preferences (if table exists)
    if (!skipPreferenceCheck) {
      const prefKey = getPreferenceKey(type)
      if (prefKey) {
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select(prefKey)
          .eq('user_id', userId)
          .single()

        // If preferences exist and this type is disabled, skip
        if (prefs && prefs[prefKey] === false) {
          console.log(`⏭️  Skipping ${type} notification - user preference disabled`)
          return false
        }
      }
    }

    // Generate email content
    const template = getTemplate(type)
    if (!template) {
      console.error(`❌ Unknown notification type: ${type}`)
      return false
    }

    const emailData = {
      ...data,
      userName: user.full_name || 'there'
    }

    const { subject, html } = template(emailData)

    // Send email via Resend
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@dooriq.com'
    
    const { data: result, error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: user.email,
      subject,
      html
    })

    if (sendError) {
      console.error(`❌ Failed to send ${type} email to ${user.email}:`, sendError)
      return false
    }

    console.log(`✅ Sent ${type} email to ${user.email} (ID: ${result?.id})`)
    return true

  } catch (error) {
    console.error('❌ Notification service error:', error)
    return false
  }
}

/**
 * Send notification to multiple users
 */
export async function sendBatchNotifications(
  type: NotificationOptions['type'],
  userIds: string[],
  data: any
): Promise<{ sent: number; failed: number }> {
  const results = await Promise.allSettled(
    userIds.map(userId => 
      sendNotification({ type, userId, data })
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled' && r.value === true).length
  const failed = results.length - sent

  console.log(`📊 Batch ${type}: ${sent} sent, ${failed} failed`)
  return { sent, failed }
}

/**
 * Get the appropriate email template for a notification type
 */
function getTemplate(type: string) {
  switch (type) {
    case 'sessionComplete':
      return emailTemplates.sessionComplete
    case 'achievement':
      return emailTemplates.achievement
    case 'managerSessionAlert':
      return emailTemplates.managerSessionAlert
    default:
      return null
  }
}

/**
 * Map notification type to preference column name
 */
function getPreferenceKey(type: string): string | null {
  switch (type) {
    case 'sessionComplete':
      return 'email_session_complete'
    case 'achievement':
      return 'email_achievements'
    case 'managerSessionAlert':
      return 'email_team_sessions'
    default:
      return null
  }
}

/**
 * Get manager for a sales rep
 */
export async function getRepManager(repId: string): Promise<string | null> {
  try {
    const supabase = await createServiceSupabaseClient()
    
    // First get the rep's team
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', repId)
      .eq('status', 'active')
      .single()

    if (!membership) return null

    // Then find a manager in that team
    const { data: manager } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', membership.team_id)
      .eq('role', 'manager')
      .eq('status', 'active')
      .single()

    return manager?.user_id || null
  } catch (error) {
    console.error('Error getting rep manager:', error)
    return null
  }
}

/**
 * Detect achievements based on session results
 */
export async function detectAchievements(
  userId: string,
  sessionScore: number,
  saleClosed: boolean
): Promise<Array<{ type: string; title: string; description: string; emoji: string }>> {
  const achievements = []
  const supabase = await createServiceSupabaseClient()

  // Count user's sessions
  const { count: sessionCount } = await supabase
    .from('live_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // First Session
  if (sessionCount === 1) {
    achievements.push({
      type: 'first_session',
      title: 'First Steps',
      description: 'Completed your first training session',
      emoji: '🎯'
    })
  }

  // 10 Sessions Milestone
  if (sessionCount === 10) {
    achievements.push({
      type: 'ten_sessions',
      title: 'Dedicated Learner',
      description: 'Completed 10 training sessions',
      emoji: '🔥'
    })
  }

  // 50 Sessions Milestone
  if (sessionCount === 50) {
    achievements.push({
      type: 'fifty_sessions',
      title: 'Sales Expert',
      description: 'Completed 50 training sessions',
      emoji: '🏆'
    })
  }

  // Perfect Score
  if (sessionScore >= 95) {
    achievements.push({
      type: 'perfect_score',
      title: 'Near Perfect',
      description: 'Scored 95% or higher on a session',
      emoji: '⭐'
    })
  }

  // First Sale
  if (saleClosed) {
    const { count: salesCount } = await supabase
      .from('live_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('sale_closed', true)

    if (salesCount === 1) {
      achievements.push({
        type: 'first_sale',
        title: 'First Close',
        description: 'Closed your first sale in training',
        emoji: '💰'
      })
    }
  }

  return achievements
}

export default {
  sendNotification,
  sendBatchNotifications,
  getRepManager,
  detectAchievements
}

