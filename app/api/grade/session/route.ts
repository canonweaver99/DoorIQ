import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { analyzeConversation } from '@/lib/trainer/conversationAnalyzer'
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
    
    // Run comprehensive analysis
    console.log('Running comprehensive analysis for session:', sessionId)
    const analysis = analyzeConversation(transcript)
    
    // Enhance with AI insights if OpenAI is configured
    let aiInsights = null
    if (openai.apiKey) {
      try {
        aiInsights = await getAIInsights(transcript, analysis)
      } catch (e) {
        console.error('AI insights generation failed:', e)
        // Continue without AI insights
      }
    }
    
    // Update session with grading results
    const updateData = {
      overall_score: analysis.overallScore,
      rapport_score: analysis.scores.rapport,
      introduction_score: analysis.scores.introduction,
      listening_score: analysis.scores.listening,
      objection_handling_score: analysis.scores.salesTechnique,
      safety_score: analysis.keyMoments.safetyAddressed ? 85 : 40,
      close_effectiveness_score: analysis.scores.closing,
      analytics: {
        ...session.analytics,
        ...analysis,
        aiInsights,
        grading_version: '2.0',
        graded_at: new Date().toISOString()
      },
      virtual_earnings: analysis.virtualEarnings || 0
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
    
    // Store detailed metrics if we have advanced metrics
    if (analysis.advancedMetrics) {
      await storeDetailedMetrics(supabase, sessionId, session.user_id, analysis)
    }
    
    // Update user patterns if detected
    if (analysis.patterns && session.user_id) {
      await updateUserPatterns(supabase, session.user_id, analysis.patterns)
    }
    
    console.log('Grading completed successfully for session:', sessionId)
    
    return NextResponse.json({ 
      success: true,
      scores: {
        overall: analysis.overallScore,
        ...analysis.scores
      },
      feedback: analysis.feedback,
      advancedMetrics: analysis.advancedMetrics,
      patterns: analysis.patterns
    })
    
  } catch (error) {
    console.error('Grading error:', error)
    return NextResponse.json({ 
      error: 'Grading failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function getAIInsights(transcript: any[], analysis: any) {
  try {
    const transcriptText = transcript.map((entry, idx) => 
      `[Line ${idx + 1}] ${entry.speaker === 'user' ? 'Sales Rep' : 'Customer'}: ${entry.text}`
    ).join('\n')
    
    const prompt = `Analyze this sales conversation and provide insights beyond the basic metrics.

TRANSCRIPT:
${transcriptText}

BASIC ANALYSIS:
Overall Score: ${analysis.overallScore}
Key Moments: ${JSON.stringify(analysis.keyMoments)}
Patterns Detected: ${JSON.stringify(analysis.patterns || {})}

Provide:
1. Hidden opportunities the rep missed
2. Subtle psychological insights about the customer
3. Advanced sales techniques that could have been used
4. Prediction of long-term customer satisfaction
5. Specific language improvements

Keep response concise and actionable.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert sales analyst specializing in door-to-door pest control sales.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    })
    
    return response.choices[0]?.message?.content || null
  } catch (error) {
    console.error('AI insights error:', error)
    return null
  }
}

async function storeDetailedMetrics(supabase: any, sessionId: string, userId: string, analysis: any) {
  try {
    // Check if table exists by attempting insert
    const { error } = await supabase
      .from('session_detailed_metrics')
      .insert({
        session_id: sessionId,
        user_id: userId,
        metric_category: 'comprehensive',
        metric_data: {
          advancedMetrics: analysis.advancedMetrics,
          patterns: analysis.patterns,
          timestamp: new Date().toISOString()
        }
      })
    
    if (error && !error.message.includes('relation "session_detailed_metrics" does not exist')) {
      console.error('Failed to store detailed metrics:', error)
    }
  } catch (e) {
    // Table might not exist yet, that's okay
    console.log('Detailed metrics table not available yet')
  }
}

async function updateUserPatterns(supabase: any, userId: string, patterns: any) {
  try {
    if (!patterns || !userId) return
    
    // For now, just log patterns - we'll implement full tracking when tables are ready
    console.log('User patterns detected:', {
      userId,
      strengths: patterns.strengths,
      weaknesses: patterns.weaknesses,
      missedOpportunities: patterns.missedOpportunities
    })
    
    // Try to update user record with latest patterns (if column exists)
    const { error } = await supabase
      .from('users')
      .update({
        latest_patterns: patterns,
        patterns_updated_at: new Date().toISOString()
      })
      .eq('id', userId)
    
    // Ignore error if columns don't exist yet
    if (error && !error.message.includes('column')) {
      console.error('Failed to update user patterns:', error)
    }
  } catch (e) {
    console.log('User patterns tracking not fully implemented yet')
  }
}
