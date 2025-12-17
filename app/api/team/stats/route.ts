
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
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
      .select('team_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!userProfile.team_id) {
      // No team yet, return empty stats
      return NextResponse.json({
        totalReps: 0,
        activeNow: 0,
        teamAverage: 0,
        totalEarned: 0,
        topPerformers: []
      })
    }

    // Get team members
    const { data: teamMembers, error: membersError } = await supabase
      .from('users')
      .select('id, full_name, email, virtual_earnings, role')
      .eq('team_id', userProfile.team_id)

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
    }

    const totalReps = teamMembers?.length || 0

    // Get all sessions for team members
    const teamMemberIds = teamMembers?.map(m => m.id) || []
    
    if (teamMemberIds.length === 0) {
      return NextResponse.json({
        totalReps: 0,
        activeNow: 0,
        teamAverage: 0,
        totalEarned: 0,
        topPerformers: []
      })
    }

    const { data: sessions, error: sessionsError } = await supabase
      .from('live_sessions')
      .select('user_id, overall_score, virtual_earnings, created_at')
      .in('user_id', teamMemberIds)
      .order('created_at', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
    }

    // Calculate team average score
    const sessionsWithScores = sessions?.filter(s => s.overall_score !== null) || []
    const teamAverage = sessionsWithScores.length > 0
      ? Math.round(sessionsWithScores.reduce((sum, s) => sum + (s.overall_score || 0), 0) / sessionsWithScores.length)
      : 0

    // Calculate total earnings
    const totalEarned = teamMembers?.reduce((sum, m) => sum + (m.virtual_earnings || 0), 0) || 0

    // Calculate active users (had a session in the last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const recentSessions = sessions?.filter(s => s.created_at >= oneHourAgo) || []
    const activeNow = new Set(recentSessions.map(s => s.user_id)).size

    // Get top performers (by average score in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const recentSessionsForScoring = sessions?.filter(s => s.created_at >= thirtyDaysAgo) || []
    
    const performerStats = teamMembers?.map(member => {
      const memberSessions = recentSessionsForScoring.filter(s => s.user_id === member.id && s.overall_score !== null)
      const avgScore = memberSessions.length > 0
        ? Math.round(memberSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / memberSessions.length)
        : 0
      
      return {
        id: member.id,
        name: member.full_name,
        email: member.email,
        score: avgScore,
        sessionCount: memberSessions.length,
        earnings: member.virtual_earnings || 0
      }
    }).filter(p => p.sessionCount > 0) || []

    // Sort by score and take top 5
    const topPerformers = performerStats
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    return NextResponse.json({
      totalReps,
      activeNow,
      teamAverage,
      totalEarned,
      topPerformers
    })
  } catch (error) {
    console.error('Error in team stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

