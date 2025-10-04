import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { analyzeConversation } from '@/lib/trainer/conversationAnalyzer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { conversationId, sessionId } = await request.json()
    const supabase = await createServiceSupabaseClient()

    // Prefer session if provided; otherwise try conversationId (best-effort)
    let transcript: any[] = []
    if (sessionId) {
      const { data } = await (supabase as any)
        .from('live_sessions')
        .select('full_transcript')
        .eq('id', sessionId)
        .single()
      transcript = (data as any)?.full_transcript || []
    }

    if (!Array.isArray(transcript) || transcript.length === 0) {
      // Try conversationId lookup if we have one and storage schema supports it
      if (conversationId) {
        try {
          const { data } = await (supabase as any)
            .from('live_sessions')
            .select('full_transcript')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
          transcript = (data as any)?.full_transcript || []
        } catch {}
      }
    }

    if (!Array.isArray(transcript) || transcript.length === 0) {
      return NextResponse.json({ error: 'No transcript found' }, { status: 404 })
    }

    const analysis = analyzeConversation(transcript)
    
    // Minimal transformation to match existing ConversationAnalysis component expectations
    const result = {
      basic: {
        total_turns: transcript.length,
        conversation_duration_seconds: null,
        questions_asked_by_homeowner: transcript.filter(t => t.speaker !== 'user' && t.text.includes('?')).length,
        objections_raised: transcript.filter(t => (t.speaker !== 'user') && /(expensive|not interested|busy|think about it|cant)/i.test(t.text)).length,
        objections_resolved: analysis.keyMoments.objectionHandled ? 1 : 0,
        interruptions_count: 0,
        filler_words_count: analysis.advancedMetrics?.linguisticAnalysis?.fillerWordCount || 0,
        rapport_score: analysis.scores.rapport,
        close_attempted: analysis.keyMoments.closeAttempted,
        homeowner_key_questions: [] as string[]
      },
      ai: {
        sentiment_progression: '',
        what_worked: analysis.feedback.strengths,
        what_failed: analysis.feedback.improvements,
        key_learnings: analysis.feedback.specificTips
      },
      grade: {
        total: analysis.overallScore,
        letter: analysis.overallScore >= 90 ? 'A' : analysis.overallScore >= 80 ? 'B' : analysis.overallScore >= 70 ? 'C' : analysis.overallScore >= 60 ? 'D' : 'F',
        pass: analysis.overallScore >= 70
      }
    }

    return NextResponse.json({ data: result })
  } catch (error: any) {
    console.error('Grade conversation error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to grade conversation' }, { status: 500 })
  }
}


