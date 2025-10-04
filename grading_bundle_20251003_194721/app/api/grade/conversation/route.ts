import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fetchElevenLabsConversation, normalizeTranscriptFromEleven } from '@/api/elevenlabs'
import { analyzeWithOpenAI } from '@/api/analyzeConversation'
import { extractBasicMetrics } from '@/utils/conversationAnalyzer'
import { calculateGrade } from '@/utils/gradeCalculator'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { conversationId, agentId, homeownerName, homeownerProfile, userId: providedUserId } = await req.json()
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
    }

    // Get userId from parameter or from Supabase auth
    const supabase = await createServerSupabaseClient()
    let userId = providedUserId
    
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        userId = user.id
        console.log('📝 Got userId from auth:', userId)
      } else {
        return NextResponse.json({ error: 'User not authenticated and no userId provided' }, { status: 401 })
      }
    }

    // 1) Retrieve conversation from ElevenLabs
    const convo = await fetchElevenLabsConversation(conversationId)
    const simpleTurns = normalizeTranscriptFromEleven(convo)

    // 2) Extract basic metrics
    const basic = extractBasicMetrics(simpleTurns)

    // 3) Build plain text transcript for AI
    const transcriptText = simpleTurns.map(t => `${t.speaker === 'rep' ? 'Rep' : 'Homeowner'}: ${t.text}`).join('\n')

    // 4) AI analysis
    const aiJson = await analyzeWithOpenAI({
      transcript: transcriptText,
      homeownerName: homeownerName || 'Austin',
      homeownerProfile: homeownerProfile || 'Standard homeowner persona',
    })
    const ai = JSON.parse(aiJson)

    // 5) Calculate grade
    const grade = calculateGrade(ai)

    // 6) Determine outcome
    const outcome = (() => {
      const score = grade.total
      const persona = (homeownerName || 'homeowner').toLowerCase()
      const dur = basic.conversation_duration_seconds || 0
      if (persona.includes('decisive')) return score >= 70 && dur < 600 ? 'SUCCESS' : 'FAILURE'
      if (persona.includes('skeptical')) return score >= 120 ? 'SUCCESS' : 'FAILURE'
      if (persona.includes('budget')) return score >= 80 ? 'SUCCESS' : 'FAILURE'
      if (persona.includes('analytical')) return score >= 120 ? 'SUCCESS' : 'FAILURE'
      return score >= 70 ? 'SUCCESS' : 'FAILURE'
    })()

    // 7) Save to Supabase (sales_test_conversations)
    console.log('💾 Preparing to save to sales_test_conversations with userId:', userId)
    const insertPayload: any = {
      user_id: userId,
      conversation_id: conversationId,
      agent_id: agentId || null,
      outcome,
      sale_closed: outcome === 'SUCCESS',
      total_turns: basic.total_turns,
      conversation_duration_seconds: basic.conversation_duration_seconds,
      questions_asked_by_homeowner: basic.questions_asked_by_homeowner,
      homeowner_first_words: basic.homeowner_first_words,
      homeowner_final_words: basic.homeowner_final_words,
      homeowner_key_questions: basic.homeowner_key_questions,
      interruptions_count: basic.interruptions_count,
      filler_words_count: basic.filler_words_count,
      time_to_value_seconds: basic.time_to_value_seconds,
      close_attempted: basic.close_attempted,
      closing_technique: basic.closing_technique,
      objections_raised: basic.objections_raised,
      objections_resolved: basic.objections_resolved,
      rapport_score: basic.rapport_score,
      conversation_summary: ai.conversation_summary,
      what_worked: (ai.what_worked || []).join('\n'),
      what_failed: (ai.what_failed || []).join('\n'),
      key_learnings: (ai.key_learnings || []).join('\n'),
      homeowner_response_pattern: ai.homeowner_response_pattern,
      sales_rep_energy_level: ai.sales_rep_energy_level,
      sentiment_progression: ai.sentiment_progression,
      full_transcript: convo as any,
    }

    const { error: insertErr } = await (supabase as any)
      .from('sales_test_conversations')
      .insert(insertPayload)

    if (insertErr) {
      console.error('❌ Failed to save analysis to sales_test_conversations:', insertErr)
      console.error('❌ Error details:', JSON.stringify(insertErr, null, 2))
      return NextResponse.json({ 
        error: 'Failed to save analysis', 
        details: insertErr.message || insertErr,
        hint: insertErr.hint || 'Check Supabase logs for details'
      }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data: { basic, ai, grade, outcome } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


