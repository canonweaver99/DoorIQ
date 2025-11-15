import { NextRequest } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { logger } from '@/lib/logger'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 90000,
})

// Helper to extract sections from streaming JSON
function extractCompletedSections(partialJson: string) {
  const sections: any = {}
  
  try {
    // Try to parse what we have so far
    const parsed = JSON.parse(partialJson + '}')
    return parsed
  } catch {
    // If full parse fails, try to extract completed fields
    const patterns = [
      { key: 'session_summary', regex: /"session_summary":\s*({[^}]+})/ },
      { key: 'scores', regex: /"scores":\s*({[^}]+})/ },
      { key: 'feedback', regex: /"feedback":\s*({[\s\S]*?"specific_tips":\s*\[[^\]]*\]})/ },
      { key: 'objection_analysis', regex: /"objection_analysis":\s*({[\s\S]*?"objections":\s*\[[^\]]*\]})/ },
    ]
    
    for (const pattern of patterns) {
      const match = partialJson.match(pattern.regex)
      if (match) {
        try {
          sections[pattern.key] = JSON.parse(match[1])
        } catch {
          // Incomplete section, skip
        }
      }
    }
  }
  
  return sections
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()
  const startTime = Date.now()
  
  try {
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return new Response('Session ID required', { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Response('OpenAI API key not configured', { status: 500 })
    }

    const supabase = await createServiceSupabaseClient()
    
    // Fetch session data (same as non-streaming version)
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    if (sessionError || !session) {
      return new Response('Session not found', { status: 404 })
    }
    
    if (!(session as any).full_transcript || (session as any).full_transcript.length === 0) {
      return new Response('No transcript to grade', { status: 400 })
    }

    // Get user profile and team config (simplified for streaming)
    const { data: userProfile } = await supabase
      .from('users')
      .select('team_id, full_name')
      .eq('id', (session as any).user_id)
      .single()
    
    const salesRepName = (userProfile as any)?.full_name || 'Sales Rep'
    const customerName = (session as any).agent_name || 'Homeowner'

    // Build the transcript
    const transcriptToGrade = (session as any).full_transcript
    const formattedTranscript = transcriptToGrade
      .map((entry: any, index: number) => {
        const speaker = entry.speaker === 'user' ? salesRepName : customerName
        const timestamp = entry.timestamp || '0:00'
        const text = entry.text || entry.message || ''
        return `[${index}] (${timestamp}) ${speaker}: ${text}`
      })
      .join('\n')

    // Build system prompt (matching non-streaming version)
    const systemPrompt = `You are an expert door-to-door sales coach. Analyze this conversation and return ONLY valid JSON with these exact fields:

{
  "session_summary": { "total_lines": int, "rep_lines": int, "customer_lines": int, "objections_detected": int, "questions_asked": int },
  "scores": { "overall": int, "rapport": int, "discovery": int, "objection_handling": int, "closing": int, "safety": int, "introduction": int, "listening": int, "speaking_pace": int, "question_ratio": int, "active_listening": int, "assumptive_language": int },
  "filler_word_count": int,
  "feedback": { 
    "strengths": ["SPECIFIC examples with exact details from conversation"], 
    "improvements": ["SPECIFIC issues with concrete examples"], 
    "specific_tips": ["ACTIONABLE tips with context"] 
  },
  "objection_analysis": { 
    "total_objections": int,
    "objections": [{"objection": "EXACT customer quote", "response": "How rep responded", "effectiveness": "good/poor"}]
  },
  "coaching_plan": { 
    "immediate_fixes": [{"issue": "SPECIFIC issue with example", "practice_scenario": "Concrete scenario", "resource": ""}], 
    "skill_development": [], 
    "role_play_scenarios": ["SPECIFIC scenario based on actual conversation topics"] 
  },
  "timeline_key_moments": [
    { "position": 33, "line_number": int, "timestamp": "0:00", "moment_type": "Opening", "quote": "actual customer or rep quote", "is_positive": bool, "key_takeaway": "Specific actionable tip based on what happened here" },
    { "position": 66, "line_number": int, "timestamp": "0:00", "moment_type": "Key Moment", "quote": "actual customer or rep quote", "is_positive": bool, "key_takeaway": "Specific actionable tip based on what happened here" },
    { "position": 90, "line_number": int, "timestamp": "0:00", "moment_type": "Close Attempt", "quote": "actual customer or rep quote", "is_positive": bool, "key_takeaway": "Specific actionable tip based on what happened here" }
  ],
  "sale_closed": bool,
  "return_appointment": bool,
  "virtual_earnings": number,
  "earnings_data": { "base_amount": 0, "closed_amount": number, "commission_rate": 0.30, "commission_earned": number, "bonus_modifiers": { "quick_close": 0, "upsell": 0, "retention": 0, "same_day_start": 0, "referral_secured": 0, "perfect_pitch": 0 }, "total_earned": number },
  "deal_details": { "product_sold": "", "service_type": "", "base_price": number, "monthly_value": number, "contract_length": number, "total_contract_value": number, "payment_method": "", "add_ons": [], "start_date": "" },
  "enhanced_metrics": {
    "filler_words": {
      "total_count": int,
      "per_minute": number,
      "common_fillers": { "um": int, "uh": int, "uhh": int, "like": int, "erm": int, "err": int, "hmm": int },
      "locations": [{ "line_number": int, "timestamp": "M:SS", "text": "quote with filler word" }]
    }
  }
}

SCORING (0-100 each):
- Overall: Average of all scores
- Rapport: Connection, warmth, trust
- Discovery: Questions, needs assessment
- Objection Handling: Addressing concerns
- Closing: Commitment attempts (90-100=sale, 75-89=appointment, 60-74=trial close, 40-59=weak ask, 0-39=no close)
- Safety: Pet/child safety mentions
- Introduction: Opening strength
- Listening: Acknowledgment, paraphrasing
- Speaking Pace: Appropriate speed
- Question Ratio: Questions vs statements (30-40% ideal)
- Active Listening: Reflects understanding
- Assumptive Language: "When" not "if"

TIMELINE: Pick 3 key moments at 33%, 66%, 90% of conversation. Use EXACT timestamps from transcript. Include a specific "key_takeaway" for each moment based on what actually happened.

EARNINGS:
- sale_closed: true ONLY if customer committed to PAID service
- return_appointment: true if appointment/inspection scheduled
- Commission rate always 0.30 (30%)
- virtual_earnings = total_contract_value × 0.30

FILLER WORDS:
- Count ONLY: "um", "uh", "uhh", "erm", "err", "hmm"
- NEVER count "like" as a filler word (it's almost always used correctly in conversation)

FEEDBACK - BE SPECIFIC:
- Reference actual names, topics, details from THIS conversation
- Quote exact phrases
- Avoid generic advice
- Make it personal to THIS call

Return ONLY valid JSON. No commentary.`

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `TRANSCRIPT:\n${formattedTranscript}` }
    ]

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let accumulatedContent = ''
          let lastSentSections: any = {}
          
          // Send initial status
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Starting AI analysis...' })}\n\n`))
          
          const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: messages as any,
          response_format: { type: "json_object" },
          max_tokens: 4000,
          temperature: 0.2,
          stream: true
          })

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || ''
            accumulatedContent += content
            
            // Try to extract completed sections
            const sections = extractCompletedSections(accumulatedContent)
            
            // Send new sections as they complete
            for (const [key, value] of Object.entries(sections)) {
              if (JSON.stringify(value) !== JSON.stringify(lastSentSections[key])) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'section', 
                  section: key, 
                  data: value 
                })}\n\n`))
                lastSentSections[key] = value
              }
            }
          }
          
          // Parse final complete response
          let gradingResult
          try {
            gradingResult = JSON.parse(accumulatedContent)
          } catch (parseError) {
            logger.error('Failed to parse streaming response', parseError)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              message: 'Failed to parse AI response' 
            })}\n\n`))
            controller.close()
            return
          }

          // Save to database (same logic as non-streaming)
          const now = new Date().toISOString()
          
          // Extract scores
          const rapportScore = gradingResult.scores?.rapport ?? null
          const discoveryScore = gradingResult.scores?.discovery ?? null
          const objectionScore = gradingResult.scores?.objection_handling ?? null
          const closeScore = gradingResult.scores?.closing ?? null
          const safetyScore = gradingResult.scores?.safety ?? null
          const speakingPaceScore = gradingResult.scores?.speaking_pace ?? null
          const questionRatioScore = gradingResult.scores?.question_ratio ?? null
          const activeListeningScore = gradingResult.scores?.active_listening ?? null
          const assumptiveLanguageScore = gradingResult.scores?.assumptive_language ?? null
          const fillerWordCount = gradingResult.filler_word_count ?? 0
          const returnAppointment = gradingResult.return_appointment ?? false

          // Calculate overall score (simplified)
          const calculatedOverall = gradingResult.scores?.overall ?? 0
          
          // Extract other data
          const saleClosed = gradingResult.sale_closed ?? false
          const virtualEarnings = gradingResult.virtual_earnings ?? 0
          const feedback = gradingResult.feedback || {}
          const objectionAnalysis = gradingResult.objection_analysis || {}
          const coachingPlan = gradingResult.coaching_plan || {}
          const timelineKeyMoments = gradingResult.timeline_key_moments || []
          const earningsData = gradingResult.earnings_data || {}
          const dealDetails = gradingResult.deal_details || {}
          const enhancedMetrics = gradingResult.enhanced_metrics || {}
          
          // Extract line ratings if present (for future use)
          // const lineRatings = gradingResult.line_ratings || []
          
          // Update database
          const updateData: any = {
            graded: true,
            graded_at: now,
            overall_score: calculatedOverall,
            rapport_score: rapportScore,
            discovery_score: discoveryScore,
            objection_score: objectionScore,
            close_score: closeScore,
            safety_score: safetyScore,
            speaking_pace_score: speakingPaceScore,
            question_ratio_score: questionRatioScore,
            active_listening_score: activeListeningScore,
            assumptive_language_score: assumptiveLanguageScore,
            filler_word_count: fillerWordCount,
            sale_closed: saleClosed,
            return_appointment: returnAppointment,
            virtual_earnings: virtualEarnings,
            feedback: feedback,
            objection_analysis: objectionAnalysis,
            coaching_plan: coachingPlan,
            timeline_key_moments: timelineKeyMoments,
            earnings_data: earningsData,
            deal_details: dealDetails,
            scores: gradingResult.scores || {},
            analytics: {
              ...gradingResult,
              enhanced_metrics: enhancedMetrics
            }
          }
          
          await (supabase as any)
            .from('live_sessions')
            .update(updateData)
            .eq('id', sessionId)

          // Send completion
          const totalTime = Date.now() - startTime
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'complete', 
            data: gradingResult,
            duration: totalTime
          })}\n\n`))
          
          controller.close()
          
        } catch (error: any) {
          logger.error('Streaming grading error', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            message: error.message 
          })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error: any) {
    logger.error('Stream setup error', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

