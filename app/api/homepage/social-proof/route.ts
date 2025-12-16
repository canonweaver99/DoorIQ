export const dynamic = "force-static";

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/homepage/social-proof
 * Get today's practice count and recent high scores for social proof
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get today's total practice count
    const { data: todaySessions, error: todayError } = await supabase
      .from('live_sessions')
      .select('id')
      .gte('started_at', today.toISOString())
      .lt('started_at', tomorrow.toISOString())
      .not('overall_score', 'is', null)

    if (todayError) {
      console.error('Error fetching today sessions:', todayError)
    }

    const todayPracticeCount = todaySessions?.length || 0

    // Get recent high scores (last 24 hours, anonymized)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const { data: highScores, error: scoresError } = await supabase
      .from('live_sessions')
      .select('overall_score, agent_name, user_id')
      .gte('started_at', yesterday.toISOString())
      .gte('overall_score', 85)
      .order('overall_score', { ascending: false })
      .limit(10)

    if (scoresError) {
      console.error('Error fetching high scores:', scoresError)
    }

    // Anonymize user names (use first letter + last 2 letters of user_id)
    const anonymizedScores = highScores?.map(score => {
      const userId = score.user_id || ''
      const firstName = userId.substring(0, 1).toUpperCase()
      const lastName = userId.substring(userId.length - 2).toUpperCase()
      const anonymizedName = `${firstName}.${lastName}`
      
      return {
        score: score.overall_score,
        agentName: score.agent_name,
        userName: anonymizedName,
      }
    }) || []

    // Get random high score for display
    const randomHighScore = anonymizedScores.length > 0
      ? anonymizedScores[Math.floor(Math.random() * anonymizedScores.length)]
      : null

    return NextResponse.json({
      todayPracticeCount,
      recentHighScores: anonymizedScores,
      featuredScore: randomHighScore,
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
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

