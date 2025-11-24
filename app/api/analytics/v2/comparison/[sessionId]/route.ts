import { NextResponse } from 'next/server'
import { createServiceSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params
    
    const supabase = await createServiceSupabaseClient()
    
    // Get current session
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select('user_id, overall_score, rapport_score, discovery_score, objection_handling_score, close_score, created_at')
      .eq('id', sessionId)
      .single()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    const userId = session.user_id
    
    // Get user's last 10 sessions for average calculation
    const { data: userSessions, error: userSessionsError } = await supabase
      .from('live_sessions')
      .select('overall_score, rapport_score, discovery_score, objection_handling_score, close_score, created_at')
      .eq('user_id', userId)
      .not('overall_score', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (userSessionsError) {
      console.error('Error fetching user sessions:', userSessionsError)
    }
    
    // Calculate user averages
    const validUserSessions = (userSessions || []).filter(s => s.overall_score !== null)
    const userAverage = validUserSessions.length > 0
      ? Math.round(validUserSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / validUserSessions.length)
      : 0
    
    // Calculate category averages for user
    const calculateCategoryAverage = (field: string) => {
      const scores = validUserSessions
        .map(s => (s as any)[field])
        .filter((score): score is number => typeof score === 'number' && score !== null)
      return scores.length > 0
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0
    }
    
    const userAverages = {
      overall: userAverage,
      rapport: calculateCategoryAverage('rapport_score'),
      discovery: calculateCategoryAverage('discovery_score'),
      objection_handling: calculateCategoryAverage('objection_handling_score'),
      closing: calculateCategoryAverage('close_score')
    }
    
    // Calculate trends from last 3 sessions
    const last3Sessions = validUserSessions.slice(0, 3)
    const previous3Sessions = validUserSessions.slice(3, 6)
    
    const calculateTrend = (field: string) => {
      if (last3Sessions.length === 0) return 0
      const last3Avg = last3Sessions.length > 0
        ? last3Sessions.reduce((sum, s) => sum + ((s as any)[field] || 0), 0) / last3Sessions.length
        : 0
      const prev3Avg = previous3Sessions.length > 0
        ? previous3Sessions.reduce((sum, s) => sum + ((s as any)[field] || 0), 0) / previous3Sessions.length
        : last3Avg
      return Math.round(last3Avg - prev3Avg)
    }
    
    const trends = {
      overall: calculateTrend('overall_score'),
      rapport: calculateTrend('rapport_score'),
      discovery: calculateTrend('discovery_score'),
      objection_handling: calculateTrend('objection_handling_score'),
      closing: calculateTrend('close_score')
    }
    
    // Get user's team
    const { data: userProfile } = await supabase
      .from('users')
      .select('team_id')
      .eq('id', userId)
      .single()
    
    let teamAverage = 0
    let percentile = 50
    let teamAverages = {
      overall: 0,
      rapport: 0,
      discovery: 0,
      objection_handling: 0,
      closing: 0
    }
    
    if (userProfile?.team_id) {
      // Get team members
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id')
        .eq('team_id', userProfile.team_id)
      
      const teamMemberIds = teamMembers?.map(m => m.id) || []
      
      if (teamMemberIds.length > 0) {
        // Get team sessions from last week
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        
        const { data: teamSessions } = await supabase
          .from('live_sessions')
          .select('user_id, overall_score, rapport_score, discovery_score, objection_handling_score, close_score')
          .in('user_id', teamMemberIds)
          .gte('created_at', oneWeekAgo.toISOString())
          .not('overall_score', 'is', null)
        
        const validTeamSessions = (teamSessions || []).filter(s => s.overall_score !== null)
        
        if (validTeamSessions.length > 0) {
          // Calculate team average
          teamAverage = Math.round(
            validTeamSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / validTeamSessions.length
          )
          
          // Calculate team category averages
          const calculateTeamCategoryAverage = (field: string) => {
            const scores = validTeamSessions
              .map(s => (s as any)[field])
              .filter((score): score is number => typeof score === 'number' && score !== null)
            return scores.length > 0
              ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
              : 0
          }
          
          teamAverages = {
            overall: teamAverage,
            rapport: calculateTeamCategoryAverage('rapport_score'),
            discovery: calculateTeamCategoryAverage('discovery_score'),
            objection_handling: calculateTeamCategoryAverage('objection_handling_score'),
            closing: calculateTeamCategoryAverage('close_score')
          }
          
          // Calculate percentile (user's position vs team)
          const userScores = validTeamSessions
            .filter(s => s.user_id === userId)
            .map(s => s.overall_score || 0)
          const allTeamScores = validTeamSessions.map(s => s.overall_score || 0).sort((a, b) => a - b)
          
          if (userScores.length > 0 && allTeamScores.length > 0) {
            const userAvgScore = userScores.reduce((sum, s) => sum + s, 0) / userScores.length
            const belowUser = allTeamScores.filter(score => score < userAvgScore).length
            percentile = Math.round((belowUser / allTeamScores.length) * 100)
          }
        }
      }
    }
    
    // Current session scores
    const currentScores = {
      overall: session.overall_score || 0,
      rapport: session.rapport_score || 0,
      discovery: session.discovery_score || 0,
      objection_handling: session.objection_handling_score || 0,
      closing: session.close_score || 0
    }
    
    // Calculate differences
    const vsUserAverage = {
      overall: currentScores.overall - userAverages.overall,
      rapport: currentScores.rapport - userAverages.rapport,
      discovery: currentScores.discovery - userAverages.discovery,
      objection_handling: currentScores.objection_handling - userAverages.objection_handling,
      closing: currentScores.closing - userAverages.closing
    }
    
    const vsTeamAverage = {
      overall: currentScores.overall - teamAverages.overall,
      rapport: currentScores.rapport - teamAverages.rapport,
      discovery: currentScores.discovery - teamAverages.discovery,
      objection_handling: currentScores.objection_handling - teamAverages.objection_handling,
      closing: currentScores.closing - teamAverages.closing
    }
    
    // Determine percentile label
    let percentileLabel = 'Average'
    if (percentile >= 80) percentileLabel = 'Top 20%'
    else if (percentile >= 60) percentileLabel = 'Top 40%'
    else if (percentile >= 40) percentileLabel = 'Average'
    else if (percentile >= 20) percentileLabel = 'Bottom 40%'
    else percentileLabel = 'Bottom 20%'
    
    return NextResponse.json({
      current: currentScores,
      userAverage: userAverages,
      teamAverage: teamAverages,
      vsUserAverage,
      vsTeamAverage,
      trends,
      percentile,
      percentileLabel,
      sessionCount: validUserSessions.length
    })
  } catch (error: any) {
    console.error('Error in comparison API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comparison data' },
      { status: 500 }
    )
  }
}

