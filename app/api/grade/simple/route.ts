import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { logger } from '@/lib/logger'

export const maxDuration = 60 // 60 seconds max
export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000,
  maxRetries: 3
})

/**
 * Detect inappropriate/profane language in transcript
 */
function detectInappropriateLanguage(transcript: any[]): boolean {
  try {
    if (!Array.isArray(transcript) || transcript.length === 0) return false
    
    const inappropriatePatterns = [
      /\bn[i1]gg?[e3]r\b/i,
      /\bf[a4]gg?[o0]t\b/i,
      /\bp[u3]ssy\b/i,
      /\bf[u3]ck\b/i,
      /\bsh[i1]t\b/i,
      /\bb[i1]tch\b/i,
      /\bwh[o0]re\b/i,
      /\bsl[u3]t\b/i,
      /\bc[u3]nt\b/i,
      /\bc[o0]ck\b/i,
      /\bd[i1]ck\b/i,
      /\bt[i1]ts?\b/i,
      /\btw[a4]t\b/i,
      /\bp[o0]rn\b/i,
      /\br[a4]p[e3]\b/i,
      /\bk[i1]ll\s+y[o0]u\b/i,
      /\bf[u3]ck\s+y[o0]u\b/i,
      /\bd[i1][e3]\b/i,
      /\bbl[o0]w\s+j[o0]b\b/i,
      /\br[e3]t[a4]rd\b/i,
      /\bp[i1]ss\s+[o0]ff\b/i,
      /\bg[o0]\s+f[u3]ck\s+y[o0]urs[e3]lf\b/i,
      /\bsh[u3]t\s+u[p3]\b/i,
      /\bsh[u3]t\s+th[e3]\s+f[u3]ck\s+u[p3]\b/i
    ]
  
    for (const entry of transcript) {
      if (!entry || typeof entry !== 'object') continue
      const text = (entry.text || entry.message || '').toLowerCase()
      if (!text || typeof text !== 'string') continue
      
      for (const pattern of inappropriatePatterns) {
        try {
          if (pattern.test(text)) {
            logger.warn('🚫 Inappropriate language detected', { 
              pattern: pattern.toString(), 
              text: text.substring(0, 50),
              speaker: entry.speaker 
            })
            return true
          }
        } catch (patternError) {
          continue
        }
      }
    }
    
    return false
  } catch (error) {
    logger.error('Error in inappropriate language detection', { error })
    return false
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  let sessionId: string | undefined
  
  try {
    const body = await req.json()
    sessionId = body.sessionId
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }
    
    const supabase = await createServiceSupabaseClient()
    
    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    if (sessionError || !session) {
      logger.error('Session not found', { sessionId, error: sessionError })
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    const transcript = session.full_transcript || []
    if (!Array.isArray(transcript) || transcript.length === 0) {
      return NextResponse.json({ error: 'No transcript available' }, { status: 400 })
    }
    
    // Check for inappropriate language
    const hasInappropriateLanguage = detectInappropriateLanguage(transcript)
    if (hasInappropriateLanguage) {
      logger.error('🚫 Inappropriate language detected - setting all scores to 0', { sessionId })
      
      await supabase
        .from('live_sessions')
        .update({
          overall_score: 0,
          rapport_score: 0,
          discovery_score: 0,
          objection_handling_score: 0,
          close_score: 0,
          sale_closed: false,
          virtual_earnings: 0,
          grading_status: 'complete',
          graded_at: new Date().toISOString(),
          analytics: {
            ...session.analytics,
            inappropriate_language_detected: true,
            grading_note: 'Session score set to 0 due to inappropriate language detected in transcript'
          }
        })
        .eq('id', sessionId)
      
      return NextResponse.json({
        sessionId,
        status: 'complete',
        inappropriateLanguageDetected: true
      })
    }
    
    // Format transcript for OpenAI
    const fullTranscript = transcript.map((entry: any, index: number) => {
      const speaker = entry.speaker === 'user' || entry.speaker === 'rep' ? 'rep' : 'customer'
      const text = entry.text || entry.message || ''
      return `[${index}] ${speaker}: ${text}`
    }).join('\n')
    
    const durationSeconds = session.duration_seconds || 0
    const durationMinutes = Math.round(durationSeconds / 60)
    
    // Simple, focused prompt
    const prompt = `Analyze this door-to-door sales conversation transcript and return JSON with ONLY these fields:

1. sale_closed (boolean) - Did the customer commit to service? Look for: customer agreement + info collection, scheduling, payment discussion, or rep collecting customer info after discussing service.
2. virtual_earnings (number) - Deal value if closed (MUST extract exact price mentioned in conversation - look for dollar amounts, pricing discussions, service costs. Do NOT use defaults. If no price mentioned, return 0), 0 if not closed
3. deal_details (object) - If sale_closed=true: {product_sold, service_type, base_price, monthly_value, contract_length, total_contract_value, payment_method, add_ons, start_date}
4. failure_reason (string) - If sale_closed=false: Why did the close fail? (e.g., "Energy dropped in final 2 minutes", "Didn't ask for the close", "Talk ratio too high")
5. finalScores (object) - {overall: 0-100, rapport: 0-100, discovery: 0-100, objectionHandling: 0-100, closing: 0-100}
   - If sale_closed=true: overall MUST be at least 80, closing MUST be 90-100
6. top_strengths (array) - Top 2-3 strengths with brief description
7. top_improvements (array) - Top 2-3 areas for improvement
8. session_highlight (string) - One highlight from the conversation
9. key_moments (array) - Important moments: [{time: "MM:SS", type: "string", description: "string", transcript: "actual quote from conversation"}]

CRITICAL SALE DETECTION RULES:
- Sale is CLOSED if customer agreed AND (info was collected OR scheduling happened OR payment discussed)
- Look for: "let's do it", "go ahead", "sounds good", "yes", "okay" + customer provides name/phone/email/schedule
- If rep asks for info after discussing service and customer provides it = SALE CLOSED
- If customer schedules appointment = SALE CLOSED
- Be thorough - don't miss sales that happened

TRANSCRIPT (${durationMinutes} minutes, ${transcript.length} lines):
${fullTranscript}

Return ONLY valid JSON matching this structure:
{
  "sale_closed": boolean,
  "virtual_earnings": number,
  "deal_details": object,
  "failure_reason": string,
  "finalScores": {
    "overall": number,
    "rapport": number,
    "discovery": number,
    "objectionHandling": number,
    "closing": number
  },
  "top_strengths": ["string"],
  "top_improvements": ["string"],
  "session_highlight": "string",
  "key_moments": [{"time": "MM:SS", "type": "string", "description": "string", "transcript": "actual quote from conversation"}]
}`

    logger.info('🤖 Starting simple grading', { sessionId, transcriptLength: transcript.length })
    
    // Single OpenAI call
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Sales coach. Return ONLY valid JSON, no markdown formatting.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    })
    
    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No content from OpenAI')
    }
    
    const parsed = JSON.parse(content)
    
    logger.info('✅ Simple grading complete', {
      sessionId,
      sale_closed: parsed.sale_closed,
      overall_score: parsed.finalScores?.overall,
      timeElapsed: Date.now() - startTime
    })
    
    // Extract data
    const saleClosed = parsed.sale_closed || false
    // Only use amounts that were actually extracted from conversation - no defaults
    const virtualEarnings = saleClosed ? (parsed.virtual_earnings || parsed.deal_details?.total_contract_value || 0) : 0
    const finalScores = parsed.finalScores || {}
    const dealDetails = saleClosed ? (parsed.deal_details || {}) : {}
    const failureReason = !saleClosed ? (parsed.failure_reason || 'Close attempt did not result in sale') : null
    
    // Ensure earnings_data is populated if sale closed
    const earningsData = saleClosed ? {
      base_amount: dealDetails?.base_price || virtualEarnings,
      closed_amount: virtualEarnings,
      total_earned: virtualEarnings
    } : {}
    
    // Format key moments with timestamps and transcript
    const keyMoments = (parsed.key_moments || []).map((moment: any) => {
      // Try to find transcript snippet for this moment
      let transcriptText = moment.transcript || moment.description || ''
      
      // If no transcript provided, try to find it from the full transcript by timestamp
      if (!transcriptText && moment.time && transcript && Array.isArray(transcript)) {
        const parseTimestamp = (ts: string): number => {
          const parts = ts.split(':').map(Number)
          if (parts.length === 2) return parts[0] * 60 + parts[1] // MM:SS
          if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2] // HH:MM:SS
          return 0
        }
        
        const momentSeconds = parseTimestamp(moment.time)
        const durationSeconds = session.duration_seconds || 0
        
        if (momentSeconds > 0 && durationSeconds > 0) {
          // Find entry closest to the timestamp
          let closestEntry = null
          let minDiff = Infinity
          
          transcript.forEach((entry: any, idx: number) => {
            if (entry.timestamp) {
              const entryTime = typeof entry.timestamp === 'string' 
                ? new Date(entry.timestamp).getTime() / 1000
                : entry.timestamp
              const sessionStart = session.created_at 
                ? new Date(session.created_at).getTime() / 1000
                : Date.now() / 1000
              const entrySeconds = entryTime - sessionStart
              const diff = Math.abs(entrySeconds - momentSeconds)
              
              if (diff < minDiff) {
                minDiff = diff
                closestEntry = entry
              }
            } else {
              // Estimate based on position in transcript
              const estimatedSeconds = (idx / transcript.length) * durationSeconds
              const diff = Math.abs(estimatedSeconds - momentSeconds)
              if (diff < minDiff && diff < 30) { // Within 30 seconds
                minDiff = diff
                closestEntry = entry
              }
            }
          })
          
          if (closestEntry) {
            transcriptText = closestEntry.text || closestEntry.message || moment.description || ''
          }
        }
        
        // If still no transcript, use description or find a relevant snippet
        if (!transcriptText) {
          transcriptText = moment.description || ''
          // Try to find entries related to the moment type
          if (transcript.length > 0) {
            const relevantEntries = transcript.filter((entry: any) => {
              const text = (entry.text || entry.message || '').toLowerCase()
              const type = (moment.type || '').toLowerCase()
              if (type.includes('objection') && (text.includes('not interested') || text.includes('too expensive') || text.includes('think about'))) {
                return true
              }
              if (type.includes('close') && (text.includes('ready to') || text.includes('get started') || text.includes('sign up'))) {
                return true
              }
              return false
            })
            
            if (relevantEntries.length > 0) {
              transcriptText = relevantEntries[0].text || relevantEntries[0].message || transcriptText
            }
          }
        }
      }
      
      return {
        ...moment,
        id: moment.id || `moment-${moment.time || Date.now()}`,
        timestamp: moment.time || '00:00',
        type: moment.type || 'general',
        description: moment.description || '',
        transcript: transcriptText,
        importance: moment.importance || 5,
        outcome: moment.outcome || 'neutral'
      }
    })
    
    // Preserve existing instant_metrics (especially conversationBalance from live session)
    const existingInstantMetrics = session.instant_metrics || {}
    
    // Build update object
    const updateData: any = {
      // Core scores
      overall_score: Math.round(finalScores.overall || 0),
      rapport_score: Math.round(finalScores.rapport || 0),
      discovery_score: Math.round(finalScores.discovery || 0),
      objection_handling_score: Math.round(finalScores.objectionHandling || 0),
      close_score: Math.round(finalScores.closing || 0),
      
      // Sale/Deal status
      sale_closed: saleClosed,
      return_appointment: false,
      virtual_earnings: virtualEarnings,
      
      // JSONB data
      earnings_data: earningsData,
      deal_details: dealDetails,
      key_moments: keyMoments,
      
      // Analytics (contains feedback and other data)
      analytics: {
        ...(session.analytics || {}),
        feedback: {
          strengths: parsed.top_strengths || [],
          improvements: parsed.top_improvements || [],
          specific_tips: [],
          session_highlight: parsed.session_highlight || ''
        },
        failure_analysis: !saleClosed ? {
          reason: failureReason,
          critical_moments: []
        } : null
      },
      
      // Grading status
      grading_status: 'complete',
      graded_at: new Date().toISOString()
    }
    
    // Ensure ended_at is set
    if (!session.ended_at) {
      updateData.ended_at = new Date().toISOString()
    }
    
    // Preserve instant_metrics if they exist (especially conversationBalance from live session)
    // Only update instant_metrics if we're not overwriting existing data
    if (Object.keys(existingInstantMetrics).length > 0) {
      updateData.instant_metrics = existingInstantMetrics
    }
    
    // Update database
    const { error: updateError } = await supabase
      .from('live_sessions')
      .update(updateData)
      .eq('id', sessionId)
    
    if (updateError) {
      logger.error('Error updating session', { sessionId, error: updateError })
      throw updateError
    }
    
    logger.info('✅ Session updated successfully', {
      sessionId,
      sale_closed: saleClosed,
      overall_score: finalScores.overall,
      totalTime: Date.now() - startTime
    })
    
    return NextResponse.json({
      sessionId,
      status: 'complete',
      sale_closed: saleClosed,
      overall_score: finalScores.overall,
      timeElapsed: Date.now() - startTime
    })
    
  } catch (error: any) {
    logger.error('❌ Simple grading failed', { error: error.message, stack: error.stack, sessionId })
    
    // Try to mark as failed in database
    if (sessionId) {
      try {
        const supabase = await createServiceSupabaseClient()
        const { data: existingSession } = await supabase
          .from('live_sessions')
          .select('analytics')
          .eq('id', sessionId)
          .single()
        
        await supabase
          .from('live_sessions')
          .update({
            grading_status: 'failed',
            analytics: {
              ...(existingSession?.analytics || {}),
              grading_error: error.message
            }
          })
          .eq('id', sessionId)
      } catch (dbError) {
        logger.error('Failed to update error status', { dbError })
      }
    }
    
    return NextResponse.json(
      { error: 'Grading failed', message: error.message },
      { status: 500 }
    )
  }
}
