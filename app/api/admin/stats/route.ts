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
    
    // Calculate date ranges for today and yesterday
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)
    
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    const yesterdayEnd = new Date(todayStart)
    
    // Fetch all statistics in parallel (today's data)
    const [
      usersResult,
      activeUsersResult,
      subscriptionStatsResult,
      creditsResult,
      allSessionsResult,
      allOrganizationsResult,
      // Today's and yesterday's data for comparison
      todayNewUsersResult,
      yesterdayNewUsersResult,
      todaySessionsResult,
      yesterdaySessionsResult,
      todayOrganizationsResult,
      yesterdayOrganizationsResult
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
      
      // All sessions (for totals)
      supabase
        .from('live_sessions')
        .select('overall_score, rapport_score, objection_handling_score, outcome, sale_closed'),
      
      // All organizations (for totals)
      supabase.from('organizations').select('seat_limit, stripe_subscription_id'),
      
      // Today's new users (users created today)
      supabase.from('users').select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', todayEnd.toISOString()),
      
      // Yesterday's new users (users created yesterday)
      supabase.from('users').select('*', { count: 'exact', head: true })
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', yesterdayEnd.toISOString()),
      
      // Today's sessions
      supabase
        .from('live_sessions')
        .select('overall_score, rapport_score, objection_handling_score, outcome, sale_closed, created_at')
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', todayEnd.toISOString()),
      
      // Yesterday's sessions
      supabase
        .from('live_sessions')
        .select('overall_score, rapport_score, objection_handling_score, outcome, sale_closed, created_at')
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', yesterdayEnd.toISOString()),
      
      // Today's new organizations
      supabase.from('organizations').select('seat_limit, stripe_subscription_id')
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', todayEnd.toISOString()),
      
      // Yesterday's new organizations
      supabase.from('organizations').select('seat_limit, stripe_subscription_id')
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', yesterdayEnd.toISOString())
    ])
    
    // Process user statistics
    const totalUsers = usersResult.count || 0
    const activeUserIds = new Set((activeUsersResult.data || []).map(s => s.user_id))
    const activeUsers = activeUserIds.size
    
    // Today's and yesterday's new users
    const todayNewUsers = todayNewUsersResult.count || 0
    const yesterdayNewUsers = yesterdayNewUsersResult.count || 0
    
    // Calculate daily changes for users (new users today vs yesterday)
    const usersDailyChange = todayNewUsers - yesterdayNewUsers
    
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
    
    // Process session statistics (all time)
    const sessionsData = allSessionsResult.data || []
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
    
    // Today's and yesterday's session statistics
    const todaySessionsData = todaySessionsResult.data || []
    const todayTotalSessions = todaySessionsData.length
    const todaySuccessSessions = todaySessionsData.filter(s => s.outcome === 'SUCCESS').length
    const todaySuccessRate = todayTotalSessions > 0 ? (todaySuccessSessions / todayTotalSessions) * 100 : 0
    const todaySalesClosed = todaySessionsData.filter(s => s.sale_closed === true).length
    
    const yesterdaySessionsData = yesterdaySessionsResult.data || []
    const yesterdayTotalSessions = yesterdaySessionsData.length
    const yesterdaySuccessSessions = yesterdaySessionsData.filter(s => s.outcome === 'SUCCESS').length
    const yesterdaySuccessRate = yesterdayTotalSessions > 0 ? (yesterdaySuccessSessions / yesterdayTotalSessions) * 100 : 0
    const yesterdaySalesClosed = yesterdaySessionsData.filter(s => s.sale_closed === true).length
    
    // Calculate daily changes for sessions
    const sessionsDailyChange = todayTotalSessions - yesterdayTotalSessions
    const successRateDailyChange = todaySuccessRate - yesterdaySuccessRate
    const salesClosedDailyChange = todaySalesClosed - yesterdaySalesClosed
    
    // Process revenue statistics (all time)
    const orgsData = allOrganizationsResult.data || []
    const totalOrganizations = orgsData.length
    const activeSubscriptions = orgsData.filter(o => o.stripe_subscription_id).length
    const totalSeats = orgsData.reduce((sum, o) => sum + (o.seat_limit || 0), 0)
    const monthlyRevenue = orgsData.reduce((sum, o) => sum + ((o.seat_limit || 0) * 69), 0)
    const annualRevenue = monthlyRevenue * 12
    
    // Today's and yesterday's new organizations
    const todayOrgsData = todayOrganizationsResult.data || []
    const todayNewOrganizations = todayOrgsData.length
    const todayNewActiveSubscriptions = todayOrgsData.filter(o => o.stripe_subscription_id).length
    const todayNewRevenue = todayOrgsData.reduce((sum, o) => sum + ((o.seat_limit || 0) * 69), 0)
    
    const yesterdayOrgsData = yesterdayOrganizationsResult.data || []
    const yesterdayNewOrganizations = yesterdayOrgsData.length
    const yesterdayNewActiveSubscriptions = yesterdayOrgsData.filter(o => o.stripe_subscription_id).length
    const yesterdayNewRevenue = yesterdayOrgsData.reduce((sum, o) => sum + ((o.seat_limit || 0) * 69), 0)
    
    // Calculate daily changes for organizations and revenue
    const organizationsDailyChange = todayNewOrganizations - yesterdayNewOrganizations
    const activeSubscriptionsDailyChange = todayNewActiveSubscriptions - yesterdayNewActiveSubscriptions
    const revenueDailyChange = todayNewRevenue - yesterdayNewRevenue
    
    // Fetch Website Views from Vercel Analytics API
    let websiteViews = {
      total: 0,
      thisMonth: 0
    }
    
    try {
      const vercelApiToken = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_API_TOKEN
      const vercelTeamId = process.env.VERCEL_TEAM_ID
      const projectName = process.env.VERCEL_PROJECT_NAME || process.env.NEXT_PUBLIC_VERCEL_PROJECT_NAME || 'door-iq'
      
      if (vercelApiToken) {
        // First, get the project ID by listing projects
        let projectId: string | null = null
        let teamId: string | null = vercelTeamId || null
        
        try {
          // List projects to find our project
          const projectsUrl = teamId 
            ? `https://api.vercel.com/v9/projects?teamId=${teamId}&limit=100`
            : 'https://api.vercel.com/v9/projects?limit=100'
          
          const projectsResponse = await fetch(projectsUrl, {
            headers: {
              'Authorization': `Bearer ${vercelApiToken}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json()
            const project = projectsData.projects?.find((p: any) => 
              p.name?.toLowerCase() === projectName.toLowerCase() || 
              p.name === 'door-iq' || 
              p.name === 'dooriq' ||
              p.name === 'DoorIQ'
            )
            if (project) {
              projectId = project.id
              teamId = project.teamId || teamId
            }
          }
        } catch (error) {
          console.log('Could not fetch project list:', error)
        }
        
        // If we have a project ID, fetch analytics
        if (projectId) {
          try {
            // Calculate date ranges
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)
            
            // Try Vercel Analytics API endpoint
            // Vercel uses GraphQL for analytics, but we'll try REST endpoints first
            const baseUrl = teamId
              ? `https://api.vercel.com/v1/analytics?projectId=${projectId}&teamId=${teamId}`
              : `https://api.vercel.com/v1/analytics?projectId=${projectId}`
            
            // Try fetching analytics data
            // Note: Vercel Analytics API structure may vary - this is a best-effort implementation
            const analyticsParams = new URLSearchParams({
              since: oneYearAgo.toISOString(),
              until: now.toISOString(),
              granularity: 'day'
            })
            
            const analyticsUrl = `${baseUrl}&${analyticsParams.toString()}`
            
            const analyticsResponse = await fetch(analyticsUrl, {
              headers: {
                'Authorization': `Bearer ${vercelApiToken}`,
                'Content-Type': 'application/json'
              }
            })
            
            if (analyticsResponse.ok) {
              const analyticsData = await analyticsResponse.json()
              
              // Parse response - structure may vary
              if (analyticsData.pageviews !== undefined) {
                websiteViews.total = analyticsData.pageviews
              } else if (analyticsData.views !== undefined) {
                websiteViews.total = analyticsData.views
              } else if (analyticsData.data && Array.isArray(analyticsData.data)) {
                websiteViews.total = analyticsData.data.reduce((sum: number, item: any) => {
                  return sum + (item.pageviews || item.views || item.count || 0)
                }, 0)
              } else if (analyticsData.summary) {
                websiteViews.total = analyticsData.summary.pageviews || analyticsData.summary.views || 0
              }
              
              // Fetch this month's views
              const thisMonthParams = new URLSearchParams({
                since: startOfMonth.toISOString(),
                until: now.toISOString(),
                granularity: 'day'
              })
              
              const thisMonthUrl = `${baseUrl}&${thisMonthParams.toString()}`
              
              const thisMonthResponse = await fetch(thisMonthUrl, {
                headers: {
                  'Authorization': `Bearer ${vercelApiToken}`,
                  'Content-Type': 'application/json'
                }
              })
              
              if (thisMonthResponse.ok) {
                const thisMonthData = await thisMonthResponse.json()
                if (thisMonthData.pageviews !== undefined) {
                  websiteViews.thisMonth = thisMonthData.pageviews
                } else if (thisMonthData.views !== undefined) {
                  websiteViews.thisMonth = thisMonthData.views
                } else if (thisMonthData.data && Array.isArray(thisMonthData.data)) {
                  websiteViews.thisMonth = thisMonthData.data.reduce((sum: number, item: any) => {
                    return sum + (item.pageviews || item.views || item.count || 0)
                  }, 0)
                } else if (thisMonthData.summary) {
                  websiteViews.thisMonth = thisMonthData.summary.pageviews || thisMonthData.summary.views || 0
                }
              }
            } else {
              // If REST API doesn't work, log for debugging
              const errorText = await analyticsResponse.text()
              console.log('Vercel Analytics API response:', analyticsResponse.status, errorText.substring(0, 200))
            }
          } catch (error) {
            console.error('Error fetching Vercel Analytics:', error)
            // Silently fail - website views are optional
          }
        } else {
          console.log('Project ID not found for analytics')
        }
      }
    } catch (error) {
      // Silently fail - website views are optional
      console.log('Website views not available:', error)
    }
    
    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        bySubscription: subscriptionStats,
        dailyChange: usersDailyChange
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
        salesClosed,
        dailyChange: sessionsDailyChange,
        successRateDailyChange: Math.round(successRateDailyChange * 10) / 10,
        salesClosedDailyChange: salesClosedDailyChange
      },
      organizations: {
        total: totalOrganizations,
        activeSubscriptions,
        totalSeats,
        dailyChange: organizationsDailyChange,
        activeSubscriptionsDailyChange: activeSubscriptionsDailyChange
      },
      revenue: {
        monthly: monthlyRevenue,
        annual: annualRevenue,
        dailyChange: revenueDailyChange
      },
      websiteViews: {
        total: websiteViews.total,
        thisMonth: websiteViews.thisMonth
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

