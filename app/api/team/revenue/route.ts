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
        // Show last 10 days grouped by day
        startDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
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
          // Group by day (just date, no time)
          periodKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          fullPeriod = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
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
    let revenueData = Object.entries(groupedData).map(([period, data]) => ({
      period,
      fullPeriod: (data as any).fullPeriod,
      revenue: Math.round(data.revenue),
      repsWhoSold: data.repsWhoSold.size,
      totalSales: data.totalSales
    }))

    // For day period, fill in missing days with 0 revenue
    if (period === 'day') {
      const filledData: typeof revenueData = []
      const today = new Date(now)
      today.setHours(0, 0, 0, 0)
      
      for (let i = 9; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const existingData = revenueData.find(d => d.period === dateKey)
        
        if (existingData) {
          filledData.push(existingData)
        } else {
          filledData.push({
            period: dateKey,
            fullPeriod: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            revenue: 0,
            repsWhoSold: 0,
            totalSales: 0
          })
        }
      }
      
      revenueData = filledData
    } else {
      // Sort by period for other time periods
      revenueData.sort((a, b) => a.period.localeCompare(b.period))
    }

    return NextResponse.json({ revenueData })
  } catch (error) {
    console.error('Error in team revenue:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

