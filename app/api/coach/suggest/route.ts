export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { searchScripts, classifyIntent } from '@/lib/coach/rag-retrieval'
import { generateSuggestion, CoachAgentContext, CoachState } from '@/lib/coach/coach-agent'

export async function POST(request: NextRequest) {
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

    // Get user profile first (needed for subsequent queries)
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('organization_id, team_id, full_name')
      .eq('id', user.id)
      .single()

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Fetch company name and scripts in parallel (after we have user profile)
    const [companyResult, scriptsResult] = await Promise.all([
      userProfile.team_id
        ? supabase
            .from('team_grading_configs')
            .select('company_name')
            .eq('team_id', userProfile.team_id)
            .single()
        : Promise.resolve({ data: null, error: null }),
      (async () => {
        let query = supabase
          .from('knowledge_base')
          .select('id, content, file_name, chunks')
          .eq('is_coaching_script', true)
          .eq('is_active', true)

        if (userProfile.organization_id) {
          query = query.contains('metadata', { organization_id: userProfile.organization_id })
        } else if (userProfile.team_id) {
          query = query.contains('metadata', { team_id: userProfile.team_id })
        }

        return query
      })()
    ])

    const companyName = companyResult.data?.company_name
    const { data: scripts, error: scriptsError } = scriptsResult

    if (scriptsError) {
      console.error('Error fetching scripts:', scriptsError)
      return NextResponse.json({ error: 'Failed to fetch coaching scripts' }, { status: 500 })
    }

    if (!scripts || scripts.length === 0) {
      return NextResponse.json({
        error: 'No coaching scripts found for your team',
        suggestedLine: 'No script available. Continue the conversation naturally.',
        confidence: 'low'
      }, { status: 404 })
    }

    // Convert scripts to format expected by RAG retrieval
    // Include cached chunks if available
    const scriptDocuments = scripts.map(script => ({
      id: script.id,
      content: script.content || '',
      file_name: script.file_name,
      chunks: script.chunks || undefined
    }))

    // Extract rep's last statement from transcript
    const repLastStatement = transcript
      ?.filter((entry: any) => entry.speaker === 'user' || entry.speaker === 'rep')
      ?.slice(-1)[0]?.text

    // Format conversation history (last 10 exchanges) to prevent context loss
    const conversationHistory = transcript
      ?.slice(-10)
      ?.map((entry: any) => ({
        speaker: entry.speaker || entry.role || 'unknown',
        text: entry.text || entry.content || entry.message || ''
      }))
      .filter((entry: any) => entry.text && entry.text.trim().length > 0)

    // Build CoachState from session history
    const { data: currentSession } = await supabase
      .from('live_sessions')
      .select('coaching_suggestions')
      .eq('id', sessionId)
      .single()

    const existingSuggestions = Array.isArray(currentSession?.coaching_suggestions)
      ? currentSession.coaching_suggestions
      : []

    // Extract state from history
    const suggestedLines = existingSuggestions
      .map((s: any) => s.suggested_line)
      .filter((line: string) => line && line.trim().length > 0)

    const addressedObjections = existingSuggestions
      .map((s: any) => {
        // Try to infer objection from homeowner text
        if (s.homeowner_text) {
          const intent = classifyIntent(s.homeowner_text)
          if (intent.type.includes('objection') || intent.type === 'brush_off' || intent.type === 'stall') {
            return intent.type
          }
        }
        return null
      })
      .filter((obj: string | null) => obj !== null)

    const askedQuestions = conversationHistory
      ?.filter((entry: any) => {
        const text = entry.text.toLowerCase()
        return (entry.speaker === 'user' || entry.speaker === 'rep') &&
               text.includes('?') &&
               /(what|how|tell me|experience|deal with|see|notice|concern|problem|issue|current|situation)/i.test(text)
      })
      .map((entry: any) => entry.text) || []

    const coachState: CoachState = {
      suggestedLines,
      addressedObjections: Array.from(new Set(addressedObjections)),
      askedQuestions: Array.from(new Set(askedQuestions))
    }

    // Perform RAG retrieval - reduced to 2 sections for speed
    const relevantSections = searchScripts(homeownerText, scriptDocuments, 2)

    if (relevantSections.length === 0) {
      return NextResponse.json({
        suggestedLine: 'Continue the conversation naturally based on the script.',
        explanation: 'No relevant script sections found for this context.',
        confidence: 'low'
      })
    }

    // Generate suggestion using coach agent with conversation history and state
    const coachContext: CoachAgentContext = {
      homeownerText,
      repLastStatement,
      conversationHistory,
      scriptSections: relevantSections,
      companyName,
      repName: userProfile.full_name || undefined,
      coachState
    }

    const suggestion = await generateSuggestion(coachContext)

    // Save suggestion to session (non-blocking)
    const newSuggestion = {
      timestamp: new Date().toISOString(),
      homeowner_text: homeownerText,
      suggested_line: suggestion.suggestedLine,
      explanation: suggestion.explanation,
      confidence: suggestion.confidence,
      intent: suggestion.intent
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
      suggestedLine: 'Continue the conversation naturally.',
      confidence: 'low'
    }, { status: 500 })
  }
}
