export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateSuggestion, CoachAgentContext } from '@/lib/coach/coach-agent'

// ARCHIVED: Live coaching feature temporarily disabled
// ARCHIVED: Live coaching feature temporarily disabled
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Live coaching feature has been temporarily archived' },
    { status: 410 } // Gone
  )
}

// ARCHIVED CODE BELOW - Keep for future re-enablement
/*
export async function POST_ARCHIVED(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, homeownerText, conversationContext, transcript } = body

    if (!sessionId || !homeownerText) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId and homeownerText' },
        { status: 400 }
      )
    }

    // Verify session exists and belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select('id, user_id, coach_mode_enabled')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if coach mode is enabled for this session
    if (!session.coach_mode_enabled) {
      return NextResponse.json(
        { error: 'Coach mode is not enabled for this session' },
        { status: 400 }
      )
    }

    // Get user profile for rep name and company name
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('team_id, full_name')
      .eq('id', user.id)
      .single()

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Fetch company name if team_id exists
    let companyName: string | undefined
    if (userProfile.team_id) {
      const { data: companyResult } = await supabase
        .from('team_grading_configs')
        .select('company_name')
        .eq('team_id', userProfile.team_id)
        .single()
      
      companyName = companyResult?.company_name
    }

    // Extract rep's last statement from transcript
    const repLastStatement = transcript
      ?.filter((entry: any) => entry.speaker === 'user' || entry.speaker === 'rep')
      ?.slice(-1)[0]?.text

    // Format conversation history (last 10 exchanges)
    const conversationHistory = transcript
      ?.slice(-10)
      ?.map((entry: any) => ({
        speaker: entry.speaker || entry.role || 'unknown',
        text: entry.text || entry.content || entry.message || ''
      }))
      .filter((entry: any) => entry.text && entry.text.trim().length > 0)

    // Generate suggestion using coach agent with only live context
    const coachContext: CoachAgentContext = {
      homeownerText,
      repLastStatement,
      conversationHistory,
      companyName,
      repName: userProfile.full_name || undefined
    }

    const suggestion = await generateSuggestion(coachContext)

    // Save suggestion to session (non-blocking)
    const { data: currentSession } = await supabase
      .from('live_sessions')
      .select('coaching_suggestions')
      .eq('id', sessionId)
      .single()

    const existingSuggestions = Array.isArray(currentSession?.coaching_suggestions)
      ? currentSession.coaching_suggestions
      : []

    const newSuggestion = {
      timestamp: new Date().toISOString(),
      homeowner_text: homeownerText,
      suggested_line: suggestion.suggestedLine
    }

    const updatedSuggestions = [...existingSuggestions, newSuggestion]

    supabase
      .from('live_sessions')
      .update({ coaching_suggestions: updatedSuggestions })
      .eq('id', sessionId)
      .then((result: any) => {
        if (result?.error) {
          console.error('Error saving suggestion to session:', result.error)
        }
      })

    return NextResponse.json({
      success: true,
      ...suggestion
    })
  } catch (error: any) {
    console.error('Error in coach suggest:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
      suggestedLine: 'Continue the conversation naturally.'
    }, { status: 500 })
  }
}
*/
