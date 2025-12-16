export const dynamic = "force-static";

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/homepage/gamification
 * Calculate streak from sessions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        streak: 0,
      })
    }

    // Get streak
    const { data: streakData } = await supabase
      .from('live_sessions')
      .select('started_at')
      .eq('user_id', user.id)
      .not('overall_score', 'is', null)
      .order('started_at', { ascending: false })

    // Calculate streak
    let streak = 0
    if (streakData && streakData.length > 0) {
      const practiceDates = new Set<string>()
      streakData.forEach(session => {
        const date = new Date(session.started_at).toISOString().split('T')[0]
        practiceDates.add(date)
      })

      const sortedDates = Array.from(practiceDates).sort((a, b) => b.localeCompare(a))
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      const hasToday = sortedDates.includes(today)
      const hasYesterday = sortedDates.includes(yesterdayStr)

      if (hasToday || hasYesterday) {
        let checkDate = hasToday ? today : yesterdayStr
        let dateIndex = 0

        while (dateIndex < sortedDates.length) {
          const expectedDate = new Date(checkDate).toISOString().split('T')[0]
          if (sortedDates[dateIndex] === expectedDate) {
            streak++
            const prevDate = new Date(checkDate)
            prevDate.setDate(prevDate.getDate() - 1)
            checkDate = prevDate.toISOString().split('T')[0]
            dateIndex++
          } else {
            break
          }
        }
      }
    }

    return NextResponse.json({
      streak,
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

