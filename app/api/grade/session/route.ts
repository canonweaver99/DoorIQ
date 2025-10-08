import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Check if API key is configured
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not configured')
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    console.log('🎯 Starting grading for session:', sessionId)
    
    const supabase = await createServiceSupabaseClient()
    
    // Fetch session data
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    if (sessionError || !session) {
      console.error('❌ Session not found:', sessionError)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    if (!session.full_transcript || session.full_transcript.length === 0) {
      console.error('❌ No transcript found')
      return NextResponse.json({ error: 'No transcript to grade' }, { status: 400 })
    }

    // Fetch knowledge base context for the user
    const { data: knowledgeBase } = await supabase
      .from('knowledge_base')
      .select('file_name, content')
      .eq('user_id', session.user_id)
      .eq('is_active', true)
      .limit(5) // Limit to avoid token overflow

    // Format knowledge base context
    let knowledgeContext = ''
    if (knowledgeBase && knowledgeBase.length > 0) {
      knowledgeContext = '\n\nREFERENCE MATERIALS:\n' + 
        knowledgeBase
          .filter(kb => kb.content)
          .map(kb => `File: ${kb.file_name}\n${kb.content.substring(0, 1000)}...`)
          .join('\n\n')
    }

    // Format transcript for OpenAI
    const formattedTranscript = session.full_transcript
      .map((line: any, index: number) => {
        // Normalize speaker names
        let speaker = 'Homeowner'
        if (line.speaker === 'rep' || line.speaker === 'user') {
          speaker = 'Sales Rep'
        } else if (line.speaker === 'homeowner' || line.speaker === 'agent' || line.speaker === 'ai') {
          speaker = 'Homeowner'
        }
        // Get text from either text or message field
        const text = line.text || line.message || ''
        return `[${index}] ${speaker}: ${text}`
      })
      .join('\n')

    // Call OpenAI for comprehensive analysis
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert sales coach analyzing door-to-door pest control sales conversations. 
          Evaluate each line from the sales rep and provide detailed feedback.
          ${knowledgeContext ? 'Use the provided reference materials to ensure your feedback aligns with company training and best practices.' : ''}
          
          For each sales rep line, assess:
          1. Effectiveness: rate as "excellent", "good", "average", or "poor"
          2. Score: 0-100 based on effectiveness
          3. Alternative approaches: suggest 1-2 better ways to say it (if not excellent)
          4. Category: classify into introduction, rapport, discovery, objection_handling, closing, safety, or general
          
          Also provide overall scores (0-100) for:
          - Overall performance
          - Rapport building
          - Discovery/needs assessment  
          - Objection handling
          - Closing technique
          - Safety discussion
          - Introduction quality
          - Active listening
          
          Identify strengths, areas for improvement, and specific tips.
          ${knowledgeContext}
          
          Return a JSON object with this structure:
          {
            "line_ratings": [
              {
                "line_number": 0,
                "effectiveness": "good",
                "score": 75,
                "alternative_lines": ["Better way to say this..."],
                "improvement_notes": "Consider being more specific about...",
                "category": "introduction"
              }
            ],
            "scores": {
              "overall": 75,
              "rapport": 80,
              "discovery": 70,
              "objection_handling": 65,
              "closing": 70,
              "safety": 85,
              "introduction": 75,
              "listening": 80
            },
            "feedback": {
              "strengths": ["Built good rapport", "Asked relevant questions"],
              "improvements": ["Handle price objections more confidently", "Close earlier in the conversation"],
              "specific_tips": ["When they mention price, pivot to value instead of defending"]
            },
            "virtual_earnings": 75.00,
            "sale_closed": true
          }`
        },
        {
          role: "user",
          content: formattedTranscript
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000
    })

    const gradingResult = JSON.parse(completion.choices[0].message.content || '{}')
    
    console.log('✅ OpenAI grading complete:', {
      lines_rated: gradingResult.line_ratings?.length || 0,
      scores: gradingResult.scores,
      raw_response: completion.choices[0].message.content?.substring(0, 200)
    })

    // Start a transaction to update both tables
    const now = new Date().toISOString()

    // Update live_sessions with scores and analytics
    const rapportScore = typeof gradingResult.scores?.rapport === 'number' ? gradingResult.scores.rapport : null
    const discoveryScore = typeof gradingResult.scores?.discovery === 'number' ? gradingResult.scores.discovery : null
    const objectionScore = typeof gradingResult.scores?.objection_handling === 'number' ? gradingResult.scores.objection_handling : null
    const closeScore = typeof gradingResult.scores?.closing === 'number' ? gradingResult.scores.closing : null

    const calculatedOverall = (() => {
      if (typeof gradingResult.scores?.overall === 'number') {
        return gradingResult.scores.overall
      }
      const scores = [rapportScore, discoveryScore, objectionScore, closeScore].filter((value) => typeof value === 'number') as number[]
      if (scores.length === 0) {
        return 0
      }
      return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
    })()

    const rapportScore = typeof gradingResult.scores?.rapport === 'number' ? gradingResult.scores.rapport : null
    const discoveryScore = typeof gradingResult.scores?.discovery === 'number' ? gradingResult.scores.discovery : null
    const objectionScore = typeof gradingResult.scores?.objection_handling === 'number' ? gradingResult.scores.objection_handling : null
    const closeScore = typeof gradingResult.scores?.closing === 'number' ? gradingResult.scores.closing : null
    const saleClosed = typeof gradingResult.sale_closed === 'boolean' ? gradingResult.sale_closed : false
    const virtualEarnings = saleClosed && typeof gradingResult.virtual_earnings === 'number'
      ? gradingResult.virtual_earnings
      : 0

    const calculatedOverall = (() => {
      if (typeof gradingResult.scores?.overall === 'number') {
        return gradingResult.scores.overall
      }

      const numericScores = [rapportScore, discoveryScore, objectionScore, closeScore].filter((value) => typeof value === 'number') as number[]
      if (numericScores.length === 0) {
        return 0
      }
      return Math.round(numericScores.reduce((sum, value) => sum + value, 0) / numericScores.length)
    })()

    const { error: updateError } = await supabase
      .from('live_sessions')
      .update({
        overall_score: calculatedOverall,
        rapport_score: rapportScore,
        discovery_score: discoveryScore,
        objection_handling_score: objectionScore,
        close_score: closeScore,
        virtual_earnings: virtualEarnings,
        sale_closed: saleClosed,
        analytics: {
          line_ratings: gradingResult.line_ratings || [],
          feedback: gradingResult.feedback || {},
          graded_at: now,
          grading_version: '3.0-openai',
          scores: gradingResult.scores || {}
        }
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('❌ Failed to update session:', updateError)
      throw updateError
    }

    // Line ratings are stored in the analytics JSONB column, no separate table needed
    console.log(`✅ Stored ${gradingResult.line_ratings?.length || 0} line ratings in analytics column`)

    return NextResponse.json({
      success: true,
      scores: gradingResult.scores,
      feedback: gradingResult.feedback,
      lines_graded: gradingResult.line_ratings?.length || 0
    })

  } catch (error: any) {
    console.error('❌ Grading error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to grade session' },
      { status: 500 }
    )
  }
}
