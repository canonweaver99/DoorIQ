import { NextRequest } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { logger } from '@/lib/logger'

// Optimized timeout for sub-20 second grading
export const maxDuration = 20 // 20 seconds - target sub-20s grading
export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 15000, // 15 second timeout - optimized for speed
  maxRetries: 1 // Reduced retries for speed
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
    
    // Get session and transcript - simple and direct
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    if (sessionError || !session) {
      return new Response('Session not found', { status: 404 })
    }
    
    const transcript = (session as any).full_transcript
    
    // Enhanced logging for debugging
    logger.info('Grading stream check', {
      sessionId,
      hasTranscript: !!transcript,
      transcriptType: Array.isArray(transcript) ? 'array' : typeof transcript,
      transcriptLength: Array.isArray(transcript) ? transcript.length : 'N/A',
      sessionEndedAt: (session as any).ended_at,
      sessionDuration: (session as any).duration_seconds
    })
    
    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      const errorMsg = `No transcript to grade. SessionId: "${sessionId}". Transcript exists: ${!!transcript}, Type: ${Array.isArray(transcript) ? 'array' : typeof transcript}, Length: ${Array.isArray(transcript) ? transcript.length : 'N/A'}`
      logger.error('No transcript available for grading', {
        sessionId,
        transcriptExists: !!transcript,
        transcriptType: typeof transcript,
        transcriptIsArray: Array.isArray(transcript),
        transcriptLength: Array.isArray(transcript) ? transcript.length : null,
        sessionEndedAt: (session as any).ended_at
      })
      return new Response(errorMsg, { status: 400 })
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', (session as any).user_id)
      .single()
    
    const salesRepName = (userProfile as any)?.full_name || 'Sales Rep'
    const customerName = (session as any).agent_name || 'Homeowner'

    // Build the transcript
    const formattedTranscript = transcript
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
          model: "gpt-4o-mini", // Faster model for sub-20s grading
          messages: messages as any,
          response_format: { type: "json_object" },
          max_tokens: 2000, // Reduced for faster processing
          temperature: 0.1,
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
            // Try to parse the accumulated content
            gradingResult = JSON.parse(accumulatedContent)
          } catch (parseError: any) {
            logger.error('Failed to parse streaming response', parseError, {
              accumulatedLength: accumulatedContent.length,
              firstChars: accumulatedContent.substring(0, 200),
              lastChars: accumulatedContent.substring(Math.max(0, accumulatedContent.length - 200))
            })
            
            // Try to fix common JSON issues
            let fixedContent = accumulatedContent.trim()
            
            // Remove any trailing commas before closing braces/brackets
            fixedContent = fixedContent.replace(/,(\s*[}\]])/g, '$1')
            
            // Try parsing again
            try {
              gradingResult = JSON.parse(fixedContent)
              logger.info('Successfully parsed after fixing JSON')
            } catch (secondParseError) {
              // If still fails, send error and close
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'error', 
                message: 'Failed to parse AI response: ' + (parseError?.message || 'Unknown error'),
                details: {
                  parseError: parseError?.message,
                  contentLength: accumulatedContent.length
                }
              })}\n\n`))
              controller.close()
              return
            }
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
          
          // Preserve existing voice_analysis if it exists
          const existingAnalytics = (session as any).analytics || {}
          const existingVoiceAnalysis = existingAnalytics.voice_analysis
          
          // Check if session was recently ended (within last 5 seconds) - might indicate race condition
          const sessionEndedAt = (session as any).ended_at ? new Date((session as any).ended_at) : null
          const currentTime = new Date()
          const secondsSinceEnd = sessionEndedAt ? (currentTime.getTime() - sessionEndedAt.getTime()) / 1000 : null
          const recentlyEnded = secondsSinceEnd !== null && secondsSinceEnd < 5
          
          logger.info('Voice analysis preservation check (streaming)', {
            hasExistingAnalytics: !!existingAnalytics && Object.keys(existingAnalytics).length > 0,
            existingAnalyticsKeys: existingAnalytics ? Object.keys(existingAnalytics) : [],
            hasVoiceAnalysis: !!existingVoiceAnalysis,
            sessionEndedAt: sessionEndedAt?.toISOString(),
            secondsSinceEnd,
            recentlyEnded,
            sessionId
          })
          
          if (existingVoiceAnalysis) {
            logger.info('✅ Preserving existing voice_analysis data in streaming grade', {
              hasVoiceAnalysis: !!existingVoiceAnalysis,
              voiceAnalysisKeys: Object.keys(existingVoiceAnalysis || {}),
              avgWPM: existingVoiceAnalysis?.avgWPM,
              totalFillerWords: existingVoiceAnalysis?.totalFillerWords,
              hasPitchData: existingVoiceAnalysis?.avgPitch > 0
            })
          } else {
            if (recentlyEnded) {
              logger.warn('⚠️ No existing voice_analysis found but session was recently ended - possible race condition (streaming)', {
                secondsSinceEnd,
                sessionId,
                endedAt: sessionEndedAt?.toISOString()
              })
              // Try to fetch fresh session data in case voice_analysis was just saved
              try {
                const { data: freshSession } = await supabase
                  .from('live_sessions')
                  .select('analytics')
                  .eq('id', sessionId)
                  .single()
                
                if (freshSession?.analytics?.voice_analysis) {
                  logger.info('✅ Found voice_analysis in fresh fetch - race condition detected and resolved (streaming)', {
                    voiceAnalysisKeys: Object.keys(freshSession.analytics.voice_analysis || {}),
                    avgWPM: freshSession.analytics.voice_analysis?.avgWPM
                  })
                  // Update existingAnalytics to include it
                  existingAnalytics.voice_analysis = freshSession.analytics.voice_analysis
                  Object.assign(existingAnalytics, { voice_analysis: freshSession.analytics.voice_analysis })
                }
              } catch (fetchError) {
                logger.error('Error fetching fresh session data for voice_analysis (streaming)', fetchError)
              }
            } else {
              logger.info('No existing voice_analysis found to preserve in streaming grade (session ended more than 5 seconds ago)')
            }
          }
          
          // Re-check after potential fresh fetch
          const finalVoiceAnalysis = existingAnalytics.voice_analysis || existingVoiceAnalysis
          
          // Extract line ratings if present (for future use)
          // const lineRatings = gradingResult.line_ratings || []
          
          // Build analytics object - CRITICAL: preserve existing analytics first, then merge grading result
          // This ensures voice_analysis and any other existing data is preserved
          const mergedAnalytics = (() => {
            // Start with existing analytics to preserve voice_analysis and any other existing data
            const baseAnalytics = { ...existingAnalytics }
            
            // Extract and preserve voice_analysis separately
            const preservedVoiceAnalysis = baseAnalytics.voice_analysis || finalVoiceAnalysis
            delete baseAnalytics.voice_analysis
            
            // Build merged analytics
            const merged = {
              ...baseAnalytics,
              // Then merge grading result (this will overwrite existing fields but NOT voice_analysis)
              ...gradingResult,
              // Explicitly set enhanced_metrics
              enhanced_metrics: enhancedMetrics,
              // CRITICAL: Always preserve voice_analysis if it exists (must come last to ensure it's not overwritten)
              ...(preservedVoiceAnalysis && { voice_analysis: preservedVoiceAnalysis })
            }
            
            // Verify voice_analysis is in the final object
            if (preservedVoiceAnalysis && !merged.voice_analysis) {
              logger.error('CRITICAL: voice_analysis was lost during analytics merge (streaming)!', {
                sessionId,
                hadPreservedVoiceAnalysis: !!preservedVoiceAnalysis,
                mergedKeys: Object.keys(merged)
              })
              // Force add it back
              merged.voice_analysis = preservedVoiceAnalysis
            }
            
            return merged
          })()
          
          logger.info('Analytics merge check (streaming)', {
            existingAnalyticsKeys: Object.keys(existingAnalytics),
            gradingResultKeys: Object.keys(gradingResult || {}),
            hasFinalVoiceAnalysis: !!finalVoiceAnalysis,
            mergedAnalyticsKeys: Object.keys(mergedAnalytics),
            voiceAnalysisInMerged: !!mergedAnalytics.voice_analysis,
            sessionId
          })
          
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
            analytics: mergedAnalytics
          }
          
          await (supabase as any)
            .from('live_sessions')
            .update(updateData)
            .eq('id', sessionId)
          
          // Verify voice_analysis was preserved in the update
          if (finalVoiceAnalysis) {
            logger.info('✅ Voice analysis should be preserved in analytics (streaming)', {
              voiceAnalysisKeys: Object.keys(finalVoiceAnalysis || {}),
              avgWPM: finalVoiceAnalysis?.avgWPM
            })
          } else {
            logger.info('ℹ️ No voice_analysis to preserve in this streaming grading update')
          }

          // Send completion
          const totalTime = Date.now() - startTime
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'complete', 
            data: gradingResult,
            duration: totalTime
          })}\n\n`))
          
          controller.close()
          
        } catch (error: any) {
          logger.error('Streaming grading error', error, {
            errorMessage: error?.message,
            errorStack: error?.stack,
            sessionId
          })
          
          // Send detailed error information
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            message: error?.message || 'Unknown error occurred during streaming',
            details: {
              errorType: error?.name || 'Unknown',
              sessionId
            }
          })}\n\n`))
          
          // Ensure stream is closed
          try {
            controller.close()
          } catch (closeError) {
            logger.error('Error closing stream', closeError)
          }
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

