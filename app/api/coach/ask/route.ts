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

    const { overallScore, scores, feedback, saleClosed, virtualEarnings, transcriptLength, transcript } = sessionContext

    // Format transcript for context (limit to key exchanges to save tokens)
    let transcriptContext = ''
    if (transcript && transcript.length > 0) {
      const keyExchanges = transcript.slice(0, 20) // First 20 lines for context
      transcriptContext = '\n\nTRANSCRIPT EXCERPT (for reference/quotes):\n' + 
        keyExchanges.map((line: any, idx: number) => 
          `[${idx}] ${line.speaker === 'user' || line.speaker === 'rep' ? 'Rep' : 'Customer'}: ${line.text || line.message}`
        ).join('\n')
    }

    // Build context prompt
    const contextPrompt = `You are a sales manager giving quick, casual coaching to your rep after their door knock.

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
${transcriptContext}

RESPONSE STYLE:
- Talk like a real manager, not a robot. Be casual and conversational.
- Keep it SHORT - 2-3 sentences MAX (50-80 words total)
- Get straight to the point. No fluff.
- Use phrases like "Look," "Here's the thing," "Real talk," "Next time try..."
- Be encouraging but direct
- Reference specific moments from the call if relevant

QUESTION: ${question}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a sales manager giving quick, casual coaching. Keep responses VERY SHORT (2-3 sentences, 50-80 words max). Talk like a real person, not a textbook. Be direct, encouraging, and actionable. Use casual language like "Look," "Here\'s the thing," "Real talk." Make it feel like quick advice from a manager who cares, not a formal evaluation.'
        },
        {
          role: 'user',
          content: contextPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 150 // Even shorter for casual, quick responses
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

