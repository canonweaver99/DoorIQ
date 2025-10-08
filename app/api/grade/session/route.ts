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
      console.error('❌ No transcript found')
      return NextResponse.json({ error: 'No transcript to grade' }, { status: 400 })
    }

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

    // Call OpenAI for comprehensive analysis
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert sales coach analyzing door-to-door pest control sales conversations. 
          Evaluate each line from the sales rep and provide detailed feedback.
          ${knowledgeContext ? 'Use the provided reference materials to ensure your feedback aligns with company training and best practices.' : ''}
          
          For each sales rep line, assess:
          1. Effectiveness: rate as "excellent", "good", "average", or "poor"
          2. Score: 0-100 based on effectiveness
          3. Alternative approaches: suggest 1-2 better ways to say it (if not excellent)
          4. Category: classify into introduction, rapport, discovery, objection_handling, closing, safety, or general
          
          ENHANCED SCORING CRITERIA:
          
          1. RAPPORT BUILDING (/100)
          Measure: personal-connection local-references neighborhood-mentions shared-experiences compliments-property name-usage mirror-language match-terminology humor-appropriateness warmth-indicators friendly-tone casual-conversation non-business-topics family-mentions weather-sports-observations genuine-interest enthusiasm-level relatability-phrases common-ground-establishment trust-building-statements empathy-expressions. 
          Penalize: over-familiarity fake-friendliness rushed-pleasantries ignored-personal-cues robotic-greetings cold-opening immediate-pitch skipping-introduction inappropriate-jokes forced-connection. 
          Track: response-mirroring conversation-flow natural-transitions authentic-engagement.
          Weight: greeting-quality(20%) connection-depth(30%) authenticity(25%) customer-comfort(25%)
          
          2. DISCOVERY (/100)
          Count: problem-identification-questions pain-point-exploration history-questions timeline-inquiries severity-assessment priority-uncovering budget-qualification decision-maker-identification previous-solution-attempts current-situation-analysis future-concern-probing specific-room-areas inspection-requests permission-questions lifestyle-questions household-composition pest-sighting-specifics damage-concerns health-worries. 
          Quality-factors: open-ended-ratio follow-up-depth listening-duration note-taking-references problem-agitation-skill connecting-dots-ability insight-demonstration. 
          Penalize: interrogation-style surface-level-only assumptions-without-asking skipping-discovery premature-solutions.
          Weight: question-quantity(25%) question-quality(35%) problem-identification(40%)
          
          3. OBJECTION HANDLING (/100)
          Identify-objections: price-resistance spouse-decision time-delays competitor-comparison DIY-preference rental-property previous-bad-experience no-problem-perceived contract-concerns chemical-worries pet-safety. 
          Response-quality: acknowledge-validate-respond feel-felt-found isolation-techniques reframe-methods value-building urgency-creation social-proof-usage guarantee-mentions risk-reversal alternative-options payment-plans concern-resolution. 
          Measure: response-speed confidence-level empathy-demonstration solution-orientation recovery-smoothness objection-anticipation preemptive-handling. 
          Penalize: argumentative-tone dismissive-responses ignored-concerns pressure-tactics desperation-showing.
          Weight: response-effectiveness(40%) empathy-shown(30%) value-reinforcement(30%)
          
          4. CLOSING TECHNIQUE (/100)
          Detect: assumptive-close alternative-choice-close urgency-close scarcity-close summary-close question-close silence-usage trial-closes minor-point-close handshake-close. 
          Measure: close-attempt-frequency timing-appropriateness confidence-level natural-flow multiple-close-attempts persistence-without-annoyance buying-signal-recognition momentum-maintenance. 
          Key-phrases: starting-tomorrow choosing-between putting-down-for which-works-better makes-sense-right normally-booked-but initial-treatment-includes. 
          Penalize: weak-language permission-seeking over-aggressive premature-closing no-close-attempt unclear-next-steps hesitation-showing price-apologies trailing-off-endings.
          Weight: attempt-clarity(30%) confidence-displayed(30%) urgency-created(20%) next-steps(20%)
          
          ADDITIONAL METRICS TO CALCULATE:
          
          5. SPEAKING PACE (/100)
          Calculate: words-per-minute for each rep line. Optimal: 140-160 WPM = 100 score. 
          Penalties: <120 WPM = subtract 2 points per 10 WPM under. >200 WPM = subtract 3 points per 10 WPM over.
          Track: pace-changes during pricing/technical-explanations/objection-handling. 
          Flag: monotonous-constant-speed vs strategic-pace-variation. 
          Measure: rushed-sections mumbled-portions clear-articulation-zones.
          
          6. FILLER WORDS (/100)
          Count per line: um uh like you-know so basically actually literally right obviously honestly frankly essentially just kinda sorta I-mean I-guess you-see.
          Calculate: filler-density = (filler_count / total_words) * 100. 
          Scoring: 0-2% = 100, 2-5% = 80, 5-8% = 60, 8-12% = 40, >12% = 20.
          Track: clusters during transitions/price-mentions/uncertainty. 
          Identify: nervous-laughter verbal-crutches repeated-phrases throat-clearing.
          
          7. QUESTION RATIO (/100)
          Measure: questions-to-statements percentage. Target: 30-40% = 100 score.
          <20% = 60, <10% = 30, >50% = 80, >60% = 60 (interrogation).
          Categorize: open-ended closed discovery trial-closes assumptive rhetorical.
          Track: question-frequency spacing monologue-duration.
          Penalize: interrogation-style zero-questions continuous-talking preaching.
          
          8. ACTIVE LISTENING (/100)
          Count per conversation: acknowledgments("absolutely" "exactly" "I-understand" "that-makes-sense" "I-hear-you" "tell-me-more" "great-point") 
          + empathy-statements + paraphrasing + reflecting-back + referencing-earlier + building-on-customer-words.
          Score: 1 point per genuine indicator, max 100. 
          Measure: response-relevance topic-continuity.
          Penalize: non-sequiturs ignoring-concerns generic-responses scripted-acknowledgments (-5 each).
          
          9. ASSUMPTIVE LANGUAGE (/100)
          Count assumptive: when-we after-treatment once-installed your-technician tomorrow's-appointment.
          Count tentative: if-you-decide should-you-choose maybe-possibly could-potentially might-consider.
          Ratio: assumptive/(assumptive+tentative). >0.7 = 100, 0.5-0.7 = 80, 0.3-0.5 = 60, <0.3 = 40.
          Track: closing-assumption ownership-language certainty-indicators future-pacing.
          Measure: confidence-level commitment-phrases vs permission-seeking wishful-phrasing.
          
          Determine whether a return appointment or inspection was scheduled (return_appointment true/false).
          A sale counts as closed ONLY if the rep secured the deal at the door during this conversation. Scheduling a follow-up or inspection without payment is NOT a closed sale.
          If a sale is not closed, virtual_earnings must be 0 and sale_closed must be false.
          ${knowledgeContext}
          
          Return a JSON object with this structure:
          {
            "line_ratings": [
              {
                "line_number": 0,
                "effectiveness": "good",
                "score": 75,
                "alternative_lines": ["Better way to say this..."],
                "improvement_notes": "Consider being more specific about...",
                "category": "introduction",
                "words_per_minute": 145,
                "filler_words": ["um", "uh"],
                "is_question": false
              }
            ],
            "scores": {
              "overall": 75,
              "rapport": 80,
              "discovery": 70,
              "objection_handling": 65,
              "closing": 70,
              "safety": 85,
              "introduction": 75,
              "listening": 80,
              "speaking_pace": 85,
              "filler_words": 75,
              "question_ratio": 82,
              "active_listening": 78,
              "assumptive_language": 72
            },
            "enhanced_metrics": {
              "speaking_pace": {
                "avg_wpm": 152,
                "pace_variation": "good",
                "rushed_sections": [45, 67],
                "clear_sections": [12, 34, 89],
                "score_breakdown": "Clear articulation in intro, rushed during price discussion"
              },
              "filler_words": {
                "total_count": 23,
                "per_minute": 2.3,
                "common_fillers": {"um": 8, "uh": 5, "like": 7, "you know": 3},
                "clusters": [{"line_range": "45-50", "density": "high"}],
                "score_breakdown": "Good control overall, increased during objection handling"
              },
              "question_ratio": {
                "percentage": 35,
                "total_questions": 28,
                "open_ended": 12,
                "closed": 16,
                "by_category": {"discovery": 18, "trial_close": 6, "clarifying": 4},
                "score_breakdown": "Excellent question frequency, good mix of open/closed"
              },
              "active_listening": {
                "acknowledgments": 15,
                "empathy_statements": 8,
                "paraphrasing_count": 6,
                "building_on_responses": 9,
                "score_breakdown": "Strong empathy, could improve on paraphrasing customer concerns"
              },
              "assumptive_language": {
                "assumptive_phrases": 14,
                "tentative_phrases": 6,
                "confidence_ratio": 0.70,
                "strong_closes": ["when we start tomorrow", "your technician will"],
                "score_breakdown": "Good confidence level, avoid tentative language in closing"
              }
            },
            "feedback": {
              "strengths": ["Built good rapport", "Asked relevant questions"],
              "improvements": ["Handle price objections more confidently", "Close earlier in the conversation"],
              "specific_tips": ["When they mention price, pivot to value instead of defending"]
            },
            "virtual_earnings": 75.00,
            "sale_closed": true,
            "return_appointment": false
          }`
        },
        {
          role: "user",
          content: formattedTranscript
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000
    })

    const gradingResult = JSON.parse(completion.choices[0].message.content || '{}')
    
    console.log('✅ OpenAI grading complete:', {
      lines_rated: gradingResult.line_ratings?.length || 0,
      scores: gradingResult.scores,
      enhanced_metrics: gradingResult.enhanced_metrics ? Object.keys(gradingResult.enhanced_metrics) : [],
      sale_closed: gradingResult.sale_closed,
      return_appointment: gradingResult.return_appointment,
      virtual_earnings: gradingResult.virtual_earnings,
      raw_response: completion.choices[0].message.content?.substring(0, 500)
    })
    
    console.log('📊 Full grading result:', JSON.stringify(gradingResult, null, 2))

    // Start a transaction to update both tables
    const now = new Date().toISOString()

    // Update live_sessions with scores and analytics
    const rapportScore = typeof gradingResult.scores?.rapport === 'number' ? gradingResult.scores.rapport : null
    const discoveryScore = typeof gradingResult.scores?.discovery === 'number' ? gradingResult.scores.discovery : null
    const objectionScore = typeof gradingResult.scores?.objection_handling === 'number' ? gradingResult.scores.objection_handling : null
    const closeScore = typeof gradingResult.scores?.closing === 'number' ? gradingResult.scores.closing : null
    const safetyScore = typeof gradingResult.scores?.safety === 'number' ? gradingResult.scores.safety : null
    
    // Extract new enhanced metric scores
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

    let virtualEarnings = saleClosed && typeof gradingResult.virtual_earnings === 'number'
      ? gradingResult.virtual_earnings
      : 0

    if (!saleClosed) {
      virtualEarnings = 0
    }

    console.log('💰 Final values:', { saleClosed, returnAppointment, virtualEarnings })

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
        
        // New enhanced metric scores
        speaking_pace_score: speakingPaceScore,
        speaking_pace_data: gradingResult.enhanced_metrics?.speaking_pace || {},
        filler_words_score: fillerWordsScore,
        filler_words_data: gradingResult.enhanced_metrics?.filler_words || {},
        question_ratio_score: questionRatioScore,
        question_ratio_data: gradingResult.enhanced_metrics?.question_ratio || {},
        active_listening_score: activeListeningScore,
        active_listening_data: gradingResult.enhanced_metrics?.active_listening || {},
        assumptive_language_score: assumptiveLanguageScore,
        assumptive_language_data: gradingResult.enhanced_metrics?.assumptive_language || {},
        
        virtual_earnings: virtualEarnings,
        sale_closed: saleClosed,
        return_appointment: returnAppointment,
        analytics: {
          line_ratings: gradingResult.line_ratings || [],
          feedback: gradingResult.feedback || {},
          enhanced_metrics: gradingResult.enhanced_metrics || {},
          graded_at: now,
          grading_version: '4.0-enhanced',
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

    return NextResponse.json({
      success: true,
      scores: gradingResult.scores,
      feedback: gradingResult.feedback,
      lines_graded: gradingResult.line_ratings?.length || 0,
      sale_closed: saleClosed,
      return_appointment: returnAppointment,
      virtual_earnings: virtualEarnings
    })

  } catch (error: any) {
    console.error('❌ Grading error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to grade session' },
      { status: 500 }
    )
  }
}
