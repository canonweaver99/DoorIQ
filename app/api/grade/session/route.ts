import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { logger } from '@/lib/logger'

// Increase timeout for grading (Vercel allows up to 300s on Pro)
export const maxDuration = 90 // 90 seconds - faster timeout
export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, // 60 second timeout - faster
  maxRetries: 1 // Reduced retries for speed
})

type JsonSchema = Record<string, any>

const gradingResponseSchema: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'session_summary',
    'scores',
    'line_ratings',
    'feedback',
    'objection_analysis',
    'coaching_plan',
    'timeline_key_moments',
    'sale_closed',
    'return_appointment',
    'virtual_earnings',
    'earnings_data',
    'deal_details'
  ],
  properties: {
    session_summary: {
      type: 'object',
      additionalProperties: false,
      properties: {
        total_lines: { type: 'integer' },
        rep_lines: { type: 'integer' },
        customer_lines: { type: 'integer' },
        objections_detected: { type: 'integer' },
        questions_asked: { type: 'integer' }
      }
    },
    scores: {
      type: 'object',
      additionalProperties: false,
      properties: {
        overall: { type: 'number' },
        rapport: { type: 'number' },
        discovery: { type: 'number' },
        objection_handling: { type: 'number' },
        closing: { type: 'number' },
        safety: { type: 'number' },
        introduction: { type: 'number' },
        listening: { type: 'number' },
        speaking_pace: { type: 'number' },
        filler_words: { type: 'number' },
        question_ratio: { type: 'number' },
        active_listening: { type: 'number' },
        assumptive_language: { type: 'number' }
      }
    },
    line_ratings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        properties: {
          line_number: { type: 'integer' },
          speaker: { type: 'string' },
          effectiveness: { type: 'string' },
          alternative_lines: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    },
    feedback: {
      type: 'object',
      additionalProperties: false,
      properties: {
        strengths: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'string' } },
        specific_tips: { type: 'array', items: { type: 'string' } }
      }
    },
    conversation_dynamics: {
      type: 'object',
      additionalProperties: true,
      properties: {
        interruptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              line: { type: 'integer' },
              who: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        energy_shifts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              line: { type: 'integer' },
              from: { type: 'string' },
              to: { type: 'string' },
              trigger: { type: 'string' }
            }
          }
        },
        buying_signals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              line: { type: 'integer' },
              signal_description: { type: 'string' },
              strength: { type: 'string' }
            }
          }
        },
        momentum_changes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              line: { type: 'integer' },
              change: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        engagement_drops: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              line: { type: 'integer' },
              reason: { type: 'string' }
            }
          }
        }
      }
    },
    failure_analysis: {
      type: 'object',
      additionalProperties: true,
      properties: {
        critical_moments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              line: { type: 'integer' },
              event: { type: 'string' },
              customer_reaction: { type: 'string' },
              rep_recovery_attempted: { type: 'boolean' },
              success: { type: 'boolean' },
              better_approach: { type: 'string' }
            }
          }
        },
        point_of_no_return: {
          type: 'object',
          properties: {
            line: { type: 'integer' },
            reason: { type: 'string' },
            could_have_saved: { type: 'boolean' },
            how: { type: 'string' }
          }
        },
        missed_pivots: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              line: { type: 'integer' },
              opportunity: { type: 'string' },
              suggested_pivot: { type: 'string' }
            }
          }
        },
        recovery_failures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              line: { type: 'integer' },
              attempt: { type: 'string' },
              why_failed: { type: 'string' },
              better_approach: { type: 'string' }
            }
          }
        }
      }
    },
    objection_analysis: {
      type: 'object',
      additionalProperties: true,
      properties: {
        total_objections: { type: 'integer' }
      }
    },
    coaching_plan: {
      type: 'object',
      additionalProperties: false,
      properties: {
        immediate_fixes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              practice_scenario: { type: 'string' },
              resource: { type: 'string' }
            }
          }
        },
        skill_development: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skill: { type: 'string' },
              current_level: { type: 'string' },
              target_level: { type: 'string' },
              exercises: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        role_play_scenarios: { type: 'array', items: { type: 'string' } }
      }
    },
    timeline_key_moments: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          position: { type: 'integer' },
          line_number: { type: 'integer' },
          timestamp: { type: 'string' },
          moment_type: { type: 'string' },
          quote: { type: 'string' },
          is_positive: { type: 'boolean' }
        },
        required: ['position', 'line_number', 'timestamp', 'moment_type', 'quote', 'is_positive']
      }
    },
    sale_closed: { type: 'boolean' },
    return_appointment: { type: 'boolean' },
    virtual_earnings: { type: 'number' },
    earnings_data: {
      type: 'object',
      additionalProperties: false,
      properties: {
        base_amount: { type: 'number' },
        closed_amount: { type: 'number' },
        commission_rate: { type: 'number' },
        commission_earned: { type: 'number' },
        bonus_modifiers: {
          type: 'object',
          additionalProperties: false,
          properties: {
            quick_close: { type: 'number' },
            upsell: { type: 'number' },
            retention: { type: 'number' },
            same_day_start: { type: 'number' },
            referral_secured: { type: 'number' },
            perfect_pitch: { type: 'number' }
          }
        },
        total_earned: { type: 'number' }
      }
    },
    deal_details: {
      type: 'object',
      additionalProperties: false,
      properties: {
        product_sold: { type: 'string' },
        service_type: { type: 'string' },
        base_price: { type: 'number' },
        monthly_value: { type: 'number' },
        contract_length: { type: 'number' },
        total_contract_value: { type: 'number' },
        payment_method: { type: 'string' },
        add_ons: { type: 'array', items: { type: 'string' } },
        start_date: { type: 'string' }
      }
    }
  }
}

// Check if API key is configured
if (!process.env.OPENAI_API_KEY) {
  logger.error('OPENAI_API_KEY not configured')
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const timer = logger.startTimer()
    logger.group(`Grading session: ${sessionId}`, () => {
      logger.info('GRADING START', { sessionId, startTime: new Date().toISOString() })
    })
    
    const supabase = await createServiceSupabaseClient()
    
    // Fetch session data WITH user profile in a single query (optimization)
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select(`
        *,
        user:users!live_sessions_user_id_fkey (
          team_id,
          full_name
        )
      `)
      .eq('id', sessionId)
      .single()
    
    if (sessionError || !session) {
      logger.error('Session not found', sessionError)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    if (!(session as any).full_transcript || (session as any).full_transcript.length === 0) {
      logger.error('No transcript found for session', undefined, {
        sessionId,
        id: (session as any).id,
        created_at: (session as any).created_at,
        ended_at: (session as any).ended_at,
        transcript_exists: !!(session as any).full_transcript,
        transcript_length: (session as any).full_transcript?.length || 0
      })
      return NextResponse.json({ 
        error: 'No transcript to grade',
        details: {
          transcript_exists: !!(session as any).full_transcript,
          transcript_length: (session as any).full_transcript?.length || 0
        }
      }, { status: 400 })
    }
    
    const transcriptLength = (session as any).full_transcript.length
    logger.info('Transcript found', { 
      lines: transcriptLength,
      firstLine: (session as any).full_transcript[0]
    })
    
    // Warn if transcript is very long (may take longer to process)
    if (transcriptLength > 500) {
      logger.warn('Large transcript detected - grading may take longer', { lines: transcriptLength })
    }
    
    // For extremely long transcripts (>1000 lines), sample key portions
    let transcriptToGrade = (session as any).full_transcript
    if (transcriptLength > 1000) {
      logger.warn('Very large transcript - sampling key sections', { lines: transcriptLength })
      // Take first 300, middle 400, last 300 lines
      transcriptToGrade = [
        ...(session as any).full_transcript.slice(0, 300),
        ...(session as any).full_transcript.slice(Math.floor(transcriptLength / 2) - 200, Math.floor(transcriptLength / 2) + 200),
        ...(session as any).full_transcript.slice(-300)
      ]
      logger.info('Sampled transcript', { sampledLines: transcriptToGrade.length })
    }

    // Extract user profile from joined query (already fetched above)
    const userProfile = (session as any).user
    const salesRepName = userProfile?.full_name || 'Sales Rep'
    const customerName = (session as any).agent_name || 'Homeowner'

    // Simplified team config - no caching complexity
    let teamGradingConfig: any = null
    if (userProfile?.team_id) {
      const { data } = await supabase
        .from('team_grading_configs')
        .select('company_name, product_description')
        .eq('team_id', userProfile.team_id)
        .eq('enabled', true)
        .single()
      
      teamGradingConfig = data
      logger.db('Team config loaded', { hasConfig: !!teamGradingConfig })
    }

    // Simplified context - removed heavy knowledge base loading
    let companyContext = ''
    if (teamGradingConfig?.company_name || teamGradingConfig?.product_description) {
      companyContext = `\nCompany: ${teamGradingConfig.company_name || 'Door-to-door sales'}. Product: ${teamGradingConfig.product_description || 'pest control services'}.`
    }

    // Format transcript for OpenAI with timestamps
    const sessionStartTime = new Date((session as any).started_at || (session as any).created_at)
    const formattedTranscript = transcriptToGrade
      .map((line: any, index: number) => {
        // Normalize speaker names with actual names
        let speaker = customerName
        if (line.speaker === 'rep' || line.speaker === 'user') {
          speaker = salesRepName
        } else if (line.speaker === 'homeowner' || line.speaker === 'agent' || line.speaker === 'ai') {
          speaker = customerName
        }
        // Get text from either text or message field
        const text = line.text || line.message || ''
        
        // Calculate relative timestamp (seconds from start)
        let timestamp = '0:00'
        if (line.timestamp) {
          try {
            const lineTime = new Date(line.timestamp)
            const secondsFromStart = Math.floor((lineTime.getTime() - sessionStartTime.getTime()) / 1000)
            const mins = Math.floor(secondsFromStart / 60)
            const secs = secondsFromStart % 60
            timestamp = `${mins}:${secs.toString().padStart(2, '0')}`
          } catch (e) {
            // Fallback to index-based estimation
            timestamp = `${Math.floor(index / 3)}:${(index % 3) * 20}`
          }
        }
        
        return `[${index}] (${timestamp}) ${speaker}: ${text}`
      })
      .join('\n')

    logger.api('Calling OpenAI for grading', {
      transcriptChars: formattedTranscript.length,
      transcriptLines: (session as any).full_transcript.length,
      preview: formattedTranscript.substring(0, 300) + '...'
    })

    const openaiStartTime = Date.now()
    logger.perf('Database queries completed', Date.now() - startTime)

    // Simplified prompt - much more concise
    const systemPrompt = `You are an expert door-to-door sales coach.${companyContext} Analyze this conversation and return ONLY valid JSON with these exact fields:`

    const messages: Array<{ role: string; content: string }> = [
        {
          role: "system",
        content: systemPrompt + `

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
    { "position": 33, "line_number": int, "timestamp": "0:00", "moment_type": "Opening", "quote": "actual customer or rep quote", "is_positive": bool },
    { "position": 66, "line_number": int, "timestamp": "0:00", "moment_type": "Key Moment", "quote": "actual customer or rep quote", "is_positive": bool },
    { "position": 90, "line_number": int, "timestamp": "0:00", "moment_type": "Close Attempt", "quote": "actual customer or rep quote", "is_positive": bool }
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

TIMELINE: Pick 3 key moments at 33%, 66%, 90% of conversation. Use EXACT timestamps from transcript.

EARNINGS:
- sale_closed: true ONLY if customer committed to PAID service
- return_appointment: true if appointment/inspection scheduled
- Inspections are NOT sales (sale_closed=false, return_appointment=true)
- Commission rate always 0.30 (30%)
- virtual_earnings = total_contract_value × 0.30

FILLER WORDS:
- Count only: "um", "uh", "uhh", "erm", "err", "hmm"
- Count "like" ONLY at sentence start (e.g., "Like, I was thinking")
- NOT "like" in middle (e.g., "service like this" is normal)

FEEDBACK - BE SPECIFIC:
- Reference actual names, topics, details from THIS conversation
- Quote exact phrases
- Avoid generic advice
- Make it personal to THIS call

Return ONLY valid JSON. No commentary.`
        },
        {
          role: "user",
        content: `TRANSCRIPT:\n${formattedTranscript}`
      }
    ]

    // Retry with backoff for reliability
    let completion
    let lastError
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: messages as any,
          response_format: { type: "json_object" },
          max_tokens: 1500, // Increased from 1000 to avoid truncation
          temperature: 0.1,
          stream: false
        })
        break // Success
      } catch (apiError: any) {
        lastError = apiError
        const errorType = apiError.status === 429 ? 'rate_limit' : apiError.status >= 500 ? 'server_error' : 'api_error'
        logger.error(`OpenAI API error (attempt ${attempt}/2)`, apiError, { errorType, status: apiError.status })
        
        if (attempt < 2) {
          // Wait 2 seconds before retry
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }
    
    if (!completion) {
      throw new Error(`OpenAI grading failed after 2 attempts: ${lastError?.message || 'Unknown error'}`)
    }

    const responseContent = completion.choices[0].message.content || '{}'
    const openaiEndTime = Date.now()
    const openaiDuration = openaiEndTime - openaiStartTime
    
    logger.perf('OpenAI API call completed', openaiDuration, {
      responseLength: responseContent.length,
      tokensUsed: completion.usage?.total_tokens || 'unknown',
      promptTokens: completion.usage?.prompt_tokens,
      completionTokens: completion.usage?.completion_tokens
    })
    
    let gradingResult
    try {
      gradingResult = JSON.parse(responseContent)
    } catch (parseError) {
      logger.error('JSON parse error', parseError, {
        responseStart: responseContent.substring(0, 2000),
        responseEnd: responseContent.substring(Math.max(0, responseContent.length - 500))
      })
      throw new Error('Failed to parse OpenAI response as JSON')
    }
    
    logger.success('OpenAI grading parsed successfully', {
      line_ratings_disabled: true,
      has_scores: !!gradingResult.scores,
      sale_closed: gradingResult.sale_closed,
      virtual_earnings: gradingResult.virtual_earnings,
      openai_time: (openaiDuration / 1000).toFixed(2) + 's'
    })

    // Start a transaction to update both tables
    const now = new Date().toISOString()

    // Update live_sessions with scores and analytics
    const rapportScore = typeof gradingResult.scores?.rapport === 'number' ? gradingResult.scores.rapport : null
    const discoveryScore = typeof gradingResult.scores?.discovery === 'number' ? gradingResult.scores.discovery : null
    const objectionScore = typeof gradingResult.scores?.objection_handling === 'number' ? gradingResult.scores.objection_handling : null
    const closeScore = typeof gradingResult.scores?.closing === 'number' ? gradingResult.scores.closing : null
    const safetyScore = typeof gradingResult.scores?.safety === 'number' ? gradingResult.scores.safety : null
    
    // Enhanced metrics - use if provided, otherwise set to null
    const speakingPaceScore = typeof gradingResult.scores?.speaking_pace === 'number' ? gradingResult.scores.speaking_pace : null
    const questionRatioScore = typeof gradingResult.scores?.question_ratio === 'number' ? gradingResult.scores.question_ratio : null
    const activeListeningScore = typeof gradingResult.scores?.active_listening === 'number' ? gradingResult.scores.active_listening : null
    const assumptiveLanguageScore = typeof gradingResult.scores?.assumptive_language === 'number' ? gradingResult.scores.assumptive_language : null
    
    // Get filler word count from the grading result
    const fillerWordCount = typeof gradingResult.filler_word_count === 'number' ? gradingResult.filler_word_count : 0
    
    const returnAppointment = typeof gradingResult.return_appointment === 'boolean' ? gradingResult.return_appointment : false

    logger.debug('Extracted scores', { 
      rapportScore, discoveryScore, objectionScore, closeScore,
      speakingPaceScore, questionRatioScore, 
      activeListeningScore, assumptiveLanguageScore,
      fillerWordCount 
    })

    let saleClosed = typeof gradingResult.sale_closed === 'boolean' ? gradingResult.sale_closed : false
    if (returnAppointment && !saleClosed) {
      saleClosed = false
    }

    // Simplified earnings calculation
    const earningsData = gradingResult.earnings_data || {}
    const dealDetails = gradingResult.deal_details || {}
    const objectionAnalysis = gradingResult.objection_analysis || {}
    const coachingPlan = gradingResult.coaching_plan || {}
    const enhancedMetrics = gradingResult.enhanced_metrics || {}
    const conversationDynamics = gradingResult.conversation_dynamics || {}
    const failureAnalysis = gradingResult.failure_analysis || {}
    
    // Simple earnings - trust OpenAI or default to 0
    const virtualEarnings = saleClosed ? (gradingResult.virtual_earnings || 0) : 0


    const calculatedOverall = (() => {
      let baseScore = 0
      
      if (typeof gradingResult.scores?.overall === 'number') {
        logger.info('Using OpenAI overall score', { score: gradingResult.scores.overall })
        baseScore = gradingResult.scores.overall
      } else {
        // Include core sales performance scores only (exclude filler_words and question_ratio)
        const numericScores = [
          rapportScore, discoveryScore, objectionScore, closeScore, safetyScore,
          speakingPaceScore, activeListeningScore, assumptiveLanguageScore
        ].filter((value) => typeof value === 'number') as number[]
        
        if (numericScores.length === 0) {
          return 0
        }
        baseScore = Math.round(numericScores.reduce((sum, value) => sum + value, 0) / numericScores.length)
        logger.info('Calculated overall score from core metrics', { 
          metricsCount: numericScores.length, 
          score: baseScore 
        })
      }
      
      // No duration penalty - quality matters more than length
      const durationSeconds = (session as any).duration_seconds || 0
      const minutes = Math.floor(durationSeconds / 60)
      const seconds = String(durationSeconds % 60).padStart(2, '0')
      logger.info(`Session duration: ${minutes}:${seconds}`, { durationSeconds })
      
      // Penalize missing critical categories
      const criticalCategories = [rapportScore, discoveryScore, objectionScore, closeScore]
      const missingCategories = criticalCategories.filter(score => !score || score === 0).length
      
      if (missingCategories > 0) {
        const categoryPenalty = missingCategories * 10 // -10% per missing critical category
        logger.info('Missing critical categories penalty', { 
          missingCategories, 
          penalty: categoryPenalty 
        })
        baseScore = Math.max(0, baseScore - categoryPenalty)
      }
      
      // Apply filler word penalty: -1% per 2 filler words (max -10%)
      const fillerPenalty = Math.min(Math.floor(fillerWordCount / 2), 10)
      const finalScore = Math.max(0, baseScore - fillerPenalty)
      
      if (fillerWordCount > 0) {
        logger.info('Filler word penalty', { 
          fillerWordCount, 
          penalty: fillerPenalty,
          beforeScore: baseScore,
          afterScore: finalScore 
        })
      }
      
      logger.info('Final overall score calculated', { 
        finalScore, 
        durationSeconds, 
        missingCategories, 
        fillerWordCount 
      })
      
      return finalScore
    })()

    // Line-by-line ratings disabled for performance
    const normalizedLineRatings: any[] = []
    logger.info('Line-by-line grading disabled for speed')

    const dbUpdateStartTime = Date.now()
    const { error: updateError } = await (supabase as any)
      .from('live_sessions')
      .update({
        overall_score: calculatedOverall,
        rapport_score: rapportScore,
        discovery_score: discoveryScore,
        objection_handling_score: objectionScore,
        // Keep both columns in sync for compatibility across pages
        close_score: closeScore,
        close_effectiveness_score: closeScore,
        safety_score: safetyScore,
        
        // Enhanced metric scores (optional - may be null)
        speaking_pace_score: speakingPaceScore,
        speaking_pace_data: enhancedMetrics.speaking_pace || {},
        filler_words_score: fillerWordCount, // Store count, not score
        filler_words_data: enhancedMetrics.filler_words || {},
        question_ratio_score: questionRatioScore,
        question_ratio_data: enhancedMetrics.question_ratio || {},
        active_listening_score: activeListeningScore,
        active_listening_data: enhancedMetrics.active_listening || {},
        assumptive_language_score: assumptiveLanguageScore,
        assumptive_language_data: enhancedMetrics.assumptive_language || {},
        
        // Dynamic earnings data
        virtual_earnings: virtualEarnings,
        earnings_data: earningsData,
        deal_details: dealDetails,
        sale_closed: saleClosed,
        return_appointment: returnAppointment,
        
        analytics: {
          line_ratings: normalizedLineRatings,
          feedback: gradingResult.feedback || { strengths: [], improvements: [], specific_tips: [] },
          enhanced_metrics: enhancedMetrics,
          objection_analysis: objectionAnalysis,
          coaching_plan: coachingPlan,
          conversation_dynamics: conversationDynamics,
          failure_analysis: failureAnalysis,
          timeline_key_moments: gradingResult.timeline_key_moments || [],
          earnings_data: earningsData,
          deal_details: dealDetails,
          graded_at: now,
          grading_version: '8.0-ultra-fast',
          scores: gradingResult.scores || {}
        }
      } as any)
      .eq('id', sessionId)

    if (updateError) {
      logger.error('Failed to update session', updateError)
      throw updateError
    }

    const dbUpdateEndTime = Date.now()
    logger.perf('Database update completed', dbUpdateEndTime - dbUpdateStartTime)

    // Line ratings disabled - skip storage

    const endTime = Date.now()
    const totalDuration = endTime - startTime
    
    logger.group('Grading Complete', () => {
      logger.success('GRADING COMPLETE!', {
        totalTime: `${(totalDuration / 1000).toFixed(2)}s`,
        endTime: new Date().toISOString()
      })
      logger.info('Performance Breakdown', {
        databaseQueries: `${((openaiStartTime - startTime) / 1000).toFixed(2)}s`,
        openaiGrading: `${((openaiEndTime - openaiStartTime) / 1000).toFixed(2)}s`,
        databaseUpdate: `${((dbUpdateEndTime - dbUpdateStartTime) / 1000).toFixed(2)}s`,
        total: `${(totalDuration / 1000).toFixed(2)}s`
      })
      logger.info('Summary', {
        scores: Object.keys(gradingResult.scores || {}).length,
        line_ratings_disabled: true,
      has_objections: !!objectionAnalysis.total_objections,
      has_coaching: !!coachingPlan.immediate_fixes,
      virtual_earnings: virtualEarnings,
      tokens_used: completion.usage?.total_tokens,
      tokens_saved_vs_4000: (4000 - (completion.usage?.completion_tokens || 0))
    })
    })

    // Send email notifications (fire and forget - don't block response)
    const userId = (session as any).user_id
    const grade = calculatedOverall >= 90 ? 'A' : calculatedOverall >= 80 ? 'B' : calculatedOverall >= 70 ? 'C' : calculatedOverall >= 60 ? 'D' : 'F'
    
    Promise.all([
      // Session complete notification
      import('@/lib/notifications/service').then(({ sendNotification }) => {
        return sendNotification({
          type: 'sessionComplete',
          userId,
          data: {
            score: calculatedOverall,
            grade,
            bestMoment: gradingResult.feedback?.strengths?.[0],
            topImprovement: gradingResult.feedback?.improvements?.[0],
            sessionId,
            virtualEarnings,
            saleClosed
          }
        })
      }),

      // Manager notification (using already-fetched salesRepName for efficiency)
      import('@/lib/notifications/service').then(async ({ getRepManager, sendNotification }) => {
        const managerId = await getRepManager(userId)
        if (managerId) {
          return sendNotification({
            type: 'managerSessionAlert',
            userId: managerId,
            data: {
              repName: salesRepName, // Already fetched from joined query
              score: calculatedOverall,
              grade,
              sessionId,
              highlights: gradingResult.feedback?.strengths?.slice(0, 2) || [],
              needsWork: gradingResult.feedback?.improvements?.slice(0, 2) || []
            }
          })
        }
      })
    ]).catch(error => {
      logger.warn('Failed to send notifications (non-blocking)', { error: error.message })
    })

    return NextResponse.json({
      success: true,
      scores: gradingResult.scores,
      feedback: gradingResult.feedback || {},
      lines_graded: 0, // Line-by-line grading disabled for performance
      conversation_dynamics: conversationDynamics,
      failure_analysis: failureAnalysis,
      objection_analysis: objectionAnalysis,
      coaching_plan: coachingPlan,
      sale_closed: saleClosed,
      return_appointment: returnAppointment,
      virtual_earnings: virtualEarnings,
      earnings_data: earningsData,
      deal_details: dealDetails
    })

  } catch (error: any) {
    const errorTime = Date.now()
    const errorDuration = (errorTime - startTime) / 1000
    
    logger.group('Grading Failed', () => {
      logger.error('GRADING FAILED', error, {
        errorAfter: `${errorDuration.toFixed(2)}s`,
        errorType: error.name,
        errorCode: error.code,
        errorStatus: error.status,
        errorMessage: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      })
    })
    
    // Provide helpful error messages based on error type
    let userMessage = error.message || 'Failed to grade session'
    let statusCode = 500
    
    // Check for specific OpenAI errors
    if (error.status === 429) {
      userMessage = 'OpenAI rate limit exceeded - please wait a moment and try again'
      statusCode = 429
    } else if (error.status === 503 || error.message?.includes('overloaded')) {
      userMessage = 'OpenAI service temporarily unavailable - please try again'
      statusCode = 503
    } else if (error.message?.includes('OpenAI') || error.code?.includes('openai')) {
      userMessage = 'OpenAI API error - please try again'
      statusCode = 503
    } else if (error.message?.includes('parse') || error.message?.includes('JSON')) {
      userMessage = 'Failed to parse grading response - please try again'
      statusCode = 502
    } else if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      userMessage = 'Request timed out - session may be too long'
      statusCode = 504
    } else if (error.message?.includes('ECONNREFUSED')) {
      userMessage = 'Cannot connect to OpenAI - check internet connection'
      statusCode = 503
    }
    
    return NextResponse.json(
      { 
        error: userMessage,
        details: {
          type: error.name,
          message: error.message,
          code: error.code,
          status: error.status,
          duration: errorDuration + 's'
        }
      },
      { status: statusCode }
    )
  }
}
