import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    const supabase = await createServiceSupabaseClient()
    
    // Fetch session data
    const { data: session, error } = await (supabase as any)
      .from('live_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    if (error || !session) {
      console.error('Session fetch error:', error)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    // Get transcript - check both possible fields
    const transcript = session.full_transcript || session.transcript || []
    
    if (!Array.isArray(transcript) || transcript.length === 0) {
      console.log('No transcript found for session:', sessionId)
      return NextResponse.json({ 
        error: 'No transcript available for grading',
        scores: null 
      }, { status: 200 })
    }
    
    // Use OpenAI to grade the entire conversation
    console.log('Grading session with OpenAI:', sessionId, 'Lines:', transcript.length)
    
    if (!openai.apiKey) {
      console.error('OpenAI API key not configured')
      return NextResponse.json({ 
        error: 'OpenAI API key not configured' 
      }, { status: 500 })
    }
    
    const analysis = await gradeWithOpenAI(transcript)
    
    // Update session with grading results
    const updateData = {
      overall_score: analysis.scores.overall,
      rapport_score: analysis.scores.rapport,
      introduction_score: analysis.scores.introduction,
      listening_score: analysis.scores.listening,
      objection_handling_score: analysis.scores.sales_technique,
      safety_score: analysis.scores.safety,
      close_effectiveness_score: analysis.scores.closing,
      virtual_earnings: analysis.virtual_earnings || 0,
      what_worked: analysis.feedback.strengths || [],
      what_failed: analysis.feedback.improvements || [],
      key_learnings: analysis.feedback.specific_tips || [],
      analytics: {
        line_ratings: analysis.line_ratings || [],
        key_moments: analysis.key_moments || {},
        grading_version: '3.0-openai',
        graded_at: new Date().toISOString()
      }
    }
    
    const { error: updateError } = await (supabase as any)
      .from('live_sessions')
      .update(updateData)
      .eq('id', sessionId)
    
    if (updateError) {
      console.error('Failed to update session with grades:', updateError)
      return NextResponse.json({ 
        error: 'Failed to save grading results',
        details: updateError 
      }, { status: 500 })
    }
    
    console.log('Grading completed successfully for session:', sessionId)
    
    return NextResponse.json({ 
      success: true,
      scores: analysis.scores,
      feedback: analysis.feedback,
      line_ratings: analysis.line_ratings,
      key_moments: analysis.key_moments,
      virtual_earnings: analysis.virtual_earnings
    })
    
  } catch (error) {
    console.error('Grading error:', error)
    return NextResponse.json({ 
      error: 'Grading failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function gradeWithOpenAI(transcript: any[]) {
  try {
    // Format transcript for OpenAI
    const transcriptText = transcript.map((entry, idx) => 
      `[${idx}] ${entry.speaker === 'user' ? 'Rep' : 'Customer'}: ${entry.text}`
    ).join('\n')
    
    const prompt = `You are an expert sales coach for door-to-door pest control sales. Analyze this conversation and provide comprehensive feedback.

TRANSCRIPT:
${transcriptText}

Provide detailed analysis including:
1. Score each category 0-100: introduction, rapport, listening, sales_technique, closing, safety
2. Overall score (weighted average)
3. For EACH line spoken by the Rep (speaker='user'), rate it as "excellent", "good", "average", or "poor"
4. For lines rated "poor" or "average", suggest a better alternative phrase
5. Identify key moments: price_discussed, safety_addressed, close_attempted, objection_handled, deal_closed
6. Calculate virtual_earnings (if Rep quoted a price AND Customer agreed, return that price, otherwise 0)
7. Provide feedback: strengths (what worked), improvements (what needs work), specific_tips (actionable advice)

Be critical but fair. Door-to-door sales requires excellence.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert sales coach specializing in door-to-door pest control sales. Provide detailed, actionable feedback.' },
        { role: 'user', content: prompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'sales_analysis',
          strict: true,
          schema: {
            type: 'object',
            required: ['scores', 'line_ratings', 'feedback', 'key_moments', 'virtual_earnings'],
            properties: {
              scores: {
                type: 'object',
                required: ['introduction', 'rapport', 'listening', 'sales_technique', 'closing', 'safety', 'overall'],
                properties: {
                  introduction: { type: 'number' },
                  rapport: { type: 'number' },
                  listening: { type: 'number' },
                  sales_technique: { type: 'number' },
                  closing: { type: 'number' },
                  safety: { type: 'number' },
                  overall: { type: 'number' }
                },
                additionalProperties: false
              },
              line_ratings: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['idx', 'rating', 'reason'],
                  properties: {
                    idx: { type: 'number' },
                    rating: { type: 'string', enum: ['excellent', 'good', 'average', 'poor'] },
                    reason: { type: 'string' },
                    alternative: { type: 'string' }
                  },
                  additionalProperties: false
                }
              },
              feedback: {
                type: 'object',
                required: ['strengths', 'improvements', 'specific_tips'],
                properties: {
                  strengths: { 
                    type: 'array', 
                    items: { type: 'string' } 
                  },
                  improvements: { 
                    type: 'array', 
                    items: { type: 'string' } 
                  },
                  specific_tips: { 
                    type: 'array', 
                    items: { type: 'string' } 
                  }
                },
                additionalProperties: false
              },
              key_moments: {
                type: 'object',
                required: ['price_discussed', 'safety_addressed', 'close_attempted', 'objection_handled', 'deal_closed'],
                properties: {
                  price_discussed: { type: 'boolean' },
                  safety_addressed: { type: 'boolean' },
                  close_attempted: { type: 'boolean' },
                  objection_handled: { type: 'boolean' },
                  deal_closed: { type: 'boolean' }
                },
                additionalProperties: false
              },
              virtual_earnings: { type: 'number' }
            },
            additionalProperties: false
          }
        }
      },
      temperature: 0.3,
      max_tokens: 4000
    })
    
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content in OpenAI response')
    }
    
    const analysis = JSON.parse(content)
    console.log('OpenAI grading successful. Overall score:', analysis.scores.overall)
    
    return analysis
  } catch (error) {
    console.error('OpenAI grading error:', error)
    throw error
  }
}
