export const dynamic = "force-static";

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/homepage/weekly-sessions
 * Get weekly session counts grouped by day of week for the ActivityChartCard
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // TEMPORARY: Return empty data if no user (for testing)
    if (authError || !user) {
      return NextResponse.json({
        weeklySessions: [
          { day: "S", value: 0 },
          { day: "M", value: 0 },
          { day: "T", value: 0 },
          { day: "W", value: 0 },
          { day: "T", value: 0 },
          { day: "F", value: 0 },
          { day: "S", value: 0 },
        ],
        totalSessions: 0,
        previousWeekTotal: 0,
      })
    }

    // Get sessions from last 14 days (current week + previous week for comparison)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const { data: sessions, error: sessionsError } = await supabase
      .from('live_sessions')
      .select('id, started_at, created_at')
      .eq('user_id', user.id)
      .gte('started_at', fourteenDaysAgo.toISOString())
      .order('started_at', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    const validSessions = sessions || []

    // Get current week start (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    // Get previous week start (7-14 days ago)
    const previousWeekStart = new Date(sevenDaysAgo)
    previousWeekStart.setDate(previousWeekStart.getDate() - 7)

    // Filter sessions by week
    const currentWeekSessions = validSessions.filter(s => {
      const sessionDate = new Date(s.started_at || s.created_at)
      return sessionDate >= sevenDaysAgo
    })

    const previousWeekSessions = validSessions.filter(s => {
      const sessionDate = new Date(s.started_at || s.created_at)
      return sessionDate >= previousWeekStart && sessionDate < sevenDaysAgo
    })

    // Initialize day counts for current week (Sunday = 0, Monday = 1, etc.)
    const dayCounts: Record<number, number> = {
      0: 0, // Sunday
      1: 0, // Monday
      2: 0, // Tuesday
      3: 0, // Wednesday
      4: 0, // Thursday
      5: 0, // Friday
      6: 0, // Saturday
    }

    // Count sessions by day of week for current week
    currentWeekSessions.forEach(session => {
      const sessionDate = new Date(session.started_at || session.created_at)
      const dayOfWeek = sessionDate.getDay()
      dayCounts[dayOfWeek] = (dayCounts[dayOfWeek] || 0) + 1
    })

    // Format as array starting from Sunday
    const weeklySessions = [
      { day: "S", value: dayCounts[0] || 0 }, // Sunday
      { day: "M", value: dayCounts[1] || 0 }, // Monday
      { day: "T", value: dayCounts[2] || 0 }, // Tuesday
      { day: "W", value: dayCounts[3] || 0 }, // Wednesday
      { day: "T", value: dayCounts[4] || 0 }, // Thursday
      { day: "F", value: dayCounts[5] || 0 }, // Friday
      { day: "S", value: dayCounts[6] || 0 }, // Saturday
    ]

    const totalSessions = currentWeekSessions.length
    const previousWeekTotal = previousWeekSessions.length

    return NextResponse.json({
      weeklySessions,
      totalSessions,
      previousWeekTotal,
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

