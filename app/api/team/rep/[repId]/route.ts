import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { repId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repId = params.repId

    // Get rep info
    const { data: rep, error: repError } = await supabase
      .from('users')
      .select('id, full_name, email, role, virtual_earnings, created_at')
      .eq('id', repId)
      .single()

    if (repError || !rep) {
      return NextResponse.json({ error: 'Rep not found' }, { status: 404 })
    }

    // Get all sessions for the rep
    const { data: sessions, error: sessionsError } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('user_id', repId)
      .order('created_at', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
    }

    // Calculate average scores
    const sessionsWithScores = sessions?.filter(s => s.overall_score !== null) || []
    
    const avgRapport = sessionsWithScores.filter(s => s.rapport_score).length > 0
      ? Math.round(sessionsWithScores.reduce((sum, s) => sum + (s.rapport_score || 0), 0) / sessionsWithScores.filter(s => s.rapport_score).length)
      : 0

    const avgDiscovery = sessionsWithScores.filter(s => s.needs_discovery_score).length > 0
      ? Math.round(sessionsWithScores.reduce((sum, s) => sum + (s.needs_discovery_score || 0), 0) / sessionsWithScores.filter(s => s.needs_discovery_score).length)
      : 0

    const avgObjection = sessionsWithScores.filter(s => s.objection_handling_score).length > 0
      ? Math.round(sessionsWithScores.reduce((sum, s) => sum + (s.objection_handling_score || 0), 0) / sessionsWithScores.filter(s => s.objection_handling_score).length)
      : 0

    const avgClosing = sessionsWithScores.filter(s => s.close_effectiveness_score).length > 0
      ? Math.round(sessionsWithScores.reduce((sum, s) => sum + (s.close_effectiveness_score || 0), 0) / sessionsWithScores.filter(s => s.close_effectiveness_score).length)
      : 0

    const avgListening = sessionsWithScores.filter(s => s.listening_score).length > 0
      ? Math.round(sessionsWithScores.reduce((sum, s) => sum + (s.listening_score || 0), 0) / sessionsWithScores.filter(s => s.listening_score).length)
      : 0

    const avgIntroduction = sessionsWithScores.filter(s => s.introduction_score).length > 0
      ? Math.round(sessionsWithScores.reduce((sum, s) => sum + (s.introduction_score || 0), 0) / sessionsWithScores.filter(s => s.introduction_score).length)
      : 0

    const skillData = [
      { skill: 'Rapport', score: avgRapport },
      { skill: 'Discovery', score: avgDiscovery },
      { skill: 'Objection Handling', score: avgObjection },
      { skill: 'Closing', score: avgClosing },
      { skill: 'Active Listening', score: avgListening },
      { skill: 'Introduction', score: avgIntroduction },
    ]

    // Get recent sessions (last 10)
    const recentSessions = sessions?.slice(0, 10).map(s => ({
      id: s.id,
      date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      homeowner: s.agent_name || 'Homeowner',
      score: s.overall_score || 0,
      duration: s.duration_seconds 
        ? `${Math.floor(s.duration_seconds / 60)}:${(s.duration_seconds % 60).toString().padStart(2, '0')}`
        : 'N/A',
      saleClosed: s.sale_closed || false,
      earnings: s.virtual_earnings || 0
    })) || []

    // Aggregate strengths and improvements from feedback
    const strengths = new Set<string>()
    const improvements = new Set<string>()

    sessions?.forEach(session => {
      if (session.analytics && typeof session.analytics === 'object') {
        const analytics = session.analytics as any
        if (analytics.feedback?.strengths) {
          analytics.feedback.strengths.forEach((s: string) => strengths.add(s))
        }
        if (analytics.feedback?.improvements) {
          analytics.feedback.improvements.forEach((i: string) => improvements.add(i))
        }
      }
    })

    // Get overall average
    const avgScore = sessionsWithScores.length > 0
      ? Math.round(sessionsWithScores.reduce((sum, s) => sum + (s.overall_score || 0), 0) / sessionsWithScores.length)
      : 0

    return NextResponse.json({
      rep: {
        id: rep.id,
        name: rep.full_name,
        email: rep.email,
        role: rep.role,
        score: avgScore,
        virtualEarnings: rep.virtual_earnings || 0,
        totalSessions: sessions?.length || 0
      },
      skillData,
      recentSessions,
      insights: {
        strengths: Array.from(strengths).slice(0, 5),
        improvements: Array.from(improvements).slice(0, 5)
      }
    })
  } catch (error) {
    console.error('Error fetching rep details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

