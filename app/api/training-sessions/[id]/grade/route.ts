import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface GradingResult {
  rapport_score: number
  discovery_score: number
  objection_handling_score: number
  closing_score: number
  overall_score: number
  feedback_strengths: string[]
  feedback_improvements: string[]
  virtual_earnings: number
}

// Simple heuristic grading (backup when OpenAI fails)
function gradeWithHeuristics(transcript: any[]): GradingResult {
  const repLines = transcript.filter(line => line.speaker === 'rep')
  const homeownerLines = transcript.filter(line => line.speaker === 'homeowner')
  
  // Count questions asked by rep
  const questionCount = repLines.filter(line => 
    line.text.includes('?') || 
    line.text.toLowerCase().includes('what') ||
    line.text.toLowerCase().includes('how') ||
    line.text.toLowerCase().includes('when') ||
    line.text.toLowerCase().includes('where') ||
    line.text.toLowerCase().includes('why')
  ).length
  
  // Detect closing attempts
  const closingWords = ['sign', 'contract', 'agreement', 'deal', 'price', 'cost', 'payment']
  const closingAttempts = repLines.filter(line =>
    closingWords.some(word => line.text.toLowerCase().includes(word))
  ).length
  
  // Detect objection handling
  const objectionResponses = repLines.filter(line =>
    line.text.toLowerCase().includes('understand') ||
    line.text.toLowerCase().includes('actually') ||
    line.text.toLowerCase().includes('however') ||
    line.text.toLowerCase().includes('but')
  ).length
  
  // Calculate scores
  const rapport_score = Math.min(100, Math.max(30, repLines.length * 5)) // Base rapport on engagement
  const discovery_score = Math.min(100, questionCount * 15) // 15 points per question
  const objection_handling_score = Math.min(100, objectionResponses * 20) // 20 points per objection response
  const closing_score = Math.min(100, Math.max(25, closingAttempts * 25)) // 25 points per closing attempt
  const overall_score = Math.round((rapport_score + discovery_score + objection_handling_score + closing_score) / 4)
  
  // Generate feedback
  const feedback_strengths: string[] = []
  const feedback_improvements: string[] = []
  
  if (questionCount >= 3) feedback_strengths.push('Asked good discovery questions')
  if (closingAttempts > 0) feedback_strengths.push('Attempted to close the sale')
  if (objectionResponses > 0) feedback_strengths.push('Responded to homeowner concerns')
  
  if (questionCount < 3) feedback_improvements.push('Ask more discovery questions to understand needs')
  if (closingAttempts === 0) feedback_improvements.push('Practice closing techniques to secure the sale')
  if (objectionResponses === 0) feedback_improvements.push('Work on addressing homeowner objections')
  
  // Default strengths/improvements if none found
  if (feedback_strengths.length === 0) {
    feedback_strengths.push('Engaged in conversation with the homeowner')
  }
  if (feedback_improvements.length === 0) {
    feedback_improvements.push('Focus on asking more questions and building rapport')
  }
  
  return {
    rapport_score,
    discovery_score,
    objection_handling_score,
    closing_score,
    overall_score,
    feedback_strengths,
    feedback_improvements,
    virtual_earnings: closingAttempts > 0 ? 50 : 0
  }
}

// OpenAI grading (primary method)
async function gradeWithOpenAI(transcript: any[]): Promise<GradingResult> {
  const transcriptText = transcript
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

Respond with valid JSON only:`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3
  })
  
  const result = JSON.parse(response.choices[0].message.content || '{}')
  
  // Ensure all required fields exist with defaults
  return {
    rapport_score: Math.max(0, Math.min(100, result.rapport_score || 50)),
    discovery_score: Math.max(0, Math.min(100, result.discovery_score || 50)),
    objection_handling_score: Math.max(0, Math.min(100, result.objection_handling_score || 50)),
    closing_score: Math.max(0, Math.min(100, result.closing_score || 50)),
    overall_score: Math.max(0, Math.min(100, result.overall_score || 50)),
    feedback_strengths: Array.isArray(result.strengths) ? result.strengths.slice(0, 5) : ['Engaged with the homeowner'],
    feedback_improvements: Array.isArray(result.improvements) ? result.improvements.slice(0, 5) : ['Practice discovery questions'],
    virtual_earnings: result.virtual_earnings || 0
  }
}

// Grade a training session
export async function POST(_req: Request, context: { params: { id?: string } } | { params: Promise<{ id?: string }> }) {
  try {
    const maybePromiseParams: any = (context as any)?.params
    const params = typeof maybePromiseParams?.then === 'function' ? await maybePromiseParams : maybePromiseParams
    
    const id = params?.id
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid session ID required' }, { status: 400 })
    }
    
    const sessionId = parseInt(id)
    
    // Use service role for all operations
    const serviceSupabase = await createServiceSupabaseClient()
    
    // Get session data
    const { data: session, error: fetchError } = await (serviceSupabase as any)
      .from('training_sessions')
      .select('id, transcript, status')
      .eq('id', sessionId)
      .single()
    
    if (fetchError || !session) {
      console.error('Session not found for grading:', sessionId, fetchError)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    const transcript = session.transcript || []
    if (!Array.isArray(transcript) || transcript.length === 0) {
      console.log('No transcript found for grading:', sessionId)
      return NextResponse.json({ 
        error: 'No transcript available for grading',
        sessionId 
      }, { status: 400 })
    }
    
    console.log(`🎯 Grading session ${sessionId} with ${transcript.length} lines`)
    
    let gradingResult: GradingResult
    let method = 'heuristic'
    
    // Try OpenAI first, fall back to heuristics
    if (openai.apiKey) {
      try {
        gradingResult = await gradeWithOpenAI(transcript)
        method = 'openai'
        console.log(`✅ OpenAI grading successful for session ${sessionId}`)
      } catch (error) {
        console.warn(`⚠️ OpenAI grading failed for session ${sessionId}, using heuristics:`, error)
        gradingResult = gradeWithHeuristics(transcript)
      }
    } else {
      console.warn('No OpenAI API key, using heuristic grading')
      gradingResult = gradeWithHeuristics(transcript)
    }
    
    // Save grading results
    const updateData = {
      rapport_score: gradingResult.rapport_score,
      discovery_score: gradingResult.discovery_score,
      objection_handling_score: gradingResult.objection_handling_score,
      closing_score: gradingResult.closing_score,
      overall_score: gradingResult.overall_score,
      feedback_strengths: gradingResult.feedback_strengths,
      feedback_improvements: gradingResult.feedback_improvements,
      virtual_earnings: gradingResult.virtual_earnings,
      graded_at: new Date().toISOString()
    }
    
    const { error: updateError } = await (serviceSupabase as any)
      .from('training_sessions')
      .update(updateData)
      .eq('id', sessionId)
    
    if (updateError) {
      console.error('Error saving grading results:', updateError)
      return NextResponse.json({ error: 'Failed to save grading results' }, { status: 500 })
    }
    
    console.log(`✅ Grading completed for session ${sessionId} (${method}):`, {
      overall_score: gradingResult.overall_score,
      virtual_earnings: gradingResult.virtual_earnings
    })
    
    return NextResponse.json({
      sessionId,
      method,
      ...gradingResult
    })
  } catch (e: any) {
    console.error('Error grading training session:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
