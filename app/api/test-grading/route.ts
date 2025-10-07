import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Test OpenAI grading in isolation
export async function POST(req: Request) {
  try {
    console.log('🧪 Testing OpenAI grading...')
    
    // Check if OpenAI key exists
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        status: 'FAILED',
        error: 'OPENAI_API_KEY not set in environment variables'
      })
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    
    // Test with a simple conversation
    const testTranscript = [
      { speaker: 'rep', text: 'Hi there! I\'m with Pest Control Solutions.' },
      { speaker: 'homeowner', text: 'Oh, what do you want?' },
      { speaker: 'rep', text: 'I\'m in your neighborhood today treating for pests. Have you had any issues with bugs or rodents?' },
      { speaker: 'homeowner', text: 'Actually yes, we\'ve seen some ants in the kitchen.' },
      { speaker: 'rep', text: 'I can take care of that for you today. Our treatment is safe for pets and children.' }
    ]
    
    const transcriptText = testTranscript
      .map(line => `${line.speaker}: ${line.text}`)
      .join('\n')
    
    const prompt = `Analyze this door-to-door pest control sales conversation and provide scores (0-100) and feedback:

${transcriptText}

Rate the sales rep on these 4 categories:
1. Rapport (0-100): How well they built trust and connection
2. Discovery (0-100): Quality and quantity of questions asked
3. Objection Handling (0-100): How well they addressed concerns
4. Closing (0-100): Effectiveness of closing techniques

Also determine:
- Did they close the deal? (virtual_earnings: 50 if yes, 0 if no)
- 3 things they did well (strengths)
- 3 areas for improvement

Respond with valid JSON only in this format:
{
  "rapport_score": 75,
  "discovery_score": 80,
  "objection_handling_score": 60,
  "closing_score": 40,
  "overall_score": 64,
  "virtual_earnings": 0,
  "strengths": ["Built rapport with friendly greeting", "Asked about pest issues", "Mentioned safety"],
  "improvements": ["Ask more discovery questions", "Practice closing techniques", "Create urgency"]
}`
    
    console.log('🤖 Calling OpenAI...')
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 500
    })
    
    const result = JSON.parse(response.choices[0].message.content || '{}')
    console.log('✅ OpenAI grading successful:', result)
    
    return NextResponse.json({
      status: 'SUCCESS',
      test_transcript: testTranscript,
      grading_result: result,
      usage: response.usage
    })
  } catch (e: any) {
    console.error('❌ OpenAI grading failed:', e)
    return NextResponse.json({
      status: 'FAILED',
      error: e.message,
      stack: e.stack
    }, { status: 500 })
  }
}
