export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { searchScripts } from '@/lib/coach/rag-retrieval'
import { generateSuggestion, CoachAgentContext } from '@/lib/coach/coach-agent'
import { getOrGenerateSpecialization } from '@/lib/coach/specialization-manager'

export async function POST(request: NextRequest) {
  let homeownerText = '' // Declare at function scope for error handler
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, homeownerText: bodyHomeownerText, conversationContext, transcript } = body
    homeownerText = bodyHomeownerText || ''

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

    const sessionData = session as { id: string; user_id: string; coach_mode_enabled: boolean }

    if (sessionData.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if coach mode is enabled for this session
    if (!sessionData.coach_mode_enabled) {
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

    const userProfileData = userProfile as { organization_id: string | null; team_id: string | null; full_name: string | null }

    // TEMPORARILY DISABLED: Specialization disabled to perfect base coach agent first
    // Fetch company name and scripts in parallel (after we have user profile)
    const [companyResult, scriptsResult] = await Promise.all([
      userProfileData.team_id
        ? supabase
            .from('team_grading_configs')
            .select('company_name')
            .eq('team_id', userProfileData.team_id)
            .single()
        : Promise.resolve({ data: null, error: null }),
      (async () => {
        let query = supabase
          .from('knowledge_base')
          .select('id, content, file_name, chunks')
          .eq('is_coaching_script', true)
          .eq('is_active', true)

        if (userProfileData.organization_id) {
          query = query.contains('metadata', { organization_id: userProfileData.organization_id })
        } else if (userProfileData.team_id) {
          query = query.contains('metadata', { team_id: userProfileData.team_id })
        }

        return query
      })()
      // TODO: Re-enable specialization after base coach agent is perfected
      // userProfileData.team_id
      //   ? getOrGenerateSpecialization(userProfileData.team_id).catch(err => {
      //       console.error('Error getting specialization:', err)
      //       return '' // Return empty string on error - base prompt will work
      //     })
      //   : Promise.resolve('')
    ])
    
    // Temporarily set specialization to empty
    const specialization = ''

    const companyName = (companyResult.data as { company_name?: string } | null)?.company_name
    const { data: scripts, error: scriptsError } = scriptsResult as { data: Array<{ id: string; content: string | null; file_name: string; chunks: any }> | null; error: any }

    if (scriptsError) {
      console.error('Error fetching scripts:', scriptsError)
      return NextResponse.json({ error: 'Failed to fetch coaching scripts' }, { status: 500 })
    }

    if (!scripts || scripts.length === 0) {
      // Generate contextual fallback even without scripts
      const fallbackResponses: Record<string, string> = {
        'not interested': 'Gotcha. What made you say that?',
        'already have': 'Oh nice. How long you been with them?',
        'too expensive': 'Fair. What are you paying now?',
        'think about it': 'Sure. What specifically are you thinking about?',
        'busy': 'No worries. When would be better?'
      }
      
      const lowerText = homeownerText.toLowerCase()
      let fallback = 'Gotcha. What do you think?'
      
      for (const [key, response] of Object.entries(fallbackResponses)) {
        if (lowerText.includes(key)) {
          fallback = response
          break
        }
      }
      
      return NextResponse.json({
        error: 'No coaching scripts found for your team',
        suggestedLine: fallback
      }, { status: 404 })
    }

    // Convert scripts to format expected by RAG retrieval
    // Include cached chunks if available
    const scriptDocuments = (scripts || []).map((script: any) => ({
      id: script.id,
      content: script.content || '',
      file_name: script.file_name,
      chunks: script.chunks || undefined
    }))

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

    // Perform RAG retrieval - reduced to 1 section for maximum speed
    const relevantSections = searchScripts(homeownerText, scriptDocuments, 1)

    if (relevantSections.length === 0) {
      // Generate contextual fallback based on homeowner's text
      const lowerText = homeownerText.toLowerCase()
      let fallback = 'Gotcha. What do you think?'
      
      if (lowerText.includes('not interested') || lowerText.includes('not looking')) {
        fallback = 'Gotcha. What made you say that?'
      } else if (lowerText.includes('already have') || lowerText.includes('already got')) {
        fallback = 'Oh nice. How long you been with them?'
      } else if (lowerText.includes('too expensive') || lowerText.includes('cost')) {
        fallback = 'Fair. What are you paying now?'
      } else if (lowerText.includes('think about it')) {
        fallback = 'Sure. What specifically are you thinking about?'
      } else if (lowerText.includes('busy') || lowerText.includes('not a good time')) {
        fallback = 'No worries. When would be better?'
      } else if (lowerText.includes('?')) {
        fallback = 'Good question. Let me explain.'
      }
      
      return NextResponse.json({
        suggestedLine: fallback
      })
    }

    // Generate suggestion using coach agent
    const coachContext: CoachAgentContext = {
      homeownerText,
      repLastStatement,
      conversationHistory,
      scriptSections: relevantSections,
      companyName,
      repName: userProfileData.full_name || undefined,
      specialization: specialization || undefined
    }

    const suggestion = await generateSuggestion(coachContext)

    // Save suggestion to session (non-blocking)
    const { data: currentSession } = await supabase
      .from('live_sessions')
      .select('coaching_suggestions')
      .eq('id', sessionId)
      .single()

    const sessionWithSuggestions = currentSession as { coaching_suggestions?: any[] } | null
    const existingSuggestions = Array.isArray(sessionWithSuggestions?.coaching_suggestions)
      ? sessionWithSuggestions.coaching_suggestions
      : []

    const newSuggestion = {
      timestamp: new Date().toISOString(),
      homeowner_text: homeownerText,
      suggested_line: suggestion.suggestedLine
    }

    const updatedSuggestions = [...existingSuggestions, newSuggestion]

    // Save suggestion to session (non-blocking)
    supabase
      .from('live_sessions')
      .update({ coaching_suggestions: updatedSuggestions } as any)
      .eq('id', sessionId)
      .then((result: any) => {
        if (result?.error) {
          console.error('Error saving suggestion to session:', result.error)
        }
      })
      .catch((err: any) => {
        console.error('Error saving suggestion:', err)
      })

    return NextResponse.json({
      success: true,
      ...suggestion
    })
  } catch (error: any) {
    console.error('Error in coach suggest:', error)
    // Generate contextual fallback even on error
    const lowerText = (homeownerText || '').toLowerCase()
    let fallback = 'Gotcha. What do you think?'
    
    if (lowerText.includes('not interested')) {
      fallback = 'Gotcha. What made you say that?'
    } else if (lowerText.includes('already have')) {
      fallback = 'Oh nice. How long you been with them?'
    } else if (lowerText.includes('too expensive')) {
      fallback = 'Fair. What are you paying now?'
    } else if (lowerText.includes('?')) {
      fallback = 'Good question. Let me explain.'
    }
    
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
      suggestedLine: fallback
    }, { status: 500 })
  }
}
