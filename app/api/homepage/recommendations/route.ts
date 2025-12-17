
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ALLOWED_AGENT_ORDER, PERSONA_METADATA, type AllowedAgentName } from '@/components/trainer/personas'

/**
 * GET /api/homepage/recommendations
 * Analyze user's session history and recommend practice persona
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check authentication - TEMPORARILY DISABLED FOR TESTING
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // TEMPORARY: Return default recommendation if no user (for testing)
    if (authError || !user) {
      return NextResponse.json({
        recommendedPersona: 'Average Austin',
        reasoning: 'Start with Average Austin to build foundational skills',
        skillFocus: 'Foundational practice',
        difficulty: 'Moderate'
      })
    }

    // Get user's recent sessions (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: sessions, error: sessionsError } = await supabase
      .from('live_sessions')
      .select('agent_name, rapport_score, discovery_score, objection_handling_score, close_score, overall_score')
      .eq('user_id', user.id)
      .gte('started_at', thirtyDaysAgo.toISOString())
      .not('overall_score', 'is', null)

    if (sessionsError) {
      console.error('Error fetching sessions for recommendations:', sessionsError)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    const validSessions = (sessions || []).filter(s => s.overall_score !== null)

    // If no sessions, recommend beginner-friendly persona
    if (validSessions.length === 0) {
      return NextResponse.json({
        recommendedPersona: 'Average Austin',
        reasoning: 'Start with Average Austin to build foundational skills',
        skillFocus: 'Foundational practice',
        difficulty: 'Moderate'
      })
    }

    // Calculate average scores per skill category
    const skillAverages = {
      rapport: 0,
      discovery: 0,
      objectionHandling: 0,
      closing: 0
    }

    let rapportCount = 0
    let discoveryCount = 0
    let objectionCount = 0
    let closingCount = 0

    validSessions.forEach(session => {
      if (session.rapport_score !== null && session.rapport_score !== undefined) {
        skillAverages.rapport += session.rapport_score
        rapportCount++
      }
      if (session.discovery_score !== null && session.discovery_score !== undefined) {
        skillAverages.discovery += session.discovery_score
        discoveryCount++
      }
      if (session.objection_handling_score !== null && session.objection_handling_score !== undefined) {
        skillAverages.objectionHandling += session.objection_handling_score
        objectionCount++
      }
      if (session.close_score !== null && session.close_score !== undefined) {
        skillAverages.closing += session.close_score
        closingCount++
      }
    })

    if (rapportCount > 0) skillAverages.rapport = Math.round(skillAverages.rapport / rapportCount)
    if (discoveryCount > 0) skillAverages.discovery = Math.round(skillAverages.discovery / discoveryCount)
    if (objectionCount > 0) skillAverages.objectionHandling = Math.round(skillAverages.objectionHandling / objectionCount)
    if (closingCount > 0) skillAverages.closing = Math.round(skillAverages.closing / closingCount)

    // Find weakest skill area
    const skillScores = [
      { name: 'rapport', score: skillAverages.rapport },
      { name: 'discovery', score: skillAverages.discovery },
      { name: 'objectionHandling', score: skillAverages.objectionHandling },
      { name: 'closing', score: skillAverages.closing }
    ]

    const weakestSkill = skillScores.reduce((min, skill) => 
      skill.score < min.score ? skill : min
    )

    // Count practice frequency per persona
    const personaCounts: Record<string, number> = {}
    validSessions.forEach(session => {
      const persona = session.agent_name
      if (persona) {
        personaCounts[persona] = (personaCounts[persona] || 0) + 1
      }
    })

    // Map weakest skill to recommended persona
    // This is a simplified mapping - you can enhance this with more sophisticated logic
    let recommendedPersona: AllowedAgentName = 'Average Austin'
    let reasoning = ''
    let skillFocus = ''

    switch (weakestSkill.name) {
      case 'objectionHandling':
        recommendedPersona = 'Too Expensive Tim'
        reasoning = 'Your objection handling needs work. Practice with Too Expensive Tim to master budget objections.'
        skillFocus = 'Objection Handling'
        break
      case 'closing':
        recommendedPersona = 'Think About It Tina'
        reasoning = 'Focus on closing techniques. Think About It Tina will help you practice assumptive closes.'
        skillFocus = 'Closing'
        break
      case 'discovery':
        recommendedPersona = 'Average Austin'
        reasoning = 'Improve your discovery skills. Average Austin will challenge you to ask better questions.'
        skillFocus = 'Discovery'
        break
      case 'rapport':
        recommendedPersona = 'No Problem Nancy'
        reasoning = 'Build stronger rapport. Start with No Problem Nancy to practice connection-building.'
        skillFocus = 'Rapport Building'
        break
      default:
        // Fallback: recommend least practiced persona
        const leastPracticed = Object.entries(personaCounts)
          .sort(([, a], [, b]) => a - b)[0]?.[0]
        
        if (leastPracticed && ALLOWED_AGENT_ORDER.includes(leastPracticed as AllowedAgentName)) {
          recommendedPersona = leastPracticed as AllowedAgentName
          reasoning = `You haven't practiced with ${recommendedPersona} recently. Try a new challenge!`
          skillFocus = 'Variety'
        } else {
          recommendedPersona = 'Average Austin'
          reasoning = 'Continue practicing with Average Austin to build consistent skills.'
          skillFocus = 'Consistency'
        }
    }

    // Get persona metadata
    const personaMeta = PERSONA_METADATA[recommendedPersona]
    const difficulty = personaMeta?.card?.difficultyLabel || personaMeta?.card?.challengeLabel || 'Moderate'

    return NextResponse.json({
      recommendedPersona,
      reasoning,
      skillFocus,
      difficulty,
      skillAverages,
      weakestSkill: weakestSkill.name
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

