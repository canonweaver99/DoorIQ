export const dynamic = "force-static";

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/homepage/persona-stats
 * Aggregate practice counts and success rates per persona
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Get all sessions from last 7 days for global stats
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('live_sessions')
      .select('agent_name, overall_score, started_at')
      .gte('started_at', sevenDaysAgo.toISOString())
      .not('overall_score', 'is', null)
      .order('started_at', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching sessions for persona stats:', sessionsError)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    // Aggregate by persona
    const personaStats: Record<string, {
      practiceCount: number
      successCount: number
      averageScore: number
    }> = {}

    sessions?.forEach(session => {
      const personaName = session.agent_name || 'Unknown'
      if (!personaStats[personaName]) {
        personaStats[personaName] = {
          practiceCount: 0,
          successCount: 0,
          averageScore: 0,
        }
      }
      
      personaStats[personaName].practiceCount++
      if (session.overall_score && session.overall_score >= 70) {
        personaStats[personaName].successCount++
      }
    })

    // Calculate averages
    Object.keys(personaStats).forEach(persona => {
      const stats = personaStats[persona]
      const scores = sessions
        ?.filter(s => s.agent_name === persona && s.overall_score)
        .map(s => s.overall_score || 0) || []
      
      stats.averageScore = scores.length > 0
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0
    })

    // Get user's personal stats per persona
    let userStats: Record<string, {
      wins: number
      losses: number
      averageScore: number
    }> = {}

    if (user) {
      const { data: userSessions } = await supabase
        .from('live_sessions')
        .select('agent_name, overall_score')
        .eq('user_id', user.id)
        .not('overall_score', 'is', null)

      userSessions?.forEach(session => {
        const personaName = session.agent_name || 'Unknown'
        if (!userStats[personaName]) {
          userStats[personaName] = {
            wins: 0,
            losses: 0,
            averageScore: 0,
          }
        }
        
        if (session.overall_score && session.overall_score >= 70) {
          userStats[personaName].wins++
        } else {
          userStats[personaName].losses++
        }
      })

      // Calculate user averages
      Object.keys(userStats).forEach(persona => {
        const scores = userSessions
          ?.filter(s => s.agent_name === persona && s.overall_score)
          .map(s => s.overall_score || 0) || []
        
        userStats[persona].averageScore = scores.length > 0
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0
      })
    }

    return NextResponse.json({
      global: personaStats,
      user: userStats,
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

