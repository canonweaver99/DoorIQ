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
      .select('overall_score, rapport_score, discovery_score, objection_handling_score, close_score, sale_closed, created_at, user_id')
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

    // Calculate team close %
    const teamClosePercentage = recentSessions.length > 0
      ? Math.round((recentSessions.filter(s => s.sale_closed === true).length / recentSessions.length) * 100)
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

    // Calculate rep performance data
    const repPerformanceMap = new Map<string, {
      id: string
      name: string
      sessions: number
      scores: number[]
      skills: {
        rapport: number[]
        discovery: number[]
        objections: number[]
        closing: number[]
      }
      lastActive: Date
      earnings: number
    }>()

    // Get team members with their data
    const { data: teamMembersData } = await supabase
      .from('users')
      .select('id, full_name, virtual_earnings')
      .eq('team_id', userProfile.team_id)
      .eq('role', 'rep')

    teamMembersData?.forEach(member => {
      repPerformanceMap.set(member.id, {
        id: member.id,
        name: member.full_name || 'Unknown',
        sessions: 0,
        scores: [],
        skills: {
          rapport: [],
          discovery: [],
          objections: [],
          closing: []
        },
        lastActive: new Date(0),
        earnings: member.virtual_earnings || 0
      })
    })

    // Process sessions to build rep performance
    recentSessions.forEach(session => {
      const repData = repPerformanceMap.get(session.user_id)
      if (repData) {
        repData.sessions++
        if (session.overall_score) {
          repData.scores.push(session.overall_score)
        }
        const sessionDate = new Date(session.created_at)
        if (sessionDate > repData.lastActive) {
          repData.lastActive = sessionDate
        }
      }
    })
    
    // Track close counts per rep
    const repCloseCounts = new Map<string, { total: number; closed: number }>()
    recentSessions.forEach(session => {
      const current = repCloseCounts.get(session.user_id) || { total: 0, closed: 0 }
      current.total++
      if (session.sale_closed === true) {
        current.closed++
      }
      repCloseCounts.set(session.user_id, current)
    })

    // Get detailed session data for skills
    const { data: detailedSessions } = await supabase
      .from('live_sessions')
      .select('user_id, rapport_score, discovery_score, objection_handling_score, close_effectiveness_score, created_at')
      .in('user_id', Array.from(repPerformanceMap.keys()))
      .gte('created_at', last30Days.toISOString())

    detailedSessions?.forEach(session => {
      const repData = repPerformanceMap.get(session.user_id)
      if (repData) {
        if (session.rapport_score) repData.skills.rapport.push(session.rapport_score)
        if (session.discovery_score) repData.skills.discovery.push(session.discovery_score)
        if (session.objection_handling_score) repData.skills.objections.push(session.objection_handling_score)
        if (session.close_effectiveness_score) repData.skills.closing.push(session.close_effectiveness_score)
      }
    })

    // Calculate rep performance metrics
    const repPerformance = Array.from(repPerformanceMap.values())
      .map(rep => {
        const avgScore = rep.scores.length > 0
          ? Math.round(rep.scores.reduce((sum, s) => sum + s, 0) / rep.scores.length)
          : 0

        // Calculate trend (compare recent vs older sessions)
        const recentScores = rep.scores.slice(0, Math.floor(rep.scores.length / 2))
        const olderScores = rep.scores.slice(Math.floor(rep.scores.length / 2))
        const recentAvg = recentScores.length > 0
          ? recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length
          : 0
        const olderAvg = olderScores.length > 0
          ? olderScores.reduce((sum, s) => sum + s, 0) / olderScores.length
          : 0
        const trend = Math.round(recentAvg - olderAvg)

        // Calculate skill averages
        const avgRapport = rep.skills.rapport.length > 0
          ? Math.round(rep.skills.rapport.reduce((sum, s) => sum + s, 0) / rep.skills.rapport.length)
          : 0
        const avgDiscovery = rep.skills.discovery.length > 0
          ? Math.round(rep.skills.discovery.reduce((sum, s) => sum + s, 0) / rep.skills.discovery.length)
          : 0
        const avgObjections = rep.skills.objections.length > 0
          ? Math.round(rep.skills.objections.reduce((sum, s) => sum + s, 0) / rep.skills.objections.length)
          : 0
        const avgClosing = rep.skills.closing.length > 0
          ? Math.round(rep.skills.closing.reduce((sum, s) => sum + s, 0) / rep.skills.closing.length)
          : 0

        // Format last active time
        const now = Date.now()
        const lastActiveMs = now - rep.lastActive.getTime()
        const hoursAgo = Math.floor(lastActiveMs / (1000 * 60 * 60))
        const daysAgo = Math.floor(hoursAgo / 24)
        let lastActiveStr = 'Just now'
        if (daysAgo > 0) {
          lastActiveStr = `${daysAgo}d ago`
        } else if (hoursAgo > 0) {
          lastActiveStr = `${hoursAgo}h ago`
        }

        // Calculate close % for this rep
        const closeData = repCloseCounts.get(rep.id) || { total: 0, closed: 0 }
        const closePercentage = closeData.total > 0
          ? Math.round((closeData.closed / closeData.total) * 100)
          : 0

        return {
          id: rep.id,
          name: rep.name,
          sessions: rep.sessions,
          avgScore,
          trend,
          skills: {
            rapport: avgRapport,
            discovery: avgDiscovery,
            objections: avgObjections,
            closing: avgClosing
          },
          revenue: rep.earnings,
          lastActive: lastActiveStr,
          closePercentage
        }
      })
      .filter(rep => rep.sessions > 0)
      .sort((a, b) => b.avgScore - a.avgScore)

    return NextResponse.json({
      analytics: {
        totalSessions,
        teamAverage: avgScore,
        teamClosePercentage,
        activeReps,
        trainingROI: 340, // Mock for now
        performanceData,
        skillDistribution,
        repPerformance,
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

