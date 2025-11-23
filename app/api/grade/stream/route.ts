import { NextRequest } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { logger } from '@/lib/logger'

// Increased timeout for reliable grading (Vercel Pro allows up to 300s)
export const maxDuration = 60 // 60 seconds - allows for longer sessions
export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 second timeout - faster failure detection
  maxRetries: 2 // Increased retries for reliability
})

// Helper functions to pre-compute objective metrics
function detectFillerWords(text: string): number {
  // Only count: um, uh, uhh, erm, err, hmm (NOT "like")
  const fillerPattern = /\b(um|uhh?|uh|erm|err|hmm)\b/gi
  const matches = text.match(fillerPattern)
  return matches ? matches.length : 0
}

function calculateWPM(transcript: any[], durationSeconds: number): number {
  if (!transcript || transcript.length === 0 || durationSeconds <= 0) return 0
  
  const repEntries = transcript.filter((entry: any) => 
    entry.speaker === 'rep' || entry.speaker === 'user'
  )
  
  const totalWords = repEntries.reduce((sum: number, entry: any) => {
    const text = entry.text || entry.message || ''
    return sum + text.split(/\s+/).filter((word: string) => word.length > 0).length
  }, 0)
  
  const durationMinutes = durationSeconds / 60
  return Math.round(totalWords / durationMinutes)
}

function calculateQuestionRatio(transcript: any[]): number {
  if (!transcript || transcript.length === 0) return 0
  
  const repEntries = transcript.filter((entry: any) => 
    entry.speaker === 'rep' || entry.speaker === 'user'
  )
  
  if (repEntries.length === 0) return 0
  
  const questions = repEntries.filter((entry: any) => {
    const text = entry.text || entry.message || ''
    return text.trim().endsWith('?')
  }).length
  
  return Math.round((questions / repEntries.length) * 100)
}

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
    
    // Check if session was recently ended - wait briefly for voice_analysis to be saved
    const sessionEndedAt = await (async () => {
      const { data, error } = await supabase
        .from('live_sessions')
        .select('ended_at')
        .eq('id', sessionId)
        .single()
      return { endedAt: data?.ended_at, error }
    })()
    
    // If session was recently ended (< 3 seconds ago), wait briefly for voice_analysis to be saved
    if (sessionEndedAt.endedAt) {
      const endedAtTime = new Date(sessionEndedAt.endedAt).getTime()
      const secondsSinceEnd = (Date.now() - endedAtTime) / 1000
      if (secondsSinceEnd < 3) {
        logger.info('Session recently ended - waiting briefly for voice_analysis to be saved (streaming)', {
          secondsSinceEnd,
          waitTime: Math.min(2000, (3 - secondsSinceEnd) * 1000)
        })
        await new Promise(resolve => setTimeout(resolve, Math.min(2000, (3 - secondsSinceEnd) * 1000)))
      }
    }
    
    // Get session and transcript - simple and direct
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    if (sessionError || !session) {
      return new Response('Session not found', { status: 404 })
    }
    
    // Fetch fresh analytics right before grading to ensure voice_analysis exists
    const { data: freshAnalytics } = await supabase
      .from('live_sessions')
      .select('analytics')
      .eq('id', sessionId)
      .single()
    
    // Merge fresh analytics if it has voice_analysis that we don't have
    if (freshAnalytics?.analytics?.voice_analysis && !session.analytics?.voice_analysis) {
      logger.info('✅ Found voice_analysis in fresh fetch - merging into session data (streaming)', {
        voiceAnalysisKeys: Object.keys(freshAnalytics.analytics.voice_analysis || {})
      })
      session.analytics = session.analytics || {}
      session.analytics.voice_analysis = freshAnalytics.analytics.voice_analysis
    }
    
    let transcript = (session as any).full_transcript
    const transcriptLength = Array.isArray(transcript) ? transcript.length : 0
    
    // More aggressive sampling for long transcripts to reduce token count
    if (transcriptLength > 300) {
      logger.warn('Large transcript - sampling key sections for speed (streaming)', { lines: transcriptLength })
      
      if (transcriptLength > 800) {
        // Very long transcripts: sample first 100, middle 100, last 100
        transcript = [
          ...transcript.slice(0, 100),
          ...transcript.slice(Math.floor(transcriptLength / 2) - 50, Math.floor(transcriptLength / 2) + 50),
          ...transcript.slice(-100)
        ]
        logger.info('Sampled very long transcript (streaming)', { sampledLines: transcript.length, originalLines: transcriptLength })
      } else {
        // Medium-long transcripts (>300 lines): sample first 150, middle 150, last 150
        transcript = [
          ...transcript.slice(0, 150),
          ...transcript.slice(Math.floor(transcriptLength / 2) - 75, Math.floor(transcriptLength / 2) + 75),
          ...transcript.slice(-150)
        ]
        logger.info('Sampled transcript (streaming)', { sampledLines: transcript.length, originalLines: transcriptLength })
      }
    }
    
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

    // Get user profile (already optimized - single query)
    const { data: userProfile } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', (session as any).user_id)
      .single()
    
    const salesRepName = (userProfile as any)?.full_name || 'Sales Rep'
    const customerName = (session as any).agent_name || 'Homeowner'

    // Pre-compute objective metrics before LLM call (faster than asking LLM to calculate)
    const durationSeconds = (session as any).duration_seconds || 0
    const precomputedFillerCount = transcript.reduce((sum: number, entry: any) => {
      const text = entry.text || entry.message || ''
      if (entry.speaker === 'rep' || entry.speaker === 'user') {
        return sum + detectFillerWords(text)
      }
      return sum
    }, 0)
    
    const precomputedWPM = calculateWPM(transcript, durationSeconds)
    const precomputedQuestionRatio = calculateQuestionRatio(transcript)
    
    logger.info('Pre-computed metrics (streaming)', {
      fillerWords: precomputedFillerCount,
      wpm: precomputedWPM,
      questionRatio: precomputedQuestionRatio,
      durationSeconds
    })

    // Build the transcript
    const formattedTranscript = transcript
      .map((entry: any, index: number) => {
        const speaker = entry.speaker === 'user' ? salesRepName : customerName
        const timestamp = entry.timestamp || '0:00'
        const text = entry.text || entry.message || ''
        return `[${index}] (${timestamp}) ${speaker}: ${text}`
      })
      .join('\n')

    // Build system prompt (matching non-streaming version - simplified for speed)
    // Include pre-computed metrics so LLM doesn't need to calculate them
    const systemPrompt = `You are an expert door-to-door sales coach. Analyze this conversation and return ONLY valid JSON.

PRE-COMPUTED METRICS (use these values, don't recalculate):
- Filler words: ${precomputedFillerCount} total
- Speaking pace: ${precomputedWPM} WPM
- Question ratio: ${precomputedQuestionRatio}%`

{
  "session_summary": { "total_lines": int, "rep_lines": int, "customer_lines": int, "objections_detected": int, "questions_asked": int },
  "scores": { "overall": int, "rapport": int, "discovery": int, "objection_handling": int, "closing": int, "safety": int, "introduction": int, "listening": int, "speaking_pace": int, "question_ratio": int, "active_listening": int, "assumptive_language": int },
  "filler_word_count": int,
  "feedback": { 
    "strengths": ["2-3 specific examples"], 
    "improvements": ["2-3 specific issues"], 
    "specific_tips": ["2-3 actionable tips"] 
  },
  "objection_analysis": { 
    "total_objections": int,
    "objections": [{"objection": "customer quote", "response": "rep response", "effectiveness": "good/poor"}]
  },
  "coaching_plan": { 
    "immediate_fixes": [{"issue": "issue", "practice_scenario": "scenario", "resource": ""}], 
    "skill_development": [], 
    "role_play_scenarios": ["scenario"] 
  },
  "timeline_key_moments": [
    { "position": 50, "line_number": int, "timestamp": "0:00", "moment_type": "Key Moment", "quote": "quote", "is_positive": bool, "key_takeaway": "tip" },
    { "position": 90, "line_number": int, "timestamp": "0:00", "moment_type": "Close Attempt", "quote": "quote", "is_positive": bool, "key_takeaway": "tip" }
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
      "common_fillers": { "um": int, "uh": int, "uhh": int, "erm": int, "err": int, "hmm": int }
    }
  }
}

SCORING (0-100): Overall=avg, Rapport=connection, Discovery=questions, Objection Handling=addressing concerns, Closing=commitment (90-100=sale, 75-89=appointment, 60-74=trial, 40-59=weak, 0-39=none), Safety=pet/child mentions, Introduction=opening, Listening=acknowledgment, Speaking Pace=speed, Question Ratio=questions vs statements (30-40% ideal), Active Listening=understanding, Assumptive Language="when" not "if".

TIMELINE: Pick 2 moments at 50% and 90% of conversation. Use timestamps from transcript.

EARNINGS: sale_closed=true ONLY if PAID service committed. return_appointment=true if scheduled. Commission=0.30. virtual_earnings=total_contract_value×0.30.

FILLER WORDS: Use pre-computed count (${precomputedFillerCount}). Count only "um", "uh", "uhh", "erm", "err", "hmm". Never count "like".

Return ONLY valid JSON.`

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
            model: "gpt-4o", // Faster model for JSON mode - 2-3x faster than gpt-4o-mini
            messages: messages as any,
            response_format: { type: "json_object" },
            max_tokens: 800, // Reduced for faster processing
            temperature: 0.1,
            stream: true
          })
          
          // Add timeout handling for streaming chunks
          const streamStartTime = Date.now()
          const STREAM_TIMEOUT = 30000 // 30 seconds max for streaming

          for await (const chunk of completion) {
            // Check timeout during streaming
            if (Date.now() - streamStartTime > STREAM_TIMEOUT) {
              throw new Error('OpenAI streaming timeout after 30 seconds')
            }
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
          // Use pre-computed filler word count (more accurate than LLM calculation)
          const fillerWordCount = precomputedFillerCount
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
          // CRITICAL: Extract voice_analysis FIRST before any merging
          const existingAnalytics = (session as any).analytics || {}
          const existingVoiceAnalysis = existingAnalytics.voice_analysis
          
          logger.info('Voice analysis preservation check (streaming)', {
            hasExistingAnalytics: !!existingAnalytics && Object.keys(existingAnalytics).length > 0,
            existingAnalyticsKeys: existingAnalytics ? Object.keys(existingAnalytics) : [],
            hasVoiceAnalysis: !!existingVoiceAnalysis,
            voiceAnalysisKeys: existingVoiceAnalysis ? Object.keys(existingVoiceAnalysis) : [],
            avgWPM: existingVoiceAnalysis?.avgWPM,
            totalFillerWords: existingVoiceAnalysis?.totalFillerWords,
            sessionId
          })
          
          // Final voice_analysis to preserve (already fetched fresh above if needed)
          const finalVoiceAnalysis = existingVoiceAnalysis
          
          // Build analytics object - CRITICAL: preserve existing analytics first, then merge grading result
          // This ensures voice_analysis and any other existing data is preserved
          const mergedAnalytics = (() => {
            // Start with existing analytics but remove voice_analysis to add it back last
            const baseAnalytics = { ...existingAnalytics }
            const preservedVoiceAnalysis = finalVoiceAnalysis
            
            // Remove voice_analysis from base (we'll add it back at the very end)
            delete baseAnalytics.voice_analysis
            
            // Build merged analytics - voice_analysis MUST be added last
            const merged: any = {
              ...baseAnalytics,
              // Then merge grading result (this will overwrite existing fields but NOT voice_analysis)
              ...gradingResult,
              // Explicitly set enhanced_metrics
              enhanced_metrics: enhancedMetrics
            }
            
            // CRITICAL: Always preserve voice_analysis if it exists (MUST be last to ensure it's not overwritten)
            if (preservedVoiceAnalysis) {
              merged.voice_analysis = preservedVoiceAnalysis
              logger.info('✅ Voice analysis preserved in analytics object (streaming)', {
                voiceAnalysisKeys: Object.keys(preservedVoiceAnalysis),
                avgWPM: preservedVoiceAnalysis?.avgWPM
              })
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

