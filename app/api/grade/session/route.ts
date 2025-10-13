import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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
    'conversation_dynamics',
    'failure_analysis',
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
        additionalProperties: false,
        properties: {
          line_number: { type: 'integer' },
          speaker: { type: 'string' },
          timestamp: { type: 'string' },
          effectiveness: { type: 'string' },
          score: { type: 'number' },
          sentiment: { type: 'string' },
          customer_engagement: { type: 'string' },
          missed_opportunities: {
            type: 'array',
            items: { type: 'string' }
          },
          techniques_used: {
            type: 'array',
            items: { type: 'string' }
          },
          category: { type: 'string' },
          improvement_notes: { type: 'string' }
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
      additionalProperties: false,
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
      additionalProperties: false,
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
      additionalProperties: false,
      properties: {
        total_objections: { type: 'integer' },
        objections_detail: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              line: { type: 'integer' },
              type: { type: 'string' },
              customer_statement: { type: 'string' },
              rep_response: { type: 'string' },
              technique: { type: 'string' },
              resolution: { type: 'string' },
              time_to_resolve: { type: 'string' },
              effectiveness: { type: 'number' }
            }
          }
        },
        unresolved_concerns: { type: 'array', items: { type: 'string' } },
        objection_patterns: { type: 'string' }
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
    
    if (!(session as any).full_transcript || (session as any).full_transcript.length === 0) {
      console.error('❌ No transcript found for session:', sessionId)
      console.error('📊 Session data:', {
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
    
    console.log('📊 Transcript found:', (session as any).full_transcript.length, 'lines')
    console.log('📊 First transcript line:', (session as any).full_transcript[0])

    // Fetch knowledge base context for the user
    const { data: knowledgeBase } = await supabase
      .from('knowledge_base')
      .select('file_name, content')
      .eq('user_id', (session as any).user_id)
      .eq('is_active', true)
      .limit(5) // Limit to avoid token overflow

    // Format knowledge base context
    let knowledgeContext = ''
    if (knowledgeBase && knowledgeBase.length > 0) {
      knowledgeContext = '\n\nREFERENCE MATERIALS:\n' + 
        (knowledgeBase as any)
          .filter((kb: any) => kb.content)
          .map((kb: any) => `File: ${kb.file_name}\n${kb.content.substring(0, 1000)}...`)
          .join('\n\n')
    }

    // Format transcript for OpenAI with timestamps
    const startTime = new Date((session as any).started_at || (session as any).created_at)
    const formattedTranscript = (session as any).full_transcript
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
        
        // Calculate relative timestamp (seconds from start)
        let timestamp = '0:00'
        if (line.timestamp) {
          try {
            const lineTime = new Date(line.timestamp)
            const secondsFromStart = Math.floor((lineTime.getTime() - startTime.getTime()) / 1000)
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

    console.log('🤖 Calling OpenAI for grading...')
    console.log('📝 Formatted transcript length:', formattedTranscript.length, 'characters')
    console.log('📝 Transcript preview:', formattedTranscript.substring(0, 500))

    // Call OpenAI for comprehensive analysis
    const messages: Array<{ role: string; content: string }> = [
        {
          role: "system",
        content: `You are an expert sales coach for door-to-door pest control. Analyze the transcript and return ONLY valid JSON matching this structure:

{
  "session_summary": { "total_lines": int, "rep_lines": int, "customer_lines": int, "objections_detected": int, "questions_asked": int },
  "scores": { "overall": int, "rapport": int, "discovery": int, "objection_handling": int, "closing": int, "safety": int, "introduction": int, "listening": int, "speaking_pace": int, "question_ratio": int, "active_listening": int, "assumptive_language": int },
  "filler_word_count": int,
  "line_ratings": [{
    "line_number": int,
    "speaker": "rep/customer",
    "timestamp": "00:00",
    "effectiveness": "excellent/good/average/poor",
    "score": int,
    "sentiment": "positive/neutral/negative",
    "customer_engagement": "high/medium/low",
    "missed_opportunities": [],
    "techniques_used": [],
    "category": "introduction/rapport/discovery/objection_handling/closing/general",
    "improvement_notes": "",
    "alternative_lines": []
  }],
  "feedback": { "strengths": [], "improvements": [], "specific_tips": [] },
  "conversation_dynamics": { "interruptions": [], "energy_shifts": [], "buying_signals": [], "momentum_changes": [], "engagement_drops": [] },
  "failure_analysis": { "critical_moments": [], "point_of_no_return": { "line": 0, "reason": "", "could_have_saved": false, "how": "" }, "missed_pivots": [], "recovery_failures": [] },
  "objection_analysis": { "total_objections": int, "objections_detail": [], "unresolved_concerns": [], "objection_patterns": "" },
  "coaching_plan": { "immediate_fixes": [], "skill_development": [], "role_play_scenarios": [] },
  "timeline_key_moments": [
    { "position": 15, "line_number": int, "timestamp": "0:00", "moment_type": "Initial Resistance", "quote": "actual customer or rep quote", "is_positive": bool },
    { "position": 30, "line_number": int, "timestamp": "0:00", "moment_type": "Problem Discovery", "quote": "actual customer or rep quote", "is_positive": bool },
    { "position": 45, "line_number": int, "timestamp": "0:00", "moment_type": "Trust Building", "quote": "actual customer or rep quote", "is_positive": bool },
    { "position": 60, "line_number": int, "timestamp": "0:00", "moment_type": "First Objection", "quote": "actual customer or rep quote", "is_positive": bool },
    { "position": 75, "line_number": int, "timestamp": "0:00", "moment_type": "Critical Moment", "quote": "actual customer or rep quote", "is_positive": bool },
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
      "common_fillers": { "um": int, "uh": int, "like": int, "you know": int, "basically": int, "actually": int }
    }
  }
}

Rules:
- Only extract data explicitly stated in the transcript. If not mentioned, use empty string "", 0, false, or [] where appropriate.
- Create a line_ratings entry for EVERY sales rep line. Include alternative_lines with 1-2 suggested rewrites for lines rated "average" or "poor". Leave alternative_lines empty for "good" or "excellent" lines.
- Count all filler words (um, uh, like, you know, basically, actually) spoken by the sales rep. Return the total count as filler_word_count AND in enhanced_metrics.filler_words with breakdown by type.
- DO NOT include filler_words in the scores object. The backend will deduct 1% from overall for each filler word.

TIMELINE KEY MOMENTS:
Identify exactly 6 key moments from the conversation for the timeline at these positions:
- Position 15% (Early): Initial resistance or opening moment - find the first sign of customer interest/disinterest
- Position 30% (Early-Mid): Problem discovery - when customer reveals their issue or need
- Position 45% (Mid): Trust building - a rapport moment or emotional connection (or lack thereof)
- Position 60% (Mid-Late): First major objection - customer's primary concern or pushback
- Position 75% (Late): Critical turning point - the make-or-break moment that sealed the outcome
- Position 90% (End): Close attempt - final outcome (success or failure)

For each moment, provide:
- line_number: The exact line index from the transcript (the number in [brackets])
- timestamp: Copy the EXACT timestamp from the transcript line at that line_number. The transcript format is "[line_number] (timestamp) Speaker: text" - extract the timestamp from the (parentheses). Examples: "0:05", "1:47", "2:33"
- moment_type: Short descriptive label (e.g., "Trust Broken", "Price Objection", "Closed Successfully")
- quote: The EXACT text spoken by either party at that moment (verbatim from transcript, everything after "Speaker: ")
- is_positive: true if moment helped the sale, false if it hurt

CRITICAL: The transcript shows timestamps in parentheses like (1:23). Copy these exactly. Never use "00:00" unless that's the actual timestamp shown.

For failed sales, identify which moment killed the deal (usually position 75 or earlier) and mark is_positive as false.

QUESTION RATIO CALCULATION:
Count ONLY discovery and clarification questions that end with "?". 
DO NOT count:
- Rhetorical questions ("Makes sense, right?", "You know what I mean?")
- Assumptive trial closes ("Sound good?", "Fair enough?")
- Tag questions ("Isn't it?", "Don't you think?")

DO count:
- Open-ended discovery questions ("What concerns do you have?", "How long has this been an issue?")
- Probing questions ("Tell me more about...", "When did you first notice...?")
- Needs-based questions ("What's your biggest pest concern?")

Calculate the ratio: (discovery_questions / total_rep_lines) * 100 = percentage

Then score the question_ratio field based on that percentage:
- 30-40% ratio = 100 points (optimal balance)
- 40-50% ratio = 90 points (good, slightly high)
- 50-60% ratio = 75 points (high but acceptable)
- 20-30% ratio = 80 points (could ask more)
- 10-20% ratio = 60 points (too much talking)
- <10% ratio = 30 points (pitch-heavy, not enough discovery)
- >60% ratio = 60 points (interrogation-style, too aggressive)

IMPORTANT: A rep who asks 11 questions out of 20 total lines has a 55% ratio = 75 points (not 30!)
Double-check your math before assigning the score.

EARNINGS CALCULATION:
- sale_closed true ONLY if customer commits to a paid service (not just appointments)
- Extract monthly_value and contract_length from conversation
- Calculate total_contract_value = monthly_value × contract_length (e.g., $100/month × 6 months = $600)
- Calculate commission_earned = total_contract_value × 0.30
- For one-time services, use base_price as total_contract_value
- Set closed_amount to total_contract_value
- Add bonuses to commission_earned to get total_earned
- Set virtual_earnings = total_earned
- No sale means all earnings values = 0

- Return strictly valid JSON with no extra commentary.`
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages as any,
      response_format: { type: "json_object" },
      max_tokens: 4000,
      temperature: 0.4
    })

    const responseContent = completion.choices[0].message.content || '{}'
    console.log('📨 Raw OpenAI response length:', responseContent.length)
    
    let gradingResult
    try {
      gradingResult = JSON.parse(responseContent)
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      console.error('❌ Response content (first 2000 chars):', responseContent.substring(0, 2000))
      console.error('❌ Response content (last 500 chars):', responseContent.substring(Math.max(0, responseContent.length - 500)))
      throw new Error('Failed to parse OpenAI response as JSON')
    }
    
    console.log('✅ OpenAI grading complete:', {
      lines_rated: gradingResult.line_ratings?.length || 0,
      scores: gradingResult.scores,
      sale_closed: gradingResult.sale_closed,
      virtual_earnings: gradingResult.virtual_earnings
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

    console.log('🔍 Extracted scores:', { 
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
      
      console.log('💰 Recalculated earnings:', {
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
        console.log('✅ Using OpenAI overall score:', gradingResult.scores.overall)
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
        console.log('🧮 Calculated overall score from', numericScores.length, 'core metrics:', baseScore)
      }
      
      // Apply filler word penalty: -1% per filler word
      const fillerPenalty = fillerWordCount
      const finalScore = Math.max(0, baseScore - fillerPenalty)
      
      if (fillerWordCount > 0) {
        console.log(`🎙️ Filler word penalty: ${fillerWordCount} words = -${fillerPenalty}% (${baseScore} → ${finalScore})`)
      }
      
      return finalScore
    })()

    // Merge timestamps from original transcript into line ratings
    const lineRatings = gradingResult.line_ratings || []
    const transcriptWithTimestamps = (session as any).full_transcript || []
    
    lineRatings.forEach((rating: any) => {
      const originalLine = transcriptWithTimestamps[rating.line_number]
      if (originalLine && originalLine.timestamp) {
        rating.timestamp = originalLine.timestamp
      }
    })
    
    console.log('📍 Applied timestamps to', lineRatings.filter((r: any) => r.timestamp && r.timestamp !== '00:00').length, 'line ratings')

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
          grading_version: '6.1-with-timeline',
          scores: gradingResult.scores || {}
        }
      } as any)
      .eq('id', sessionId)

    if (updateError) {
      console.error('❌ Failed to update session:', updateError)
      throw updateError
    }

    // Line ratings are stored in the analytics JSONB column, no separate table needed
    console.log(`✅ Stored ${gradingResult.line_ratings?.length || 0} line ratings in analytics column`)

    console.log('✅ Grading saved successfully!')
    console.log('📊 Summary:', {
      scores: Object.keys(gradingResult.scores || {}).length,
      line_ratings: gradingResult.line_ratings?.length || 0,
      has_dynamics: !!conversationDynamics.buying_signals,
      has_failure_analysis: !!failureAnalysis.critical_moments,
      has_objections: !!objectionAnalysis.total_objections,
      has_coaching: !!coachingPlan.immediate_fixes,
      virtual_earnings: virtualEarnings
    })

    return NextResponse.json({
      success: true,
      scores: gradingResult.scores,
      feedback: gradingResult.feedback || {},
      lines_graded: gradingResult.line_ratings?.length || 0,
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
    console.error('❌ Grading error:', error)
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    })
    return NextResponse.json(
      { 
        error: error.message || 'Failed to grade session',
        details: {
          type: error.name,
          message: error.message
        }
      },
      { status: 500 }
    )
  }
}
