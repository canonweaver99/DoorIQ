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
        // Show last 7 days with hourly data from 6am-midnight
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'week':
        // Show last 8 weeks, Monday-Sunday
        const weeksBack = 8
        const mondayOfThisWeek = new Date(now)
        mondayOfThisWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1))
        startDate = new Date(mondayOfThisWeek.getTime() - (weeksBack - 1) * 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
      default:
        // Show current month plus last 5 months (6 total)
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
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
          // Group by hour from 6am-midnight
          const hour = date.getHours()
          if (hour < 6) {
            // Sessions before 6am count as previous day's midnight hour
            const prevDay = new Date(date)
            prevDay.setDate(prevDay.getDate() - 1)
            periodKey = `${prevDay.toLocaleDateString('en-US', { weekday: 'short' })} 11PM`
            fullPeriod = `${prevDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 11:00 PM`
          } else {
            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
            const period = hour >= 12 ? 'PM' : 'AM'
            periodKey = `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${displayHour}${period}`
            fullPeriod = `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${displayHour}:00 ${period}`
          }
          break
        case 'week':
          // Group by Monday-Sunday weeks
          const mondayOfWeek = new Date(date)
          const daysSinceMonday = date.getDay() === 0 ? 6 : date.getDay() - 1
          mondayOfWeek.setDate(date.getDate() - daysSinceMonday)
          mondayOfWeek.setHours(0, 0, 0, 0)
          
          const sundayOfWeek = new Date(mondayOfWeek)
          sundayOfWeek.setDate(sundayOfWeek.getDate() + 6)
          
          periodKey = `Week of ${mondayOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          fullPeriod = `${mondayOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${sundayOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          break
        case 'month':
        default:
          periodKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
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

