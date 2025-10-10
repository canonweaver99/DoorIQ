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

    // Format transcript for OpenAI
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
        return `[${index}] ${speaker}: ${text}`
      })
      .join('\n')

    console.log('🤖 Calling OpenAI for grading...')
    console.log('📝 Formatted transcript length:', formattedTranscript.length, 'characters')
    console.log('📝 Transcript preview:', formattedTranscript.substring(0, 500))

    // Call OpenAI for comprehensive analysis
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert sales coach analyzing door-to-door pest control sales conversations. 

CRITICAL: Analyze ONLY the actual conversation provided. All data must come from the transcript. Never use example or placeholder values.

CORE ANALYSIS REQUIREMENTS:

For each line assess: speaker(rep/customer), timestamp, effectiveness(excellent/good/average/poor), score(0-100), sentiment(positive/neutral/negative), customer_engagement(high/medium/low), missed_opportunities[], techniques_used[], category(introduction/rapport/discovery/objection_handling/closing/safety/general)

SCORING CRITERIA (each /100):

RAPPORT: personal-connection local-refs name-usage mirroring warmth authenticity. Penalize: over-familiarity fake-friendliness rushed-pleasantries.

DISCOVERY: problem-ID pain-exploration budget-qual decision-makers timeline. Quality: open-ended-ratio follow-up-depth listening. Penalize: interrogation assumptions premature-solutions.

OBJECTIONS: Types: price spouse time competitor DIY rental experience need. Response: acknowledge-validate feel-felt-found reframe value-build urgency social-proof. Penalize: argumentative dismissive pressure desperation.

CLOSING: assumptive-close alternative-choice urgency summary trial-closes. Measure: frequency timing confidence buying-signals. Penalize: weak-language permission-seeking over-aggressive unclear-steps.

PACE: Optimal 140-160WPM. <120=-2pts/10WPM. >200=-3pts/10WPM.

FILLERS: um uh like you-know basically actually. Score: 0-2%=100, 2-5%=80, 5-8%=60, >8%=40.

QUESTIONS: Target 30-40%=100. <20%=60, >50%=80. Track: open/closed/discovery/trial-closes.

LISTENING: Count acknowledgments empathy paraphrasing referencing-earlier. Penalize: non-sequiturs generic-responses.

ASSUMPTIVE: when-we your-technician vs if-you might-consider. Ratio >0.7=100.

CONVERSATION DYNAMICS TRACKING:
Track between lines:
- Interruptions: who interrupted, impact(positive/negative)
- Energy shifts: line, from/to(engaged/skeptical/interested/closed), trigger
- Buying signals: line, signal description, strength(weak/medium/strong/very_strong)
- Momentum changes: where conversation accelerated/stalled
- Engagement drops: when customer checked out mentally

FAILURE ANALYSIS:
Identify deal-killing moments:
- Critical moments: line, event, customer_reaction, rep_recovery_attempted, success, better_approach
- Point of no return: specific line where deal was lost, reason, could_have_saved(true/false), how_to_save
- Missed pivots: opportunities to redirect that were ignored
- Recovery failures: attempted saves that made things worse

OBJECTION DETAILS:
For each: type, customer_statement, rep_response, technique, resolution(resolved/partial/unresolved/ignored), time_to_resolve, effectiveness(0-100)

COACHING PLAN:
Immediate fixes: issue, practice_scenario, resource(/training/[topic])
Skill development: skill, current_level, target_level, exercises[]
Role-play scenarios based on observed weaknesses

EARNINGS RULES:
- Sale closed = payment commitment at door (not just appointment)
- No sale = virtual_earnings MUST be 0
- Extract actual price from conversation
- Commission: 30% of contract value
- Bonuses: quick_close($25/<15min), upsell($50/premium), retention($30/annual), same_day($20), referral($25), perfect_pitch($50/score>=90)

DATA EXTRACTION RULES:
1. Use ONLY information explicitly stated in the provided transcript
2. For line_ratings: analyze EACH line from the transcript sequentially
3. For customer_statements: use EXACT quotes from the transcript
4. For prices/amounts: extract ONLY numbers mentioned in conversation
5. If information is not in transcript, use empty string "" or 0 or empty array []
6. Do NOT invent names, prices, or statements not in the transcript
7. Count actual occurrences (questions, fillers, objections) from the transcript
8. Timestamps should reflect actual conversation flow (increment realistically)

          ${knowledgeContext}
          
Return JSON with ONLY data from the analyzed conversation (no examples or placeholders):`
        },
        {
          role: "user",
          content: formattedTranscript
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 3500  // Comprehensive analysis needs more tokens
    })

    const responseContent = completion.choices[0].message.content || '{}'
    console.log('📨 Raw OpenAI response:', responseContent)
    
    let gradingResult
    try {
      gradingResult = JSON.parse(responseContent)
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      console.error('❌ Response content:', responseContent)
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
    const fillerWordsScore = typeof gradingResult.scores?.filler_words === 'number' ? gradingResult.scores.filler_words : null
    const questionRatioScore = typeof gradingResult.scores?.question_ratio === 'number' ? gradingResult.scores.question_ratio : null
    const activeListeningScore = typeof gradingResult.scores?.active_listening === 'number' ? gradingResult.scores.active_listening : null
    const assumptiveLanguageScore = typeof gradingResult.scores?.assumptive_language === 'number' ? gradingResult.scores.assumptive_language : null
    
    const returnAppointment = typeof gradingResult.return_appointment === 'boolean' ? gradingResult.return_appointment : false

    console.log('🔍 Extracted scores:', { 
      rapportScore, discoveryScore, objectionScore, closeScore,
      speakingPaceScore, fillerWordsScore, questionRatioScore, 
      activeListeningScore, assumptiveLanguageScore 
    })

    let saleClosed = typeof gradingResult.sale_closed === 'boolean' ? gradingResult.sale_closed : false
    if (returnAppointment && !saleClosed) {
      saleClosed = false
    }

    // Extract all optional data (graceful degradation)
    const earningsData = gradingResult.earnings_data || {}
    const dealDetails = gradingResult.deal_details || {}
    const objectionAnalysis = gradingResult.objection_analysis || {}
    const coachingPlan = gradingResult.coaching_plan || {}
    const enhancedMetrics = gradingResult.enhanced_metrics || {}
    const conversationDynamics = gradingResult.conversation_dynamics || {}
    const failureAnalysis = gradingResult.failure_analysis || {}
    
    // Use total_earned from earnings_data if available, otherwise fall back to virtual_earnings
    let virtualEarnings = 0
    if (saleClosed) {
      if (earningsData.total_earned && typeof earningsData.total_earned === 'number') {
        virtualEarnings = earningsData.total_earned
      } else if (typeof gradingResult.virtual_earnings === 'number') {
        virtualEarnings = gradingResult.virtual_earnings
      }
    }

    if (!saleClosed) {
      virtualEarnings = 0
    }

    console.log('💰 Final values:', { 
      saleClosed, 
      returnAppointment, 
      virtualEarnings,
      dealValue: dealDetails.total_contract_value,
      commission: earningsData.commission_earned,
      bonuses: earningsData.bonus_modifiers
    })

    const calculatedOverall = (() => {
      if (typeof gradingResult.scores?.overall === 'number') {
        return gradingResult.scores.overall
      }

      // Include all 9 scores in the overall calculation
      const numericScores = [
        rapportScore, discoveryScore, objectionScore, closeScore,
        speakingPaceScore, fillerWordsScore, questionRatioScore,
        activeListeningScore, assumptiveLanguageScore
      ].filter((value) => typeof value === 'number') as number[]
      
      if (numericScores.length === 0) {
        return 0
      }
      return Math.round(numericScores.reduce((sum, value) => sum + value, 0) / numericScores.length)
    })()

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
        filler_words_score: fillerWordsScore,
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
          line_ratings: gradingResult.line_ratings || [],
          feedback: gradingResult.feedback || { strengths: [], improvements: [], specific_tips: [] },
          enhanced_metrics: enhancedMetrics,
          objection_analysis: objectionAnalysis,
          coaching_plan: coachingPlan,
          conversation_dynamics: conversationDynamics,
          failure_analysis: failureAnalysis,
          earnings_data: earningsData,
          deal_details: dealDetails,
          graded_at: now,
          grading_version: '6.0-comprehensive',
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
