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
    await logEvent(supabase as any, sessionId, 'grading_started', {
      transcript_lines: Array.isArray(transcript) ? transcript.length : 0
    })
    
    let analysis
    let method: 'openai' | 'heuristic' = 'heuristic'
    if (!openai.apiKey) {
      console.warn('⚠️ OpenAI API key not configured — using heuristic grading fallback')
      analysis = simpleHeuristicGrade(transcript)
      method = 'heuristic'
    } else {
      try {
        analysis = await gradeWithOpenAI(transcript)
        method = 'openai'
        console.log('✅ OpenAI grading successful:', {
          overall: analysis.scores.overall,
          lineRatings: analysis.line_ratings?.length || 0,
          strengths: analysis.feedback.strengths?.length || 0
        })
      } catch (gradeError) {
        console.error('❌ OpenAI grading failed, falling back to simple heuristic grade:', gradeError)
        analysis = simpleHeuristicGrade(transcript)
        method = 'heuristic'
      }
    }
    
    // Update session with grading results
    // Round all scores to integers (0-100 range)
    const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)))
    
    const updateData = {
      overall_score: clampScore(analysis.scores.overall),
      rapport_score: clampScore(analysis.scores.rapport),
      discovery_score: clampScore(analysis.scores.discovery),
      objection_handling_score: clampScore(analysis.scores.objection_handling),
      close_score: clampScore(analysis.scores.close),
      virtual_earnings: analysis.virtual_earnings || 0,
      analytics: {
        line_ratings: analysis.line_ratings || [],
        key_moments: analysis.key_moments || {},
        feedback: analysis.feedback || {},
        scores: analysis.scores, // Store original decimal scores here
        grading_version: '3.0-openai',
        graded_at: new Date().toISOString()
      }
    }
    
    console.log('💾 Saving grading results to database...')
    
    const { error: updateError } = await (supabase as any)
      .from('live_sessions')
      .update(updateData)
      .eq('id', sessionId)
    
    if (updateError) {
      console.error('❌ Failed to update session with grades:', updateError)
      await logEvent(supabase as any, sessionId, 'grading_failed', {
        method,
        error: updateError
      })
      return NextResponse.json({ 
        error: 'Failed to save grading results',
        details: updateError 
      }, { status: 500 })
    }
    
    console.log('✅ Grading completed successfully for session:', sessionId)
    await logEvent(supabase as any, sessionId, 'grading_saved', {
      method,
      overall: analysis.scores?.overall ?? null,
      line_ratings: Array.isArray(analysis.line_ratings) ? analysis.line_ratings.length : 0,
      graded_at: new Date().toISOString()
    })
    
    return NextResponse.json({ 
      success: true,
      scores: analysis.scores,
      feedback: analysis.feedback,
      line_ratings: analysis.line_ratings,
      key_moments: analysis.key_moments,
      virtual_earnings: analysis.virtual_earnings
    })
    
  } catch (error) {
    console.error('❌ Grading error:', error)
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error('Error stack:', error.stack)
    }
    try {
      const { sessionId } = await request.json().catch(() => ({ sessionId: null }))
      if (sessionId) {
        const supabase = await createServiceSupabaseClient()
        await logEvent(supabase as any, sessionId, 'grading_failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    } catch {}
    return NextResponse.json({ 
      error: 'Grading failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

async function logEvent(supabase: any, sessionId: string, event_type: string, data: any) {
  try {
    await supabase
      .from('session_events')
      .insert({
        session_id: sessionId,
        event_type,
        timestamp: new Date().toISOString(),
        data
      })
  } catch (e) {
    console.warn('⚠️ Failed to log session event:', event_type, e)
  }
}
async function gradeWithOpenAI(transcript: any[]) {
  try {
    console.log('🤖 Starting OpenAI grading...', {
      transcriptLines: transcript.length,
      repLines: transcript.filter(t => t.speaker === 'user').length
    })
    
    // Format transcript for OpenAI
    const transcriptText = transcript.map((entry, idx) => 
      `[${idx}] ${entry.speaker === 'user' ? 'Rep' : 'Customer'}: ${entry.text}`
    ).join('\n')
    
    const prompt = `You are an expert sales coach for door-to-door pest control sales. Analyze this conversation and provide comprehensive feedback.

TRANSCRIPT:
${transcriptText}

Provide detailed analysis focusing on these 4 KEY AREAS:

1. RAPPORT (0-100): How well did they introduce themselves and gain the customer's favor and trust?
   - Quality of introduction
   - Building connection and trust
   - Making the customer comfortable
   - Personal warmth and authenticity

2. DISCOVERY (0-100): How many questions did they ask and how well did they listen?
   - Number and quality of discovery questions
   - Active listening demonstrated
   - Understanding customer needs/pain points
   - Gathering relevant information

3. OBJECTION HANDLING (0-100): How well did they answer questions and propose solutions?
   - Addressing concerns effectively
   - Providing clear, thoughtful solutions
   - Confidence in responses
   - Turning objections into opportunities

4. CLOSE (0-100): How effective was their closing method and were they able to sign on the doorstep?
   - Closing technique used
   - Confidence in asking for the sale
   - Creating urgency appropriately
   - Actually getting the commitment

OVERALL SCORE: Calculate as the average of these 4 scores.

ALSO PROVIDE:
- Line-by-line ratings for EACH Rep line (excellent/good/average/poor)
- Alternative phrases for poor/average lines
- Key moments tracking (price_discussed, close_attempted, objection_handled, deal_closed)
- Virtual earnings (price if deal closed, 0 otherwise)
- The good, bad, and ugly: Be brutally honest about what worked, what failed, and specific improvements needed

Focus on these 4 areas only. Be critical but constructive.`

    console.log('📤 Calling OpenAI API...')
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
                required: ['rapport', 'discovery', 'objection_handling', 'close', 'overall'],
                properties: {
                  rapport: { type: 'number' },
                  discovery: { type: 'number' },
                  objection_handling: { type: 'number' },
                  close: { type: 'number' },
                  overall: { type: 'number' }
                },
                additionalProperties: false
              },
              line_ratings: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['idx', 'rating', 'reason', 'alternative'],
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
                required: ['price_discussed', 'close_attempted', 'objection_handled', 'deal_closed'],
                properties: {
                  price_discussed: { type: 'boolean' },
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
    
    console.log('📥 OpenAI response received')
    
    const content = response.choices[0]?.message?.content
    if (!content) {
      console.error('❌ No content in OpenAI response')
      throw new Error('No content in OpenAI response')
    }
    
    console.log('🔍 Parsing OpenAI response...')
    const analysis = JSON.parse(content)
    
    console.log('✅ OpenAI grading successful:', {
      overall: analysis.scores?.overall,
      hasLineRatings: !!analysis.line_ratings,
      lineRatingsCount: analysis.line_ratings?.length || 0,
      hasStrengths: !!analysis.feedback?.strengths,
      strengthsCount: analysis.feedback?.strengths?.length || 0
    })
    
    return analysis
  } catch (error) {
    console.error('❌ OpenAI grading error:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    throw error
  }
}

// Extremely simple fallback grader to ensure we never return zeroed analytics
function simpleHeuristicGrade(transcript: Array<{ speaker: string; text: string }>) {
  const repLines = transcript.filter(t => t.speaker === 'user')
  const custLines = transcript.filter(t => t.speaker !== 'user')

  const askedQuestions = repLines.filter(l => l.text.includes('?')).length
  const empathy = repLines.filter(l => /i (understand|hear|appreciate)/i.test(l.text)).length
  const safety = repLines.some(l => /(safe|pets|children|eco)/i.test(l.text))
  const closing = repLines.some(l => /(schedule|appointment|which works|when would you)/i.test(l.text))
  const intro = repLines.slice(0, 5).some(l => /(my name|i'm from|pest control)/i.test(l.text))

  const listening = Math.min(100, Math.round((askedQuestions * 12) + (custLines.length * 2)))
  const rapport = Math.min(100, empathy * 25)
  const introduction = intro ? 75 : 35
  const salesTechnique = Math.min(100, Math.round((askedQuestions * 10) + (safety ? 20 : 0)))
  const closingScore = closing ? 70 : 30
  const safetyScore = safety ? 80 : 40

  const overall = Math.round(
    introduction * 0.15 +
    rapport * 0.20 +
    listening * 0.20 +
    salesTechnique * 0.25 +
    closingScore * 0.20
  )

  const line_ratings = repLines.map((l, i) => ({
    idx: transcript.indexOf(repLines[i]),
    rating: /\?|understand|which works|schedule|safe/i.test(l.text) ? 'good' : 'average',
    reason: 'Baseline heuristic rating',
    alternative: ''
  }))

  return {
    scores: {
      introduction,
      rapport,
      listening,
      sales_technique: salesTechnique,
      closing: closingScore,
      safety: safetyScore,
      overall
    },
    line_ratings,
    feedback: {
      strengths: rapport > 50 ? ['Good empathy shown in parts of the call'] : [],
      improvements: ['Ask more discovery questions', 'Attempt an assumptive close'],
      specific_tips: [
        "Try: 'I have Tuesday or Thursday available — which works better?'",
        "Acknowledge concerns: 'I completely understand, many homeowners tell me the same thing.'"
      ]
    },
    key_moments: {
      price_discussed: /\$|price|cost/i.test(repLines.map(r => r.text).join(' ')),
      safety_addressed: safety,
      close_attempted: closing,
      objection_handled: empathy > 0,
      deal_closed: false
    },
    virtual_earnings: 0
  }
}
