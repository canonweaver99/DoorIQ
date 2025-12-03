import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/homepage/stats
 * Aggregate performance data for homepage dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check authentication - TEMPORARILY DISABLED FOR TESTING
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // TEMPORARY: Return empty data if no user (for testing)
    if (authError || !user) {
      return NextResponse.json({
        overallScore: 0,
        metrics: {
          closeRate: 0,
          avgDurationSeconds: 0,
          toneScore: 0
        },
        lastSession: null,
        weeklyData: [],
        skillBreakdown: {
          opening: 0,
          objectionHandling: 0,
          closing: 0,
          tonality: 0,
          pace: 0
        },
        trend: 0,
        totalSessions: 0
      })
    }

    // Get user's sessions from last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: sessions, error: sessionsError } = await supabase
      .from('live_sessions')
      .select('overall_score, rapport_score, discovery_score, objection_handling_score, close_score, duration_seconds, sale_closed, started_at, agent_name')
      .eq('user_id', user.id)
      .gte('started_at', thirtyDaysAgo.toISOString())
      .not('overall_score', 'is', null)
      .order('started_at', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    const validSessions = (sessions || []).filter(s => s.overall_score !== null && s.overall_score !== undefined)

    // Calculate overall performance score (average of recent sessions)
    const overallScore = validSessions.length > 0
      ? Math.round(validSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / validSessions.length)
      : 0

    // Calculate average close rate
    const totalSessions = validSessions.length
    const closedSessions = validSessions.filter(s => s.sale_closed === true).length
    const closeRate = totalSessions > 0 ? Math.round((closedSessions / totalSessions) * 100) : 0

    // Calculate average call duration
    const durations = validSessions
      .map(s => s.duration_seconds)
      .filter(d => d !== null && d !== undefined && d > 0)
    const avgDurationSeconds = durations.length > 0
      ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
      : 0

    // Calculate tone/confidence score (using rapport_score as proxy)
    const rapportScores = validSessions
      .map(s => s.rapport_score)
      .filter(s => s !== null && s !== undefined)
    const toneScore = rapportScores.length > 0
      ? Math.round(rapportScores.reduce((sum, s) => sum + s, 0) / rapportScores.length)
      : 0

    // Get last practice session
    const lastSession = validSessions.length > 0 ? validSessions[0] : null

    // Calculate weekly performance data (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const weeklySessions = validSessions.filter(s => {
      const sessionDate = new Date(s.started_at)
      return sessionDate >= sevenDaysAgo
    })

    // Group by date for weekly chart
    const dailyAverages: Record<string, number[]> = {}
    weeklySessions.forEach(session => {
      const date = new Date(session.started_at).toISOString().split('T')[0]
      if (!dailyAverages[date]) {
        dailyAverages[date] = []
      }
      if (session.overall_score !== null && session.overall_score !== undefined) {
        dailyAverages[date].push(session.overall_score)
      }
    })

    const weeklyData = Object.entries(dailyAverages).map(([date, scores]) => ({
      date,
      score: Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
    })).sort((a, b) => a.date.localeCompare(b.date))

    // Calculate skill breakdown averages
    const skillBreakdown = {
      opening: rapportScores.length > 0 
        ? Math.round(rapportScores.reduce((sum, s) => sum + s, 0) / rapportScores.length)
        : 0,
      objectionHandling: validSessions
        .map(s => s.objection_handling_score)
        .filter(s => s !== null && s !== undefined).length > 0
        ? Math.round(
            validSessions
              .map(s => s.objection_handling_score)
              .filter(s => s !== null && s !== undefined)
              .reduce((sum, s) => sum + s, 0) / 
            validSessions
              .map(s => s.objection_handling_score)
              .filter(s => s !== null && s !== undefined).length
          )
        : 0,
      closing: validSessions
        .map(s => s.close_score)
        .filter(s => s !== null && s !== undefined).length > 0
        ? Math.round(
            validSessions
              .map(s => s.close_score)
              .filter(s => s !== null && s !== undefined)
              .reduce((sum, s) => sum + s, 0) / 
            validSessions
              .map(s => s.close_score)
              .filter(s => s !== null && s !== undefined).length
          )
        : 0,
      tonality: toneScore,
      pace: 75 // Placeholder - would need to calculate from analytics if available
    }

    // Calculate trend (compare last 7 days vs previous 7 days)
    const previousWeekStart = new Date(sevenDaysAgo)
    previousWeekStart.setDate(previousWeekStart.getDate() - 7)
    
    const previousWeekSessions = validSessions.filter(s => {
      const sessionDate = new Date(s.started_at)
      return sessionDate >= previousWeekStart && sessionDate < sevenDaysAgo
    })

    const currentWeekAvg = weeklySessions.length > 0
      ? weeklySessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / weeklySessions.length
      : 0

    const previousWeekAvg = previousWeekSessions.length > 0
      ? previousWeekSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / previousWeekSessions.length
      : 0

    const trend = previousWeekAvg > 0
      ? Math.round(((currentWeekAvg - previousWeekAvg) / previousWeekAvg) * 100)
      : currentWeekAvg > 0 ? 100 : 0

    return NextResponse.json({
      overallScore,
      metrics: {
        closeRate,
        avgDurationSeconds,
        toneScore
      },
      lastSession: lastSession ? {
        agentName: lastSession.agent_name,
        score: lastSession.overall_score,
        startedAt: lastSession.started_at,
        durationSeconds: lastSession.duration_seconds
      } : null,
      weeklyData,
      skillBreakdown,
      trend,
      totalSessions
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

