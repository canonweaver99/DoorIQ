export const dynamic = "force-static";

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/homepage/rotating-stats
 * Get all stats for rotating stat card: streak, reps today, team highest today, average score
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        streak: 0,
        repsToday: 0,
        teamHighestToday: null,
        averageScore: 0,
        teamRank: 1,
      })
    }

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const todayStr = today.toISOString().split('T')[0]
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    // 1. Calculate streak
    const { data: streakData } = await supabase
      .from('live_sessions')
      .select('started_at')
      .eq('user_id', user.id)
      .not('overall_score', 'is', null)
      .order('started_at', { ascending: false })

    let streak = 0
    if (streakData && streakData.length > 0) {
      const practiceDates = new Set<string>()
      streakData.forEach(session => {
        const date = new Date(session.started_at).toISOString().split('T')[0]
        practiceDates.add(date)
      })

      const sortedDates = Array.from(practiceDates).sort((a, b) => b.localeCompare(a))
      const hasToday = sortedDates.includes(todayStr)
      const hasYesterday = sortedDates.includes(yesterdayStr)

      if (hasToday || hasYesterday) {
        let checkDate = hasToday ? todayStr : yesterdayStr
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

    // 2. Get reps practiced today
    const { data: todaySessions } = await supabase
      .from('live_sessions')
      .select('id')
      .eq('user_id', user.id)
      .gte('started_at', today.toISOString())
      .lt('started_at', tomorrow.toISOString())
      .not('overall_score', 'is', null)

    const repsToday = todaySessions?.length || 0

    // 3. Get highest team score today and team rank
    // First get user's team_id and virtual_earnings
    const { data: userProfile } = await supabase
      .from('users')
      .select('team_id, virtual_earnings')
      .eq('id', user.id)
      .single()

    let teamHighestToday: number | null = null
    if (userProfile?.team_id) {
      // Get all team members
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id')
        .eq('team_id', userProfile.team_id)

      if (teamMembers && teamMembers.length > 0) {
        const teamMemberIds = teamMembers.map(m => m.id)
        
        // Get today's sessions for all team members
        const { data: teamTodaySessions } = await supabase
          .from('live_sessions')
          .select('overall_score')
          .in('user_id', teamMemberIds)
          .gte('started_at', today.toISOString())
          .lt('started_at', tomorrow.toISOString())
          .not('overall_score', 'is', null)

        if (teamTodaySessions && teamTodaySessions.length > 0) {
          const scores = teamTodaySessions
            .map(s => s.overall_score)
            .filter((score): score is number => score !== null && score !== undefined)
          
          if (scores.length > 0) {
            teamHighestToday = Math.max(...scores)
          }
        }
      }
    }

    // 4. Calculate average score (all user's sessions)
    const { data: allSessions } = await supabase
      .from('live_sessions')
      .select('overall_score')
      .eq('user_id', user.id)
      .not('overall_score', 'is', null)

    const scores = (allSessions || [])
      .map(s => s.overall_score)
      .filter((score): score is number => score !== null && score !== undefined)
    
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0

    // 5. Calculate team rank based on virtual_earnings
    let teamRank = 1
    if (userProfile?.team_id) {
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id, virtual_earnings')
        .eq('team_id', userProfile.team_id)
      
      if (teamMembers && teamMembers.length > 1) {
        // Sort by virtual_earnings descending (treat null as 0)
        const sorted = [...teamMembers].sort((a, b) => (b.virtual_earnings || 0) - (a.virtual_earnings || 0))
        const userIndex = sorted.findIndex(m => m.id === user.id)
        teamRank = userIndex >= 0 ? userIndex + 1 : teamMembers.length
      }
    }

    return NextResponse.json({
      streak,
      repsToday,
      teamHighestToday,
      averageScore,
      teamRank,
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

