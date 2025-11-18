import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      // Return default insights if OpenAI is not configured
      return NextResponse.json({
        insights: [
          {
            title: 'Keep practicing',
            message: 'Complete more sessions to see personalized insights',
            icon: 'trending-up',
            iconColor: '#10b981',
            iconBgColor: 'rgba(16, 185, 129, 0.2)'
          }
        ]
      })
    }

    // Fetch recent sessions data
    const { data: sessions } = await supabase
      .from('live_sessions')
      .select('overall_score, rapport_score, discovery_score, objection_handling_score, close_score, created_at, virtual_earnings')
      .eq('user_id', user.id)
      .not('overall_score', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        insights: [
          {
            title: 'Start your first session',
            message: 'Complete a practice session to see personalized insights',
            icon: 'target',
            iconColor: '#3b82f6',
            iconBgColor: 'rgba(59, 130, 246, 0.2)'
          }
        ]
      })
    }

    // Calculate trends and metrics
    const recentSessions = sessions.slice(0, 7) // Last 7 sessions
    const olderSessions = sessions.slice(7) // Sessions before that

    const avgRecentOverall = recentSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / recentSessions.length
    const avgRecentRapport = recentSessions.filter(s => s.rapport_score).reduce((sum, s) => sum + (s.rapport_score || 0), 0) / recentSessions.filter(s => s.rapport_score).length || 0
    const avgRecentDiscovery = recentSessions.filter(s => s.discovery_score).reduce((sum, s) => sum + (s.discovery_score || 0), 0) / recentSessions.filter(s => s.discovery_score).length || 0
    const avgRecentObjection = recentSessions.filter(s => s.objection_handling_score).reduce((sum, s) => sum + (s.objection_handling_score || 0), 0) / recentSessions.filter(s => s.objection_handling_score).length || 0
    const avgRecentClosing = recentSessions.filter(s => s.close_score).reduce((sum, s) => sum + (s.close_score || 0), 0) / recentSessions.filter(s => s.close_score).length || 0

    const avgOlderOverall = olderSessions.length > 0 
      ? olderSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / olderSessions.length
      : avgRecentOverall

    const rapportChange = avgOlderOverall > 0 ? ((avgRecentRapport - (olderSessions.filter(s => s.rapport_score).reduce((sum, s) => sum + (s.rapport_score || 0), 0) / olderSessions.filter(s => s.rapport_score).length || avgRecentRapport)) / avgRecentRapport) * 100 : 0
    const discoveryChange = avgOlderOverall > 0 ? ((avgRecentDiscovery - (olderSessions.filter(s => s.discovery_score).reduce((sum, s) => sum + (s.discovery_score || 0), 0) / olderSessions.filter(s => s.discovery_score).length || avgRecentDiscovery)) / avgRecentDiscovery) * 100 : 0
    const objectionChange = avgOlderOverall > 0 ? ((avgRecentObjection - (olderSessions.filter(s => s.objection_handling_score).reduce((sum, s) => sum + (s.objection_handling_score || 0), 0) / olderSessions.filter(s => s.objection_handling_score).length || avgRecentObjection)) / avgRecentObjection) * 100 : 0
    const closingChange = avgOlderOverall > 0 ? ((avgRecentClosing - (olderSessions.filter(s => s.close_score).reduce((sum, s) => sum + (s.close_score || 0), 0) / olderSessions.filter(s => s.close_score).length || avgRecentClosing)) / avgRecentClosing) * 100 : 0
    const overallChange = avgOlderOverall > 0 ? ((avgRecentOverall - avgOlderOverall) / avgOlderOverall) * 100 : 0

    // Find best performing time of day
    const sessionsByHour = sessions.reduce((acc: any, s) => {
      const hour = new Date(s.created_at).getHours()
      if (!acc[hour]) acc[hour] = []
      acc[hour].push(s)
      return acc
    }, {})

    let bestHour = null
    let bestAvg = 0
    for (const [hour, hourSessions] of Object.entries(sessionsByHour)) {
      const avg = (hourSessions as any[]).reduce((sum, s) => sum + (s.overall_score || 0), 0) / (hourSessions as any[]).length
      if (avg > bestAvg) {
        bestAvg = avg
        bestHour = parseInt(hour)
      }
    }

    // Prepare prompt for AI
    const prompt = `You are an AI sales coach analyzing a sales rep's performance data. Generate 4 concise, actionable insights based on the following data:

PERFORMANCE METRICS:
- Overall Score: ${Math.round(avgRecentOverall)}% (${overallChange > 0 ? '+' : ''}${Math.round(overallChange)}% change)
- Rapport: ${Math.round(avgRecentRapport)}% (${rapportChange > 0 ? '+' : ''}${Math.round(rapportChange)}% change)
- Discovery: ${Math.round(avgRecentDiscovery)}% (${discoveryChange > 0 ? '+' : ''}${Math.round(discoveryChange)}% change)
- Objection Handling: ${Math.round(avgRecentObjection)}% (${objectionChange > 0 ? '+' : ''}${Math.round(objectionChange)}% change)
- Closing: ${Math.round(avgRecentClosing)}% (${closingChange > 0 ? '+' : ''}${Math.round(closingChange)}% change)

${bestHour !== null ? `- Best performing time: ${bestHour === 0 ? '12am' : bestHour <= 12 ? `${bestHour}am` : `${bestHour - 12}pm`}` : ''}
- Total sessions analyzed: ${sessions.length}
- Recent sessions: ${recentSessions.length}

Generate exactly 4 insights in JSON format. Each insight should have:
- title: Short title (3-5 words max)
- message: Actionable advice or observation (one sentence)
- percentage: Optional percentage change if relevant (format: "+X%" or "-X%")
- icon: One of: "trending-up", "target", "clock", "award", "zap", "alert-circle"
- iconColor: Hex color code
- iconBgColor: rgba color string

Focus on:
1. What's improving (if any positive trends)
2. What needs work (lowest scores or negative trends)
3. Specific actionable advice
4. Time-based patterns or habits

Return ONLY valid JSON array, no markdown, no code blocks:
[
  {
    "title": "...",
    "message": "...",
    "percentage": "+X%",
    "icon": "...",
    "iconColor": "#...",
    "iconBgColor": "rgba(...)"
  },
  ...
]`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful sales coach. Always return valid JSON only, no markdown formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    })

    const responseText = completion.choices[0]?.message?.content || '[]'
    
    // Clean up response (remove markdown code blocks if present)
    let cleanedResponse = responseText.trim()
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    }

    let insights
    try {
      insights = JSON.parse(cleanedResponse)
    } catch (error) {
      console.error('Failed to parse AI insights:', error)
      // Fallback to default insights
      insights = [
        {
          title: 'Keep practicing',
          message: 'Complete more sessions to see detailed insights',
          icon: 'trending-up',
          iconColor: '#10b981',
          iconBgColor: 'rgba(16, 185, 129, 0.2)'
        }
      ]
    }

    // Ensure we have exactly 4 insights
    while (insights.length < 4) {
      insights.push({
        title: 'Keep practicing',
        message: 'Complete more sessions to see additional insights',
        icon: 'trending-up',
        iconColor: '#a855f7',
        iconBgColor: 'rgba(168, 85, 247, 0.2)'
      })
    }

    // Add caching headers - insights can be cached for 5 minutes
    return NextResponse.json({ insights: insights.slice(0, 4) }, {
      headers: {
        'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600',
      },
    })

  } catch (error: any) {
    console.error('Error generating insights:', error)
    
    // Return default insights on error
    return NextResponse.json({
      insights: [
        {
          title: 'Analyzing your data',
          message: 'Complete more sessions to see personalized insights',
          icon: 'trending-up',
          iconColor: '#10b981',
          iconBgColor: 'rgba(16, 185, 129, 0.2)'
        }
      ]
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
      },
    })
  }
}

