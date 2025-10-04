import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
})

export async function POST(request: NextRequest) {
  try {
    const { message, sessionData, conversationHistory } = await request.json()
    
    if (!openai.apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' }, 
        { status: 500 }
      )
    }

    if (!message || !sessionData) {
      return NextResponse.json(
        { error: 'Message and session data are required' }, 
        { status: 400 }
      )
    }

    // Build context from session data
    const transcript = Array.isArray(sessionData.full_transcript)
      ? sessionData.full_transcript
      : (Array.isArray(sessionData.transcript) ? sessionData.transcript : [])
    const analytics = sessionData.analytics || {}
    const scores = {
      overall: sessionData.overall_score || 0,
      rapport: sessionData.rapport_score || 0,
      objection_handling: sessionData.objection_handling_score || 0,
      safety: sessionData.safety_score || 0,
      close_effectiveness: sessionData.close_effectiveness_score || 0
    }
    
    // Fetch comprehensive grading data if available
    let comprehensiveData = null
    let userPatterns = null
    if (sessionData.id && sessionData.user_id) {
      const supabase = await createServiceSupabaseClient()
      
      // Try to fetch detailed metrics
      try {
        const { data: metrics } = await (supabase as any)
          .from('session_detailed_metrics')
          .select('metric_data')
          .eq('session_id', sessionData.id)
          .eq('metric_category', 'comprehensive')
          .single()
        
        if (metrics) {
          comprehensiveData = metrics.metric_data
        }
      } catch (e) {
        // Table might not exist yet
      }
      
      // Try to fetch user patterns
      try {
        const { data: patterns } = await (supabase as any)
          .from('user_patterns')
          .select('pattern_type, category, description, frequency, trend')
          .eq('user_id', sessionData.user_id)
          .order('frequency', { ascending: false })
          .limit(10)
        
        if (patterns && patterns.length > 0) {
          userPatterns = patterns
        }
      } catch (e) {
        // Table might not exist yet
      }
    }

    // Format transcript for context
    const transcriptText = transcript.map((entry: any, idx: number) => {
      const speaker = entry.speaker === 'user' || entry.speaker === 'rep' ? 'Sales Rep' : 'Austin Rodriguez (Customer)'
      return `[Line ${idx + 1}] ${speaker}: ${entry.text}`
    }).join('\n')

    // Build conversation history for context
    const chatHistory = conversationHistory.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }))

    const systemPrompt = `You are an expert sales coach specializing in pest control door-to-door sales. Keep responses SHORT and skimmable (5-8 bullet points max or 4-6 short sentences). Use a constructive tone with a "compliment sandwich": start with 1-2 strengths, then 2-4 concrete fixes, end with brief encouragement or next step. Prefer bullet points. Always reference exact line numbers when giving feedback.

Before any criticism or improvement points, begin with ONE short, attributed motivational sales quote (e.g., Zig Ziglar, Brian Tracy, Jim Rohn, Grant Cardone). Put it as the very first line, prefixed with "Quote:" and then a line break before the rest of your feedback.

SESSION PERFORMANCE DATA:
- Overall Score: ${scores.overall}/100
- Rapport Building: ${scores.rapport}/100
- Objection Handling: ${scores.objection_handling}/100
- Safety Discussion: ${scores.safety}/100
- Close Effectiveness: ${scores.close_effectiveness}/100

${comprehensiveData ? `
ADVANCED METRICS:
- Energy Level: ${comprehensiveData.advancedMetrics?.conversationFlow?.energyLevel || 'N/A'}
- Empathy Score: ${comprehensiveData.advancedMetrics?.emotionalIntelligence?.empathyScore || 0}/100
- Mirroring: ${comprehensiveData.advancedMetrics?.emotionalIntelligence?.mirroringScore || 0}/100
- Positive Language: ${comprehensiveData.advancedMetrics?.linguisticAnalysis?.positiveLanguageRatio || 0}%
- Filler Words: ${comprehensiveData.advancedMetrics?.linguisticAnalysis?.fillerWordCount || 0}
` : ''}

${userPatterns && userPatterns.length > 0 ? `
YOUR RECURRING PATTERNS:
${userPatterns.map((p: any) => `- ${p.pattern_type === 'strength' ? '✅' : '⚠️'} ${p.description || p.category} (${p.frequency}x, trend: ${p.trend || 'stable'})`).join('\n')}
` : ''}

CONVERSATION TRANSCRIPT:
${transcriptText}

ADDITIONAL CONTEXT:
${(() => {
  // Normalize feedback fields from either top-level or analytics.feedback
  const strengths = (sessionData.what_worked && Array.isArray(sessionData.what_worked) ? sessionData.what_worked : analytics?.feedback?.strengths) || []
  const improvements = (sessionData.what_failed && Array.isArray(sessionData.what_failed) ? sessionData.what_failed : analytics?.feedback?.improvements) || []
  const specificTips = (sessionData.key_learnings && Array.isArray(sessionData.key_learnings) ? sessionData.key_learnings : (analytics?.feedback?.specific_tips || analytics?.feedback?.specificTips)) || []
  if (strengths.length + improvements.length + (specificTips?.length || 0) === 0) {
    return 'No detailed analytics available'
  }
  return `Strengths: ${strengths.join(', ') || 'None identified'}\nAreas for Improvement: ${improvements.join(', ') || 'None identified'}\nSpecific Tips: ${specificTips.join(' | ') || 'None provided'}`
})()}

${analytics.moment_of_death?.detected ? `
Moment of Death Detected: ${analytics.moment_of_death.label}
Death Signal: "${analytics.moment_of_death.deathSignal}"
Alternative Response: "${analytics.moment_of_death.alternativeResponse}"
` : ''}

${comprehensiveData?.patterns ? `
DETECTED PATTERNS THIS SESSION:
- Strengths: ${comprehensiveData.patterns.strengths?.join(', ') || 'None'}
- Weaknesses: ${comprehensiveData.patterns.weaknesses?.join(', ') || 'None'}
- Missed Opportunities: ${comprehensiveData.patterns.missedOpportunities?.join(', ') || 'None'}
` : ''}

COACHING GUIDELINES:
- Start with 1-2 strengths (what worked)
- Then give 2-4 fixes with exact lines (what to change, how to say it)
- End with 1 short encouragement or next best action
- Each bullet: max ~18 words, clear and direct
- Always include line numbers like "Line 5"
- Focus on rapport, discovery, safety, assumptive closing
${userPatterns ? '- Reference their recurring patterns when relevant' : ''}
${comprehensiveData ? '- Use advanced metrics to provide deeper insights' : ''}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: message }
      ],
      temperature: 0.5,
      max_tokens: 500
    })

    const assistantResponse = response.choices[0]?.message?.content

    if (!assistantResponse) {
      throw new Error('No response from OpenAI')
    }

    return NextResponse.json({ 
      response: assistantResponse 
    })

  } catch (error) {
    console.error('AI Coach error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get coaching response',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
