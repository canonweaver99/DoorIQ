import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  generateMonthlyAnalyticsReport,
  generateWeeklyAnalyticsReport,
  generateTeamPerformanceReport,
  generateSkillBreakdownReport,
  generateRevenueReport,
  generateSessionReport,
  ReportType,
  ReportFormat
} from '@/lib/reports/generator'

export const dynamic = "force-static";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return available reports based on role
    const reports = [
      {
        id: 'monthly-analytics',
        name: 'Monthly Analytics Summary',
        type: 'monthly-analytics',
        availableFor: ['manager', 'rep']
      },
      {
        id: 'weekly-analytics',
        name: 'Weekly Analytics Summary',
        type: 'weekly-analytics',
        availableFor: ['manager', 'rep']
      },
      {
        id: 'session-report',
        name: 'Individual Session Reports',
        type: 'session-report',
        availableFor: ['rep']
      },
      {
        id: 'team-performance',
        name: 'Team Performance Report',
        type: 'team-performance',
        availableFor: ['manager']
      },
      {
        id: 'rep-comparison',
        name: 'Rep Performance Comparison',
        type: 'rep-comparison',
        availableFor: ['manager']
      },
      {
        id: 'skill-breakdown',
        name: 'Skill Breakdown Report',
        type: 'skill-breakdown',
        availableFor: ['manager', 'rep']
      },
      {
        id: 'revenue-earnings',
        name: 'Revenue & Earnings Report',
        type: 'revenue-earnings',
        availableFor: ['manager', 'rep']
      }
    ]

    const userRole = userData.role === 'admin' ? 'manager' : userData.role
    const availableReports = reports.filter(r => 
      r.availableFor.includes(userRole as 'manager' | 'rep')
    )

    return NextResponse.json({ reports: availableReports })
  } catch (error) {
    console.error('Error fetching available reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reportType, format, dateRange } = body as {
      reportType: ReportType
      format: ReportFormat
      dateRange?: 'weekly' | 'monthly' | 'custom'
    }

    if (!reportType || !format) {
      return NextResponse.json(
        { error: 'Report type and format are required' },
        { status: 400 }
      )
    }

    // Get user role and team info
    const { data: userData } = await supabase
      .from('users')
      .select('role, team_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userRole = userData.role === 'admin' ? 'manager' : userData.role

    // Verify access based on report type
    const managerOnlyReports: ReportType[] = ['team-performance', 'rep-comparison']
    if (managerOnlyReports.includes(reportType) && userRole !== 'manager') {
      return NextResponse.json(
        { error: 'Access denied: Manager role required' },
        { status: 403 }
      )
    }

    let reportResult: { content: string | Blob; filename: string; mimeType: string }

    switch (reportType) {
      case 'monthly-analytics':
      case 'weekly-analytics': {
        // Fetch analytics data
        const period = reportType === 'monthly-analytics' ? '30' : '7'
        const cookieHeader = request.headers.get('cookie') || ''
        const analyticsResponse = await fetch(
          `${request.nextUrl.origin}/api/team/analytics?period=${period}`,
          {
            headers: {
              cookie: cookieHeader,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!analyticsResponse.ok) {
          return NextResponse.json(
            { error: 'Failed to fetch analytics data' },
            { status: 500 }
          )
        }

        const { analytics } = await analyticsResponse.json()

        if (!analytics) {
          return NextResponse.json(
            { error: 'No analytics data available' },
            { status: 404 }
          )
        }

        if (reportType === 'monthly-analytics') {
          reportResult = generateMonthlyAnalyticsReport(analytics, format)
        } else {
          reportResult = generateWeeklyAnalyticsReport(analytics, format)
        }
        break
      }

      case 'team-performance': {
        // Fetch team analytics for rep performance
        const cookieHeader = request.headers.get('cookie') || ''
        const analyticsResponse = await fetch(
          `${request.nextUrl.origin}/api/team/analytics?period=30`,
          {
            headers: {
              cookie: cookieHeader,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!analyticsResponse.ok) {
          return NextResponse.json(
            { error: 'Failed to fetch team data' },
            { status: 500 }
          )
        }

        const { analytics } = await analyticsResponse.json()

        if (!analytics?.repPerformance || analytics.repPerformance.length === 0) {
          return NextResponse.json(
            { error: 'No team performance data available' },
            { status: 404 }
          )
        }

        reportResult = generateTeamPerformanceReport(analytics.repPerformance, format)
        break
      }

      case 'rep-comparison': {
        // Same as team performance for now
        const cookieHeader = request.headers.get('cookie') || ''
        const analyticsResponse = await fetch(
          `${request.nextUrl.origin}/api/team/analytics?period=30`,
          {
            headers: {
              cookie: cookieHeader,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!analyticsResponse.ok) {
          return NextResponse.json(
            { error: 'Failed to fetch team data' },
            { status: 500 }
          )
        }

        const { analytics } = await analyticsResponse.json()

        if (!analytics?.repPerformance || analytics.repPerformance.length === 0) {
          return NextResponse.json(
            { error: 'No team performance data available' },
            { status: 404 }
          )
        }

        reportResult = generateTeamPerformanceReport(analytics.repPerformance, format)
        break
      }

      case 'skill-breakdown': {
        const cookieHeader = request.headers.get('cookie') || ''
        const analyticsResponse = await fetch(
          `${request.nextUrl.origin}/api/team/analytics?period=30`,
          {
            headers: {
              cookie: cookieHeader,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!analyticsResponse.ok) {
          return NextResponse.json(
            { error: 'Failed to fetch analytics data' },
            { status: 500 }
          )
        }

        const { analytics } = await analyticsResponse.json()

        if (!analytics?.skillDistribution || analytics.skillDistribution.length === 0) {
          return NextResponse.json(
            { error: 'No skill data available' },
            { status: 404 }
          )
        }

        reportResult = generateSkillBreakdownReport(analytics.skillDistribution, format)
        break
      }

      case 'revenue-earnings': {
        const period = dateRange === 'weekly' ? 'week' : 'month'
        const cookieHeader = request.headers.get('cookie') || ''
        const revenueResponse = await fetch(
          `${request.nextUrl.origin}/api/team/revenue?period=${period}`,
          {
            headers: {
              cookie: cookieHeader,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!revenueResponse.ok) {
          return NextResponse.json(
            { error: 'Failed to fetch revenue data' },
            { status: 500 }
          )
        }

        const { revenueData } = await revenueResponse.json()

        if (!revenueData || revenueData.length === 0) {
          return NextResponse.json(
            { error: 'No revenue data available' },
            { status: 404 }
          )
        }

        reportResult = generateRevenueReport(revenueData, format)
        break
      }

      case 'session-report': {
        // Fetch user's sessions
        const { data: sessions, error: sessionsError } = await supabase
          .from('live_sessions')
          .select('id, overall_score, rapport_score, discovery_score, objection_handling_score, close_score, virtual_earnings, created_at, agent_name, sale_closed')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100)

        if (sessionsError) {
          return NextResponse.json(
            { error: 'Failed to fetch sessions' },
            { status: 500 }
          )
        }

        if (!sessions || sessions.length === 0) {
          return NextResponse.json(
            { error: 'No sessions found' },
            { status: 404 }
          )
        }

        reportResult = generateSessionReport(sessions, format)
        break
      }

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    // Return the report file
    const headers = new Headers()
    headers.set('Content-Type', reportResult.mimeType)
    headers.set('Content-Disposition', `attachment; filename="${reportResult.filename}"`)

    return new NextResponse(reportResult.content, {
      status: 200,
      headers
    })
  } catch (error: any) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

