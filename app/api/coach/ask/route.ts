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
${transcriptContext}

RESPONSE GUIDELINES:
- Keep response to 2-3 SHORT paragraphs (150-200 words max)
- ALWAYS quote specific lines from the transcript as evidence (use "quotes")
- Be direct and actionable, not verbose
- Reference actual conversation moments
- No generic advice - make it feel personal to THIS call

QUESTION: ${question}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert door-to-door sales coach. Give CONCISE, specific feedback (2-3 short paragraphs max). Always include direct quotes from the transcript as evidence. Be encouraging but honest. Focus on practical techniques they can apply immediately. Make it feel like you actually listened to THEIR call.'
        },
        {
          role: 'user',
          content: contextPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300 // Reduced for more concise responses
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

