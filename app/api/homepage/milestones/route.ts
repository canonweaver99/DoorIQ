import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/homepage/milestones
 * Track user progress toward unlockable features
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        currentMilestone: {
          id: 'first_session',
          title: 'Complete Your First Session',
          description: 'Start practicing to unlock your performance dashboard',
          progress: 0,
          total: 1,
          unlock: 'Performance Dashboard',
        },
        completedMilestones: [],
      })
    }

    // Get user's session count
    const { data: sessions } = await supabase
      .from('live_sessions')
      .select('id, overall_score')
      .eq('user_id', user.id)
      .not('overall_score', 'is', null)

    const sessionCount = sessions?.length || 0
    const completedSessions = sessions?.filter(s => s.overall_score !== null).length || 0

    // Define milestones
    const milestones = [
      {
        id: 'first_session',
        title: 'Complete Your First Session',
        description: 'Start practicing to unlock your performance dashboard',
        progress: completedSessions,
        total: 1,
        unlock: 'Performance Dashboard',
      },
      {
        id: 'team_leaderboard',
        title: 'Unlock Team Leaderboard',
        description: 'Complete 3 practice sessions to access team rankings',
        progress: completedSessions,
        total: 3,
        unlock: 'Team Leaderboard Access',
      },
      {
        id: 'advanced_scenarios',
        title: 'Unlock Advanced Scenarios',
        description: 'Complete 5 practice sessions to access expert-level personas',
        progress: completedSessions,
        total: 5,
        unlock: 'Advanced Personas',
      },
      {
        id: 'master_level',
        title: 'Master Level Unlocked',
        description: 'Complete 10 practice sessions to unlock all features',
        progress: completedSessions,
        total: 10,
        unlock: 'All Features',
      },
    ]

    // Find current milestone (first incomplete one)
    const currentMilestone = milestones.find(m => m.progress < m.total) || milestones[milestones.length - 1]
    const completedMilestones = milestones.filter(m => m.progress >= m.total).map(m => m.id)

    return NextResponse.json({
      currentMilestone,
      completedMilestones,
      allMilestones: milestones,
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

