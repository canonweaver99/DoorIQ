import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: { repId: string } }) {
  try {
    const supabase = await createServerSupabaseClient()
    
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
      .eq('id', params.repId)
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
      .select('id, overall_score, virtual_earnings, created_at, agent_name, duration_seconds, sale_closed')
      .eq('user_id', params.repId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (sessionError) {
      console.error('Error fetching sessions:', sessionError)
    }

    // Calculate stats
    const validSessions = sessions?.filter(s => s.overall_score !== null) || []
    const stats = {
      totalSessions: validSessions.length,
      averageScore: validSessions.length > 0 
        ? Math.round(validSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / validSessions.length)
        : 0,
      totalEarnings: sessions?.reduce((sum, s) => sum + (s.virtual_earnings || 0), 0) || 0,
      bestScore: validSessions.length > 0 ? Math.max(...validSessions.map(s => s.overall_score || 0)) : 0,
      activeDays: sessions ? new Set(sessions.map(s => s.created_at.split('T')[0])).size : 0,
      totalCallTime: sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0
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

    return NextResponse.json({
      rep: repData,
      sessions: sessions || [],
      stats: {
        ...stats,
        recentTrend
      }
    })

  } catch (error: any) {
    console.error('Rep dashboard error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch rep data' },
      { status: 500 }
    )
  }
}
