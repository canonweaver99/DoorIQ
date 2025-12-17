
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/homepage/streak
 * Calculate daily practice streak
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check authentication - TEMPORARILY DISABLED FOR TESTING
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // TEMPORARY: Return empty streak if no user (for testing)
    if (authError || !user) {
      return NextResponse.json({
        streak: 0,
        lastPracticeDate: null
      })
    }

    // Get all distinct practice dates (only completed sessions with scores)
    const { data: sessions, error: sessionsError } = await supabase
      .from('live_sessions')
      .select('started_at')
      .eq('user_id', user.id)
      .not('overall_score', 'is', null)
      .order('started_at', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching sessions for streak:', sessionsError)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        streak: 0,
        lastPracticeDate: null
      })
    }

    // Extract unique dates (YYYY-MM-DD format)
    const practiceDates = new Set<string>()
    sessions.forEach(session => {
      const date = new Date(session.started_at).toISOString().split('T')[0]
      practiceDates.add(date)
    })

    // Sort dates descending
    const sortedDates = Array.from(practiceDates).sort((a, b) => b.localeCompare(a))

    // Calculate streak: consecutive days ending today
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    let streak = 0
    let currentDate = new Date(today)
    
    // Check if user practiced today or yesterday (allows for same-day streak)
    const hasToday = sortedDates.includes(today)
    const hasYesterday = sortedDates.includes(yesterdayStr)
    
    if (!hasToday && !hasYesterday) {
      // No recent practice, streak is broken
      return NextResponse.json({
        streak: 0,
        lastPracticeDate: sortedDates[0] || null
      })
    }

    // Start counting from today or yesterday
    let checkDate = hasToday ? today : yesterdayStr
    let dateIndex = 0

    // Count consecutive days
    while (dateIndex < sortedDates.length) {
      const expectedDate = new Date(checkDate).toISOString().split('T')[0]
      
      if (sortedDates[dateIndex] === expectedDate) {
        streak++
        // Move to previous day
        const prevDate = new Date(checkDate)
        prevDate.setDate(prevDate.getDate() - 1)
        checkDate = prevDate.toISOString().split('T')[0]
        dateIndex++
      } else {
        // Gap found, streak ends
        break
      }
    }

    return NextResponse.json({
      streak,
      lastPracticeDate: sortedDates[0] || null
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

