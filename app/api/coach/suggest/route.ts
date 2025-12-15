export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { searchScripts, formatSectionsForPrompt, analyzeConversation } from '@/lib/coach/rag-retrieval'
import { generateSuggestion, CoachAgentContext } from '@/lib/coach/coach-agent'

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

    // Get user's organization/team and full name
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id, team_id, full_name')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Fetch team grading config (company info and pricing tables)
    let companyInfo = null
    let pricingInfo = null
    
    if (userProfile.team_id) {
      const { data: config } = await supabase
        .from('team_grading_configs')
        .select('company_name, company_mission, product_description, service_guarantees, company_values, pricing_info')
        .eq('team_id', userProfile.team_id)
        .single()
      
      if (config) {
        companyInfo = {
          company_name: config.company_name || '',
          company_mission: config.company_mission || '',
          product_description: config.product_description || '',
          service_guarantees: config.service_guarantees || '',
          company_values: config.company_values || []
        }
        pricingInfo = config.pricing_info || []
      }
    }

    // Fetch active coaching scripts for the organization/team
    let query = supabase
      .from('knowledge_base')
      .select('id, content, file_name')
      .eq('is_coaching_script', true)
      .eq('is_active', true)

    // Filter by organization_id or team_id from metadata
    if (userProfile.organization_id) {
      query = query.contains('metadata', { organization_id: userProfile.organization_id })
    } else if (userProfile.team_id) {
      query = query.contains('metadata', { team_id: userProfile.team_id })
    }

    const { data: scripts, error: scriptsError } = await query

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
    const scriptDocuments = scripts.map(script => ({
      id: script.id,
      content: script.content || '',
      file_name: script.file_name
    }))

    // Perform RAG retrieval
    const relevantSections = searchScripts(homeownerText, scriptDocuments, 5)

    if (relevantSections.length === 0) {
      return NextResponse.json({
        suggestedLine: 'Continue the conversation naturally based on the script.',
        explanation: 'No relevant script sections found for this context.',
        confidence: 'low'
      })
    }

    // Prepare transcript for coach agent
    const transcriptEntries = transcript || []
    const formattedTranscript = transcriptEntries.map((entry: any) => ({
      speaker: entry.speaker || entry.role || 'unknown',
      text: entry.text || entry.content || entry.message || '',
      timestamp: entry.timestamp
    }))

    // Analyze conversation for enhanced context
    const conversationAnalysis = analyzeConversation(formattedTranscript)

    // Generate suggestion using coach agent with enhanced context
    const coachContext: CoachAgentContext = {
      homeownerText,
      transcript: formattedTranscript,
      scriptSections: relevantSections,
      conversationAnalysis,
      companyInfo,
      pricingInfo,
      repName: userProfile.full_name || ''
    }

    const suggestion = await generateSuggestion(coachContext)

    // Save suggestion to session's coaching_suggestions array
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
      suggested_line: suggestion.suggestedLine,
      explanation: suggestion.explanation,
      script_section: suggestion.scriptSection,
      confidence: suggestion.confidence
    }

    const updatedSuggestions = [...existingSuggestions, newSuggestion]

    // Update session with new suggestion (non-blocking)
    supabase
      .from('live_sessions')
      .update({ coaching_suggestions: updatedSuggestions })
      .eq('id', sessionId)
      .then(({ error }) => {
        if (error) {
          console.error('Error saving suggestion to session:', error)
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
