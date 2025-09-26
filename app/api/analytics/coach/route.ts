import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

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
    const transcript = Array.isArray(sessionData.transcript) ? sessionData.transcript : []
    const analytics = sessionData.analytics || {}
    const scores = {
      overall: sessionData.overall_score || 0,
      rapport: sessionData.rapport_score || 0,
      objection_handling: sessionData.objection_handling_score || 0,
      safety: sessionData.safety_score || 0,
      close_effectiveness: sessionData.close_effectiveness_score || 0
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

    const systemPrompt = `You are an expert sales coach specializing in pest control door-to-door sales. You are helping a sales representative improve their performance based on their recent conversation with Austin Rodriguez, a potential customer.

SESSION PERFORMANCE DATA:
- Overall Score: ${scores.overall}/100
- Rapport Building: ${scores.rapport}/100
- Objection Handling: ${scores.objection_handling}/100
- Safety Discussion: ${scores.safety}/100
- Close Effectiveness: ${scores.close_effectiveness}/100

CONVERSATION TRANSCRIPT:
${transcriptText}

ADDITIONAL CONTEXT:
${analytics.feedback ? `
Strengths: ${analytics.feedback.strengths?.join(', ') || 'None identified'}
Areas for Improvement: ${analytics.feedback.improvements?.join(', ') || 'None identified'}
Specific Tips: ${analytics.feedback.specificTips?.join(' | ') || 'None provided'}
` : 'No detailed analytics available'}

${analytics.moment_of_death?.detected ? `
Moment of Death Detected: ${analytics.moment_of_death.label}
Death Signal: "${analytics.moment_of_death.deathSignal}"
Alternative Response: "${analytics.moment_of_death.alternativeResponse}"
` : ''}

COACHING GUIDELINES:
1. Be encouraging and constructive, never harsh or discouraging
2. Reference specific lines from the transcript when giving feedback
3. Explain WHY certain approaches work or don't work in pest control sales
4. Provide specific, actionable advice the rep can use in their next conversation
5. When discussing scores, explain what factors influenced them
6. If asked about a specific line, analyze the customer's response and suggest alternatives
7. Focus on pest control sales best practices: rapport building, problem discovery, safety concerns, and assumptive closing
8. Use line numbers when referencing specific parts of the conversation
9. Keep responses conversational but professional
10. If the rep asks about improving a specific score, point to exact transcript moments and explain better alternatives

Remember: Every interaction is a learning opportunity. Help the rep understand not just WHAT to improve, but HOW and WHY to improve it.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000
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
