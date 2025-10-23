import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team
    const { data: userProfile } = await supabase
      .from('users')
      .select('team_id')
      .eq('id', user.id)
      .single()

    if (!userProfile?.team_id) {
      return NextResponse.json({ analytics: null })
    }

    // Get team members
    const { data: teamMembers } = await supabase
      .from('users')
      .select('id')
      .eq('team_id', userProfile.team_id)

    const memberIds = teamMembers?.map(m => m.id) || []
    
    if (memberIds.length === 0) {
      return NextResponse.json({ analytics: null })
    }

    // Get all sessions for team
    const { data: allSessions } = await supabase
      .from('live_sessions')
      .select('overall_score, rapport_score, discovery_score, objection_handling_score, close_score, created_at, user_id')
      .in('user_id', memberIds)
      .not('overall_score', 'is', null)
      .order('created_at', { ascending: true })

    if (!allSessions || allSessions.length === 0) {
      return NextResponse.json({ analytics: null })
    }

    // Calculate performance trend by month (last 6 months)
    const performanceByMonth: { [key: string]: { scores: number[]; topScore: number } } = {}
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)

    allSessions.forEach(session => {
      const date = new Date(session.created_at)
      if (date >= sixMonthsAgo) {
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' })
        if (!performanceByMonth[monthKey]) {
          performanceByMonth[monthKey] = { scores: [], topScore: 0 }
        }
        if (session.overall_score) {
          performanceByMonth[monthKey].scores.push(session.overall_score)
          performanceByMonth[monthKey].topScore = Math.max(
            performanceByMonth[monthKey].topScore,
            session.overall_score
          )
        }
      }
    })

    const performanceData = Object.entries(performanceByMonth).map(([month, data]) => ({
      month,
      teamAvg: Math.round(data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length),
      topPerformer: data.topScore,
      industry: 75 // Mock industry average
    }))

    // Calculate skill distribution
    const skillScores = {
      rapport: allSessions.filter(s => s.rapport_score).map(s => s.rapport_score!),
      discovery: allSessions.filter(s => s.discovery_score).map(s => s.discovery_score!),
      objection: allSessions.filter(s => s.objection_handling_score).map(s => s.objection_handling_score!),
      closing: allSessions.filter(s => s.close_score).map(s => s.close_score!)
    }

    const skillDistribution = [
      { 
        name: 'Rapport', 
        value: skillScores.rapport.length > 0 
          ? Math.round(skillScores.rapport.reduce((sum, s) => sum + s, 0) / skillScores.rapport.length)
          : 0 
      },
      { 
        name: 'Discovery', 
        value: skillScores.discovery.length > 0
          ? Math.round(skillScores.discovery.reduce((sum, s) => sum + s, 0) / skillScores.discovery.length)
          : 0
      },
      { 
        name: 'Objection Handling', 
        value: skillScores.objection.length > 0
          ? Math.round(skillScores.objection.reduce((sum, s) => sum + s, 0) / skillScores.objection.length)
          : 0
      },
      { 
        name: 'Closing', 
        value: skillScores.closing.length > 0
          ? Math.round(skillScores.closing.reduce((sum, s) => sum + s, 0) / skillScores.closing.length)
          : 0
      }
    ]

    // Calculate key metrics
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)
    
    const recentSessions = allSessions.filter(s => new Date(s.created_at) >= last30Days)
    const totalSessions = recentSessions.length
    
    const avgScore = recentSessions.length > 0
      ? Math.round(recentSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / recentSessions.length)
      : 0

    // Count active reps (had at least 1 session in last 30 days)
    const activeReps = new Set(recentSessions.map(s => s.user_id)).size

    // Calculate changes (compare to previous 30 days)
    const previous60Days = new Date()
    previous60Days.setDate(previous60Days.getDate() - 60)
    const previousPeriodSessions = allSessions.filter(s => {
      const date = new Date(s.created_at)
      return date >= previous60Days && date < last30Days
    })

    const prevAvgScore = previousPeriodSessions.length > 0
      ? Math.round(previousPeriodSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / previousPeriodSessions.length)
      : 0

    const scoreChange = prevAvgScore > 0 ? Math.round(((avgScore - prevAvgScore) / prevAvgScore) * 100) : 0
    const sessionsChange = previousPeriodSessions.length > 0 
      ? Math.round(((totalSessions - previousPeriodSessions.length) / previousPeriodSessions.length) * 100)
      : 0

    return NextResponse.json({
      analytics: {
        totalSessions,
        teamAverage: avgScore,
        activeReps,
        trainingROI: 340, // Mock for now
        performanceData,
        skillDistribution,
        changes: {
          sessions: sessionsChange,
          score: scoreChange,
          reps: 0, // Could calculate if we track historical data
          roi: 18
        }
      }
    })
  } catch (error) {
    console.error('Error in team analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

