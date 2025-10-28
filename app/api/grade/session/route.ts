import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { logger } from '@/lib/logger'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 90000, // 90 second timeout
  maxRetries: 2 // SDK-level retries
})

// In-memory cache for team grading configs (5 minute TTL)
const teamConfigCache = new Map<string, { data: any; expires: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function getCachedTeamConfig(teamId: string) {
  const cached = teamConfigCache.get(teamId)
  if (cached && cached.expires > Date.now()) {
    logger.db('Using cached team config for team', { teamId })
    return cached.data
  }
  teamConfigCache.delete(teamId)
  return null
}

function setCachedTeamConfig(teamId: string, data: any) {
  logger.db('Caching team config for team', { teamId })
  teamConfigCache.set(teamId, {
    data,
    expires: Date.now() + CACHE_TTL_MS
  })
}

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
    
    // Fetch session data
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select('*')
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

    // Get user's team information and actual name in a single query
    const { data: userProfile } = await supabase
      .from('users')
      .select('team_id, full_name')
      .eq('id', (session as any).user_id)
      .single()
    
    const salesRepName = userProfile?.full_name || 'Sales Rep'
    const customerName = (session as any).agent_name || 'Homeowner'

    let teamGradingConfig = null
    let teamKnowledgeDocs: any[] = []
    let knowledgeBase: any[] = []

    // Fetch team-specific grading configuration and knowledge base in parallel
    if (userProfile?.team_id) {
      // Try to get team config from cache first
      const cachedConfig = getCachedTeamConfig(userProfile.team_id)
      
      if (cachedConfig) {
        teamGradingConfig = cachedConfig
        // Only fetch knowledge docs if team config exists (skip for speed)
        if (teamGradingConfig) {
          const docsResult = await supabase
            .from('team_knowledge_documents')
            .select('*')
            .eq('team_id', userProfile.team_id)
            .eq('use_in_grading', true)
            .order('created_at', { ascending: false })
            .limit(3) // Reduced to 3 for faster grading
          
          teamKnowledgeDocs = docsResult.data || []
        }
        // Skip legacy knowledge base - not commonly used
        knowledgeBase = []
      } else {
        // Fetch team config first, then conditionally fetch docs
        const configResult = await supabase
          .from('team_grading_configs')
          .select('*')
          .eq('team_id', userProfile.team_id)
          .eq('enabled', true)
          .single()
        
        teamGradingConfig = configResult.data
        
        // Only fetch knowledge docs if team config exists
        if (teamGradingConfig) {
          const docsResult = await supabase
            .from('team_knowledge_documents')
            .select('*')
            .eq('team_id', userProfile.team_id)
            .eq('use_in_grading', true)
            .order('created_at', { ascending: false })
            .limit(3) // Reduced to 3 for faster grading
          
          teamKnowledgeDocs = docsResult.data || []
        }
        
        // Skip legacy knowledge base for speed
        knowledgeBase = []
        
        // Cache the team config for future use
        if (teamGradingConfig) {
          setCachedTeamConfig(userProfile.team_id, teamGradingConfig)
        }
      }

      logger.db('Team grading config found', { 
        hasConfig: !!teamGradingConfig,
        docCount: teamKnowledgeDocs.length 
      })
    } else {
      // Skip knowledge base for non-team users (saves 1-2 seconds)
      logger.info('Skipping knowledge base fetch - no team configured')
      knowledgeBase = []
    }

    // Build comprehensive knowledge context
    let knowledgeContext = ''
    
    // Add team-specific context if available
    if (teamGradingConfig) {
      const contextParts: string[] = []
      
      if (teamGradingConfig.company_name || teamGradingConfig.company_mission) {
        contextParts.push('=== COMPANY INFORMATION ===')
        if (teamGradingConfig.company_name) {
          contextParts.push(`Company: ${teamGradingConfig.company_name}`)
        }
        if (teamGradingConfig.company_mission) {
          contextParts.push(`Mission: ${teamGradingConfig.company_mission}`)
        }
        if (teamGradingConfig.product_description) {
          contextParts.push(`Products/Services: ${teamGradingConfig.product_description}`)
        }
        if (teamGradingConfig.service_guarantees) {
          contextParts.push(`Guarantees: ${teamGradingConfig.service_guarantees}`)
        }
        if (teamGradingConfig.company_values?.length > 0) {
          contextParts.push(`Values: ${teamGradingConfig.company_values.join(', ')}`)
        }
      }

      if (teamGradingConfig.pricing_info && Array.isArray(teamGradingConfig.pricing_info) && (teamGradingConfig.pricing_info as any).length > 0) {
        contextParts.push('\n=== PRICING INFORMATION ===')
        ;(teamGradingConfig.pricing_info as any).forEach((item: any) => {
          contextParts.push(`${item.name || 'Service'}: $${item.price || 0} ${item.frequency || ''}`)
          if (item.description) contextParts.push(`  ${item.description}`)
        })
      }

      if (teamGradingConfig.objection_handlers && Array.isArray(teamGradingConfig.objection_handlers) && (teamGradingConfig.objection_handlers as any).length > 0) {
        contextParts.push('\n=== OBJECTION HANDLERS ===')
        ;(teamGradingConfig.objection_handlers as any).forEach((handler: any) => {
          contextParts.push(`Objection: "${handler.objection}"`)
          contextParts.push(`Response: "${handler.response}"`)
        })
      }

      if (teamKnowledgeDocs.length > 0) {
        contextParts.push('\n=== KNOWLEDGE BASE DOCUMENTS ===')
        let totalChars = 0
        const maxTotalChars = 4000 // Reduced from 6000 to save tokens and speed up
        
        for (const doc of teamKnowledgeDocs) {
          if (doc.extracted_content && totalChars < maxTotalChars) {
            contextParts.push(`\n[${doc.document_type.toUpperCase()}: ${doc.document_name}]`)
            // Limit each document and track total
            const maxDocChars = Math.min(1000, maxTotalChars - totalChars)
            const content = doc.extracted_content.substring(0, maxDocChars)
            contextParts.push(content + (doc.extracted_content.length > maxDocChars ? '...' : ''))
            totalChars += content.length
          }
        }
        
        logger.db('Knowledge context loaded', { chars: totalChars, docs: teamKnowledgeDocs.length })
      }

      if (contextParts.length > 0) {
        knowledgeContext = '\n\n' + contextParts.join('\n')
      }
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

    // Call OpenAI for comprehensive analysis
    // Build system prompt with team customizations
    let systemPrompt = `You are an expert sales coach for door-to-door sales. Analyze the transcript and return ONLY valid JSON matching this structure:`
    
    // Add team-specific context to prompt
    if (teamGradingConfig) {
      systemPrompt = `You are an expert sales coach${teamGradingConfig.company_name ? ` for ${teamGradingConfig.company_name}` : ''}. `
      
      if (teamGradingConfig.product_description) {
        systemPrompt += `The sales rep is selling: ${teamGradingConfig.product_description}. `
      }
      
      systemPrompt += `Analyze the transcript using the company's specific knowledge and standards, and return ONLY valid JSON matching this structure:`
    }

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

SCORING GUIDELINES:
- Overall (0-100): ${teamGradingConfig?.custom_grading_rubric?.weights ? 'Weighted average based on custom rubric' : 'Average of all category scores'}
- Rapport (0-100): Connection, trust, warmth, local references
- Discovery (0-100): Question quality, needs assessment
- Objection Handling (0-100): Addressing concerns effectively
- Closing (0-100): Assumptive language, trial closes, commitment
  * 90-100: Sale closed with payment commitment
  * 75-89: Appointment/inspection scheduled (strong close attempt)
  * 60-74: Trial close attempted, commitment sought
  * 40-59: Asked for the sale but weak
  * 0-39: Did not attempt to close
- Safety (0-100): Mentioned pet/child safety, guarantees
- Introduction (0-100): Opening strength, first impression
- Listening (0-100): Acknowledgment, paraphrasing
- Speaking Pace (0-100): Appropriate speed, not rushed
- Question Ratio (0-100): Balance of questions vs statements (30-40% is ideal)
- Active Listening (0-100): Reflects understanding
- Assumptive Language (0-100): "When" not "if" language
${teamGradingConfig?.custom_grading_rubric?.weights ? `
CUSTOM SCORING WEIGHTS (Team-Specific):
${Object.entries(teamGradingConfig.custom_grading_rubric.weights).map(([key, value]) => `- ${key}: ${value}%`).join('\n')}
` : ''}
${teamGradingConfig?.custom_grading_rubric?.custom_criteria?.length > 0 ? `
ADDITIONAL TEAM CRITERIA:
${(teamGradingConfig.custom_grading_rubric.custom_criteria as any[]).map((c: any) => `- ${c.name}: ${c.description}`).join('\n')}
` : ''}
${teamGradingConfig?.custom_grading_rubric?.automatic_fails?.length > 0 ? `
AUTOMATIC FAILS (Cap score at 50%):
${(teamGradingConfig.custom_grading_rubric.automatic_fails as any[]).join('\n- ')}
` : ''}
${teamGradingConfig?.passing_score ? `PASSING SCORE: ${teamGradingConfig.passing_score}%` : ''}

TIMELINE (3 moments at 33%, 66%, 90%):
- Copy EXACT timestamps from transcript format: (1:23)
- Choose actual impactful lines from those positions

EARNINGS & COMMITMENT:
- sale_closed: true ONLY if customer committed to PAID service with payment
- return_appointment: true if inspection, callback, or follow-up scheduled
- IMPORTANT: Scheduled inspections are NOT sales (sale_closed = false, return_appointment = true)
- Extract: base_price, monthly_value, contract_length from conversation
- Calculate: total_contract_value, commission_earned (30%), total_earned
- commission_rate always 0.30
- If only appointment scheduled: virtual_earnings = 0, but return_appointment = true

FILLER WORDS:
- Count ONLY these as filler words:
  * "um", "uh", "uhh" at any position
  * "erm", "err", "hmm" at any position
  * "like" ONLY at the START of a sentence or before a pause (e.g., "Like, I was thinking...")
  * "like" in the MIDDLE of a sentence is normal speech (e.g., "service like this" or "need of a service like this")
- Return total AND breakdown by type with line numbers where each occurs
- Do NOT count: actually, basically, you know, sort of, kind of (normal speech)
- Do NOT count "like" when it's a comparison or example (e.g., "like this", "looks like", "seems like")

CRITICAL - FEEDBACK MUST BE HYPER-SPECIFIC:
- ALWAYS reference actual names mentioned (customer's name, family members, pets, etc.)
- ALWAYS quote or reference specific topics discussed (sports teams, hobbies, local events, etc.)
- For strengths: Say WHAT they did well WITH the exact detail. Example: "Great rapport building when discussing UT football and his son Miguel's interest in the team"
- For improvements: Cite SPECIFIC missed opportunities. Example: "When customer mentioned Miguel's baseball game, could have asked what position he plays to build deeper connection"
- For tips: Give ACTIONABLE advice tied to actual conversation moments. Example: "Next time customer mentions family activity, ask 2-3 follow-up questions before pivoting to business"
- NEVER use generic feedback like "build rapport" or "ask better questions" or "improve communication"
- ALWAYS include at least one proper noun (name, place, team, etc.) in each feedback item when possible
- Reference EXACT objections raised and how they were or weren't handled
- Quote actual phrases/words used in the conversation within feedback
- Make the rep feel like you actually watched THEIR specific conversation, not a template
- Each strength/improvement should be unique to THIS conversation, not applicable to every sales call

MUST return valid, complete JSON matching the exact structure above. No commentary.`
        },
        {
          role: "user",
        content: `TRANSCRIPT:\n${formattedTranscript}`
      }
    ]

    if (knowledgeContext) {
      messages.push({
        role: "system",
        content: `Reference materials:
${knowledgeContext}`
      })
    }

    // Retry logic for OpenAI API calls
    let completion
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: messages as any,
          response_format: { type: "json_object" },
          max_tokens: 4000, // Increased for line-by-line ratings + comprehensive feedback
          temperature: 0.2, // Lower for more consistent JSON
          stream: false // Will implement streaming in next phase
        })
        break // Success, exit retry loop
      } catch (apiError: any) {
        retryCount++
        logger.error(`OpenAI API error (attempt ${retryCount}/${maxRetries})`, apiError)
        
        if (retryCount >= maxRetries) {
          throw new Error(`OpenAI API failed after ${maxRetries} attempts: ${apiError.message}`)
        }

        // Wait before retry (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, retryCount), 5000)
        logger.info(`Retrying in ${waitTime}ms`, { attempt: retryCount, maxRetries })
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
    
    if (!completion) {
      throw new Error('Failed to get completion from OpenAI after retries')
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
      openai_time: openaiTimeSeconds + 's'
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

    // Extract all optional data (graceful degradation)
    let earningsData = gradingResult.earnings_data || {}
    let dealDetails = gradingResult.deal_details || {}
    const objectionAnalysis = gradingResult.objection_analysis || {}
    const coachingPlan = gradingResult.coaching_plan || {}
    const enhancedMetrics = gradingResult.enhanced_metrics || {}
    const conversationDynamics = gradingResult.conversation_dynamics || {}
    const failureAnalysis = gradingResult.failure_analysis || {}
    
    // Recalculate earnings to ensure correct math (OpenAI sometimes gets this wrong)
    let virtualEarnings = 0
    if (saleClosed) {
      const monthlyValue = dealDetails.monthly_value || 0
      const contractLength = dealDetails.contract_length || 0
      const basePrice = dealDetails.base_price || 0
      
      // Calculate total contract value
      let totalContractValue = 0
      if (monthlyValue > 0 && contractLength > 0) {
        // Monthly contract: $X/month × Y months
        totalContractValue = monthlyValue * contractLength
      } else if (basePrice > 0) {
        // One-time service
        totalContractValue = basePrice
      }
      
      // Calculate commission (30% of total contract value)
      const commissionEarned = totalContractValue * 0.30
      
      // Add bonuses
      const bonuses = earningsData.bonus_modifiers || {}
      const totalBonuses = Object.values(bonuses).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0)
      
      // Total earned = commission + bonuses
      const totalEarned = commissionEarned + totalBonuses
      
      // Update earnings data with corrected values
      earningsData = {
        ...earningsData,
        closed_amount: totalContractValue,
        commission_rate: 0.30,
        commission_earned: commissionEarned,
        bonus_modifiers: bonuses,
        total_earned: totalEarned
      }
      
      // Update deal details
      dealDetails = {
        ...dealDetails,
        total_contract_value: totalContractValue
      }
      
      virtualEarnings = totalEarned
      
      logger.info('Recalculated earnings', {
        monthly_value: monthlyValue,
        contract_length: contractLength,
        base_price: basePrice,
        total_contract_value: totalContractValue,
        commission_earned: commissionEarned,
        bonuses: totalBonuses,
        total_earned: totalEarned
      })
    }

    if (!saleClosed) {
      virtualEarnings = 0
    }


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

    // Extract line ratings from the grading result
    const lineRatings: any[] = Array.isArray(gradingResult.line_ratings) 
      ? gradingResult.line_ratings 
      : []
    logger.info('Line-by-line grading enabled', { ratingsCount: lineRatings.length })

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
          line_ratings: lineRatings,
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

    // Store line ratings if available
    if (lineRatings.length > 0) {
      const { error: ratingsError } = await (supabase as any)
        .from('line_ratings')
        .upsert(
          lineRatings.map((rating: any) => ({
            session_id: sessionId,
            line_number: rating.line_number,
            speaker: rating.speaker,
            text: rating.text || '',
            effectiveness: rating.effectiveness,
            alternative_lines: rating.alternative_lines || [],
            created_at: now
          })),
          { onConflict: 'session_id,line_number' }
        )
      
      if (ratingsError) {
        logger.warn('Failed to store line ratings', { error: ratingsError.message })
      } else {
        logger.success('Line ratings stored', { count: lineRatings.length })
      }
    }

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

      // Manager notification
      import('@/lib/notifications/service').then(async ({ getRepManager, sendNotification }) => {
        const managerId = await getRepManager(userId)
        if (managerId) {
          const { data: repData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', userId)
            .single()

          return sendNotification({
            type: 'managerSessionAlert',
            userId: managerId,
            data: {
              repName: repData?.full_name || 'Team Member',
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
      lines_graded: 0, // Line-by-line grading temporarily disabled
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
        errorStatus: error.status
      })
    })
    
    // Provide helpful error messages based on error type
    let userMessage = error.message || 'Failed to grade session'
    let statusCode = 500
    
    if (error.message?.includes('OpenAI')) {
      userMessage = 'OpenAI API error - please try again'
      statusCode = 503
    } else if (error.message?.includes('parse')) {
      userMessage = 'Failed to parse grading response - please try again'
      statusCode = 502
    } else if (error.message?.includes('timeout')) {
      userMessage = 'Request timed out - session may be too long'
      statusCode = 504
    }
    
    return NextResponse.json(
      { 
        error: userMessage,
        details: {
          type: error.name,
          message: error.message,
          duration: errorDuration + 's'
        }
      },
      { status: statusCode }
    )
  }
}
