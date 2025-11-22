import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/stats
 * Admin-only endpoint to fetch comprehensive dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }
    
    // Fetch all statistics in parallel
    const [
      usersResult,
      activeUsersResult,
      subscriptionStatsResult,
      creditsResult,
      sessionsResult,
      organizationsResult,
      revenueResult
    ] = await Promise.all([
      // Total users count
      supabase.from('users').select('*', { count: 'exact', head: true }),
      
      // Active users (with sessions in last 30 days)
      supabase
        .from('live_sessions')
        .select('user_id')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Users by subscription status
      supabase.from('users').select('subscription_status'),
      
      // Credit statistics
      supabase.from('user_session_limits').select('sessions_this_month, sessions_limit, monthly_credits, purchased_credits'),
      
      // Session statistics
      supabase
        .from('live_sessions')
        .select('overall_score, rapport_score, objection_handling_score, outcome, sale_closed'),
      
      // Organizations
      supabase.from('organizations').select('seat_limit, stripe_subscription_id'),
      
      // Revenue calculation
      supabase
        .from('organizations')
        .select('seat_limit, stripe_subscription_id')
    ])
    
    // Process user statistics
    const totalUsers = usersResult.count || 0
    const activeUserIds = new Set((activeUsersResult.data || []).map(s => s.user_id))
    const activeUsers = activeUserIds.size
    
    // Process subscription statistics
    const subscriptionStats = {
      active: 0,
      trialing: 0,
      canceled: 0,
      past_due: 0,
      unpaid: 0,
      null: 0
    }
    
    ;(subscriptionStatsResult.data || []).forEach(user => {
      const status = user.subscription_status || 'null'
      if (status in subscriptionStats) {
        subscriptionStats[status as keyof typeof subscriptionStats]++
      } else {
        subscriptionStats.null++
      }
    })
    
    // Process credit statistics
    const creditsData = creditsResult.data || []
    const totalCreditsUsed = creditsData.reduce((sum, c) => sum + (c.sessions_this_month || 0), 0)
    const totalCreditsAvailable = creditsData.reduce((sum, c) => {
      const limit = c.sessions_limit || 0
      const monthly = c.monthly_credits || 0
      const purchased = c.purchased_credits || 0
      return sum + limit + monthly + purchased
    }, 0)
    const totalCreditsLimit = creditsData.reduce((sum, c) => sum + (c.sessions_limit || 0), 0)
    
    // Process session statistics
    const sessionsData = sessionsResult.data || []
    const totalSessions = sessionsData.length
    const sessionsWithScores = sessionsData.filter(s => s.overall_score !== null)
    const avgOverallScore = sessionsWithScores.length > 0
      ? sessionsWithScores.reduce((sum, s) => sum + (s.overall_score || 0), 0) / sessionsWithScores.length
      : 0
    const avgRapportScore = sessionsWithScores.length > 0
      ? sessionsWithScores.reduce((sum, s) => sum + (s.rapport_score || 0), 0) / sessionsWithScores.length
      : 0
    const avgObjectionScore = sessionsWithScores.length > 0
      ? sessionsWithScores.reduce((sum, s) => sum + (s.objection_handling_score || 0), 0) / sessionsWithScores.length
      : 0
    
    const successSessions = sessionsData.filter(s => s.outcome === 'SUCCESS').length
    const successRate = totalSessions > 0 ? (successSessions / totalSessions) * 100 : 0
    const salesClosed = sessionsData.filter(s => s.sale_closed === true).length
    const closeRate = totalSessions > 0 ? (salesClosed / totalSessions) * 100 : 0
    
    // Process revenue statistics
    const orgsData = organizationsResult.data || []
    const totalOrganizations = orgsData.length
    const activeSubscriptions = orgsData.filter(o => o.stripe_subscription_id).length
    const totalSeats = orgsData.reduce((sum, o) => sum + (o.seat_limit || 0), 0)
    const monthlyRevenue = orgsData.reduce((sum, o) => sum + ((o.seat_limit || 0) * 69), 0)
    const annualRevenue = monthlyRevenue * 12
    
    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        bySubscription: subscriptionStats
      },
      credits: {
        used: totalCreditsUsed,
        available: totalCreditsAvailable,
        limit: totalCreditsLimit
      },
      sessions: {
        total: totalSessions,
        avgOverallScore: Math.round(avgOverallScore),
        avgRapportScore: Math.round(avgRapportScore),
        avgObjectionScore: Math.round(avgObjectionScore),
        successRate: Math.round(successRate * 10) / 10,
        closeRate: Math.round(closeRate * 10) / 10,
        salesClosed
      },
      organizations: {
        total: totalOrganizations,
        activeSubscriptions,
        totalSeats
      },
      revenue: {
        monthly: monthlyRevenue,
        annual: annualRevenue
      }
    })
  } catch (error: any) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

