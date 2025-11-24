import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, context: { params: Promise<{ repId: string }> }) {
  try {
    const supabase = await createServerSupabaseClient()
    const { repId } = await context.params
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify manager permissions
    const { data: managerData, error: managerError } = await supabase
      .from('users')
      .select('role, team_id')
      .eq('id', user.id)
      .single()

    if (managerError || !managerData || !['manager', 'admin'].includes(managerData.role)) {
      return NextResponse.json({ error: 'Access denied: Manager role required' }, { status: 403 })
    }

    // Get rep profile
    const { data: repData, error: repError } = await supabase
      .from('users')
      .select('*')
      .eq('id', repId)
      .single()

    if (repError || !repData) {
      return NextResponse.json({ error: 'Rep not found' }, { status: 404 })
    }

    // Verify rep is in the same team
    if (repData.team_id !== managerData.team_id) {
      return NextResponse.json({ error: 'Access denied: Rep not in your team' }, { status: 403 })
    }

    // Get rep sessions (limited for performance)
    const { data: sessions, error: sessionError } = await supabase
      .from('live_sessions')
      .select('id, overall_score, rapport_score, discovery_score, objection_handling_score, close_score, virtual_earnings, created_at, agent_name, duration_seconds, sale_closed')
      .eq('user_id', repId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (sessionError) {
      console.error('Error fetching sessions:', sessionError)
    }

    // Calculate stats
    const validSessions = sessions?.filter(s => s.overall_score !== null) || []
    
    // Calculate close %
    const closePercentage = validSessions.length > 0
      ? Math.round((validSessions.filter(s => s.sale_closed === true).length / validSessions.length) * 100)
      : 0
    
    const stats = {
      totalSessions: validSessions.length,
      averageScore: validSessions.length > 0 
        ? Math.round(validSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / validSessions.length)
        : 0,
      totalEarnings: sessions?.reduce((sum, s) => sum + (s.virtual_earnings || 0), 0) || 0,
      bestScore: validSessions.length > 0 ? Math.max(...validSessions.map(s => s.overall_score || 0)) : 0,
      activeDays: sessions ? new Set(sessions.map(s => s.created_at.split('T')[0])).size : 0,
      totalCallTime: sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0,
      closePercentage
    }

    // Calculate trend
    let recentTrend = 0
    if (validSessions.length >= 6) {
      const last5 = validSessions.slice(0, 5)
      const previous5 = validSessions.slice(5, 10)
      if (last5.length >= 3 && previous5.length >= 3) {
        const last5Avg = last5.reduce((sum, s) => sum + (s.overall_score || 0), 0) / last5.length
        const prev5Avg = previous5.reduce((sum, s) => sum + (s.overall_score || 0), 0) / previous5.length
        recentTrend = Math.round(last5Avg - prev5Avg)
      }
    }

    // Calculate skill averages (current period - last 7 days)
    const now = new Date()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentSessions = sessions?.filter(s => {
      const sessionDate = new Date(s.created_at)
      return sessionDate >= sevenDaysAgo
    }) || []
    
    // Previous period (7-14 days ago)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    
    const previousSessions = sessions?.filter(s => {
      const sessionDate = new Date(s.created_at)
      return sessionDate >= fourteenDaysAgo && sessionDate < sevenDaysAgo
    }) || []

    const calculateAverage = (sessions: any[], field: string) => {
      const valid = sessions.filter(s => s[field] !== null && s[field] !== undefined)
      if (valid.length === 0) return 0
      return Math.round(valid.reduce((sum, s) => sum + (s[field] || 0), 0) / valid.length)
    }

    const skillStats = {
      overall: {
        current: calculateAverage(recentSessions, 'overall_score'),
        previous: calculateAverage(previousSessions, 'overall_score')
      },
      rapport: {
        current: calculateAverage(recentSessions, 'rapport_score'),
        previous: calculateAverage(previousSessions, 'rapport_score')
      },
      discovery: {
        current: calculateAverage(recentSessions, 'discovery_score'),
        previous: calculateAverage(previousSessions, 'discovery_score')
      },
      objection: {
        current: calculateAverage(recentSessions, 'objection_handling_score'),
        previous: calculateAverage(previousSessions, 'objection_handling_score')
      },
      closing: {
        current: calculateAverage(recentSessions, 'close_score'),
        previous: calculateAverage(previousSessions, 'close_score')
      }
    }

    return NextResponse.json({
      rep: repData,
      sessions: sessions || [],
      stats: {
        ...stats,
        recentTrend
      },
      skillStats
    })

  } catch (error: any) {
    console.error('Rep dashboard error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch rep data' },
      { status: 500 }
    )
  }
}
