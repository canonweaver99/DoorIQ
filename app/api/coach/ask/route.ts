import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { question, sessionContext } = await request.json()

    if (!question || !sessionContext) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const { overallScore, scores, feedback, saleClosed, virtualEarnings, transcriptLength } = sessionContext

    // Build context prompt
    const contextPrompt = `You are an expert sales coach providing personalized feedback to a sales rep based on their practice session.

SESSION PERFORMANCE:
- Overall Score: ${overallScore}%
- Rapport: ${scores.rapport || 0}%
- Discovery: ${scores.discovery || 0}%
- Objection Handling: ${scores.objection_handling || 0}%
- Closing: ${scores.closing || 0}%
- Sale Closed: ${saleClosed ? 'Yes' : 'No'}
- Virtual Earnings: $${virtualEarnings}
- Conversation Length: ${transcriptLength} exchanges

STRENGTHS:
${feedback.strengths?.map((s: string) => `- ${s}`).join('\n') || 'N/A'}

AREAS FOR IMPROVEMENT:
${feedback.improvements?.map((i: string) => `- ${i}`).join('\n') || 'N/A'}

Provide a specific, actionable, and encouraging response to the following question. Keep your response concise (2-3 paragraphs max), focused, and practical. Use a coaching tone that motivates while being direct about what needs improvement.

QUESTION: ${question}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert door-to-door sales coach. Provide specific, actionable feedback that helps reps improve their skills. Be encouraging but honest. Focus on practical techniques they can apply immediately.'
        },
        {
          role: 'user',
          content: contextPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 400
    })

    const answer = completion.choices[0].message.content || "I'm sorry, I couldn't generate a response. Please try again."

    return NextResponse.json({ answer })
  } catch (error: any) {
    console.error('Error in coaching API:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    )
  }
}

