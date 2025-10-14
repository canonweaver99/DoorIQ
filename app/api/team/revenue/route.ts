import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's team_id
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('team_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile?.team_id) {
      return NextResponse.json({ revenueData: [] })
    }

    // Get team members
    const { data: teamMembers } = await supabase
      .from('users')
      .select('id')
      .eq('team_id', userProfile.team_id)

    const teamMemberIds = teamMembers?.map(m => m.id) || []
    
    if (teamMemberIds.length === 0) {
      return NextResponse.json({ revenueData: [] })
    }

    // Get time period from query
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'

    // Calculate date range
    let startDate: Date
    const now = new Date()

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days
        break
      case 'week':
        startDate = new Date(now.getTime() - 6 * 7 * 24 * 60 * 60 * 1000) // 6 weeks
        break
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1) // 6 months
        break
    }

    // Get sessions in date range
    const { data: sessions, error: sessionsError } = await supabase
      .from('live_sessions')
      .select('user_id, virtual_earnings, sale_closed, created_at')
      .in('user_id', teamMemberIds)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 })
    }

    // Group sessions by period
    const groupedData: { [key: string]: { revenue: number; repsWhoSold: Set<string>; totalSales: number } } = {}

    sessions?.forEach(session => {
      const date = new Date(session.created_at)
      let periodKey: string
      let fullPeriod: string

      switch (period) {
        case 'day':
          periodKey = date.toLocaleDateString('en-US', { weekday: 'short' })
          fullPeriod = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          periodKey = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekEnd.getDate() + 6)
          fullPeriod = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          break
        case 'month':
        default:
          periodKey = date.toLocaleDateString('en-US', { month: 'short' })
          fullPeriod = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          break
      }

      if (!groupedData[periodKey]) {
        groupedData[periodKey] = { revenue: 0, repsWhoSold: new Set(), totalSales: 0, fullPeriod }
      }

      groupedData[periodKey].revenue += session.virtual_earnings || 0
      if (session.sale_closed) {
        groupedData[periodKey].repsWhoSold.add(session.user_id)
        groupedData[periodKey].totalSales += 1
      }
    })

    // Convert to array format
    const revenueData = Object.entries(groupedData).map(([period, data]) => ({
      period,
      fullPeriod: (data as any).fullPeriod,
      revenue: Math.round(data.revenue),
      repsWhoSold: data.repsWhoSold.size,
      totalSales: data.totalSales
    }))

    return NextResponse.json({ revenueData })
  } catch (error) {
    console.error('Error in team revenue:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

