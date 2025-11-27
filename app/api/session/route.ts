import { NextResponse } from 'next/server'
import { createServiceSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'
import { detectObjection as detectEnhancedObjection, detectTechnique as detectEnhancedTechnique } from '@/lib/trainer/enhancedPatternAnalyzer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// CREATE session
export async function POST(req: Request) {
  try {
    const { agent_name, agent_id, is_free_demo } = await req.json()
    
    // Get authenticated user (optional for free demo)
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Allow anonymous sessions for free demo
    const isAnonymous = !user && is_free_demo === true
    
    if (!user && !isAnonymous) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Create session with service role
    const serviceSupabase = await createServiceSupabaseClient()
    const sessionData: any = {
      user_id: user?.id || null, // null for anonymous free demo sessions
      agent_name: agent_name,
      started_at: new Date().toISOString(),
      is_free_demo: isAnonymous || false
    }
    
    // Add agent_id if provided
    if (agent_id) {
      sessionData.agent_id = agent_id
    }
    
    console.log('Creating session with data:', { 
      agent_name: sessionData.agent_name, 
      agent_id: sessionData.agent_id,
      is_free_demo: sessionData.is_free_demo,
      user_id: sessionData.user_id || 'null (anonymous)'
    })
    
    const { data, error } = await (serviceSupabase as any)
      .from('live_sessions')
      .insert(sessionData)
      .select('id')
      .single()
    
    if (error) {
      console.error('Session creation error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      console.error('Session data attempted:', JSON.stringify(sessionData, null, 2))
      return NextResponse.json({ 
        error: error.message || 'Failed to create session',
        details: error.details || error.hint || error.code
      }, { status: 500 })
    }
    
    return NextResponse.json({ id: data.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// UPDATE session (save transcript and scores)
export async function PATCH(req: Request) {
  try {
    const { id, transcript, duration_seconds, end_reason, agent_name, homeowner_name, agent_persona, voice_analysis } = await req.json()
    
    console.log('🔧 PATCH: Updating session:', id)
    console.log('📝 PATCH: Transcript lines:', transcript?.length || 0)
    console.log('📝 PATCH: Transcript type:', Array.isArray(transcript) ? 'array' : typeof transcript)
    console.log('📝 PATCH: Transcript is null/undefined:', transcript === null || transcript === undefined)
    console.log('⏱️ PATCH: Duration:', duration_seconds)
    if (end_reason) {
      console.log('📊 PATCH: End reason:', end_reason)
    }
    
    // WARNING: If transcript is empty, log it for debugging
    if (!transcript || (Array.isArray(transcript) && transcript.length === 0)) {
      console.warn('⚠️ WARNING: Empty transcript received! This may indicate a problem.')
      console.warn('⚠️ Session ID:', id)
      console.warn('⚠️ End reason:', end_reason)
    }
    
    const supabase = await createServiceSupabaseClient()
    
    const now = new Date().toISOString()
    // Get current session data from database (transcript saved incrementally, analytics may exist)
    const { data: currentSession, error: fetchError } = await (supabase as any)
      .from('live_sessions')
      .select('full_transcript, analytics, instant_metrics')
      .eq('id', id)
      .single()
    
    let finalTranscript = currentSession?.full_transcript || []
    
    // If transcript is provided in request, use it (backup/verification)
    // Otherwise, use what's already in the database
    if (transcript && Array.isArray(transcript) && transcript.length > 0) {
      console.log('📝 PATCH: Using provided transcript as backup/verification')
      const formattedTranscript = transcript.map((entry: any) => ({
        speaker: entry.speaker,
        text: entry.text || entry.message || '',
        timestamp: entry.timestamp ? new Date(entry.timestamp).toISOString() : new Date().toISOString()
      }))
      
      // Merge with database transcript (database is source of truth, but use provided if longer)
      if (formattedTranscript.length > finalTranscript.length) {
        console.log('📝 PATCH: Provided transcript is longer, using it')
        finalTranscript = formattedTranscript
      } else {
        console.log('📝 PATCH: Database transcript is longer or equal, keeping database version')
      }
    }
    
    console.log('📝 PATCH: Final transcript lines:', finalTranscript.length)
    if (finalTranscript.length > 0) {
      console.log('📝 PATCH: Final transcript sample:', finalTranscript[0])
    } else {
      console.warn('⚠️ PATCH: Final transcript is empty!')
    }

    // Handle analytics JSONB - merge voice_analysis if provided
    let analytics = currentSession?.analytics || {}
    const hadExistingAnalytics = !!currentSession?.analytics && Object.keys(currentSession.analytics).length > 0
    
    // Preserve existing voice_analysis if it exists
    const existingVoiceAnalysis = analytics.voice_analysis
    
    console.log('🎤 PATCH: Voice analysis check', {
      hasVoiceAnalysis: !!voice_analysis,
      hasExistingVoiceAnalysis: !!existingVoiceAnalysis,
      hadExistingAnalytics,
      existingAnalyticsKeys: currentSession?.analytics ? Object.keys(currentSession.analytics) : [],
      sessionId: id
    })
    
    if (voice_analysis) {
      // Validate voice_analysis has actual data (not just empty object)
      const hasValidVoiceData = voice_analysis && (
        typeof voice_analysis.avgWPM === 'number' ||
        typeof voice_analysis.totalFillerWords === 'number' ||
        typeof voice_analysis.avgPitch === 'number'
      )
      
      console.log('🎤 PATCH: Saving voice analysis data', {
        hasVoiceAnalysis: !!voice_analysis,
        hasValidVoiceData,
        voiceAnalysisKeys: Object.keys(voice_analysis || {}),
        avgWPM: voice_analysis?.avgWPM,
        totalFillerWords: voice_analysis?.totalFillerWords,
        hasPitchData: voice_analysis?.avgPitch > 0,
        sessionId: id
      })
      
      if (hasValidVoiceData) {
        analytics = {
          ...analytics,
          voice_analysis: voice_analysis
        }
        console.log('✅ Voice analysis merged into analytics object', {
          analyticsKeys: Object.keys(analytics),
          voiceAnalysisIncluded: !!analytics.voice_analysis
        })
      } else {
        console.warn('⚠️ PATCH: voice_analysis provided but appears to be empty/invalid, preserving existing if any')
        // Keep existing voice_analysis if we have one
        if (existingVoiceAnalysis) {
          analytics = {
            ...analytics,
            voice_analysis: existingVoiceAnalysis
          }
          console.log('✅ Preserved existing voice_analysis')
        }
      }
    } else {
      console.log('ℹ️ PATCH: No voice_analysis data provided in request')
      // Preserve existing voice_analysis if no new one provided
      if (existingVoiceAnalysis) {
        analytics = {
          ...analytics,
          voice_analysis: existingVoiceAnalysis
        }
        console.log('✅ Preserved existing voice_analysis (no new data provided)')
      }
    }
    
    // Build update object with all provided fields
    const updateData: any = {
      ended_at: now,
      duration_seconds: duration_seconds,
      full_transcript: finalTranscript,
      overall_score: null,
      sale_closed: false,
      virtual_earnings: 0,
      return_appointment: false
    }
    
    // CRITICAL: Always save analytics when voice_analysis is provided, or if we have existing analytics
    // This ensures voice_analysis is never lost
    if (voice_analysis) {
      // If voice_analysis is provided, ALWAYS save analytics (even if empty before)
      updateData.analytics = analytics
      console.log('✅ PATCH: Analytics will be saved (voice_analysis provided)', {
        analyticsKeys: Object.keys(analytics),
        voiceAnalysisIncluded: !!analytics.voice_analysis
      })
      
      // Also populate instant_metrics if we have transcript
      if (finalTranscript && Array.isArray(finalTranscript) && finalTranscript.length > 0) {
        // Calculate talk time ratio using character count (same as live session)
        let userCharCount = 0
        let homeownerCharCount = 0
        
        finalTranscript.forEach((entry: any) => {
          const charCount = (entry.text || '').length
          if (entry.speaker === 'user' || entry.speaker === 'rep') {
            userCharCount += charCount
          } else if (entry.speaker === 'homeowner' || entry.speaker === 'agent') {
            homeownerCharCount += charCount
          }
        })
        
        const totalChars = userCharCount + homeownerCharCount
        const conversationBalance = totalChars > 0 ? Math.round((userCharCount / totalChars) * 100) : 0
        
        // Calculate wordsPerMinute from transcript or use voice_analysis if available
        let wordsPerMinute = 0
        if (analytics.voice_analysis?.avgWPM) {
          wordsPerMinute = analytics.voice_analysis.avgWPM
        } else if (duration_seconds && duration_seconds > 0) {
          // Calculate WPM from transcript
          const repEntries = finalTranscript.filter((entry: any) => 
            entry.speaker === 'user' || entry.speaker === 'rep'
          )
          const totalWords = repEntries.reduce((sum: number, entry: any) => {
            const text = entry.text || entry.message || ''
            return sum + text.split(/\s+/).filter((word: string) => word.length > 0).length
          }, 0)
          const durationMinutes = duration_seconds / 60
          wordsPerMinute = Math.round(totalWords / durationMinutes)
        }
        
        // Get existing instant_metrics or create new
        const existingInstantMetrics = currentSession?.instant_metrics || {}
        
        // Calculate objections and techniques from transcript if not already saved
        let objectionCount = existingInstantMetrics.objectionCount
        let techniquesUsed = existingInstantMetrics.techniquesUsed || []
        
        if (finalTranscript && Array.isArray(finalTranscript) && finalTranscript.length > 0) {
          // Enhanced objection detection (uses enhancedPatternAnalyzer)
          function detectObjection(text: string): boolean {
            const enhanced = detectEnhancedObjection(text)
            return enhanced !== null
          }
          
          // Enhanced technique detection (uses enhancedPatternAnalyzer)
          function detectTechnique(text: string): string | null {
            // Try enhanced detection first
            const enhancedTechnique = detectEnhancedTechnique(text)
            if (enhancedTechnique) {
              return enhancedTechnique
            }
            
            // Fallback to legacy patterns
            const lowerText = text.toLowerCase()
            if (/^(what|how|why|when|where|tell me|can you explain)/i.test(text.trim())) {
              return 'Open-Ended Question'
            }
            
            const techniquePatterns = {
              feelFeltFound: ['i understand how you feel', 'i felt the same way', 'others have felt', 'i know how you feel', 'i felt that'],
              socialProof: ['other customers', 'neighbors', 'other homeowners', 'many customers', 'lots of people', 'others have'],
              urgency: ['limited time', 'today only', 'special offer', 'act now', 'don\'t wait', 'limited availability'],
              activeListening: ['i hear you', 'i understand', 'that makes sense', 'i see', 'got it', 'i get that', 'absolutely']
            }
            
            for (const [technique, patterns] of Object.entries(techniquePatterns)) {
              if (patterns.some(pattern => lowerText.includes(pattern))) {
                const formattedName = technique.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()
                return formattedName === 'Feel Felt Found' ? 'Feel-Felt-Found' : formattedName
              }
            }
            return null
          }
          
          // Count objections from homeowner/agent entries
          if (objectionCount === undefined) {
            const homeownerEntries = finalTranscript.filter((entry: any) => entry.speaker === 'homeowner' || entry.speaker === 'agent')
            objectionCount = homeownerEntries.filter((entry: any) => detectObjection(entry.text || '')).length
            console.log('✅ PATCH: Calculated objectionCount from transcript:', objectionCount)
          }
          
          // Detect techniques from user/rep entries
          if (!techniquesUsed || techniquesUsed.length === 0) {
            const techniquesSet = new Set<string>()
            const userEntries = finalTranscript.filter((entry: any) => entry.speaker === 'user' || entry.speaker === 'rep')
            userEntries.forEach((entry: any) => {
              const technique = detectTechnique(entry.text || '')
              if (technique) {
                techniquesSet.add(technique)
              }
            })
            techniquesUsed = Array.from(techniquesSet)
            console.log('✅ PATCH: Calculated techniquesUsed from transcript:', techniquesUsed)
          }
        }
        
        updateData.instant_metrics = {
          ...existingInstantMetrics,
          wordsPerMinute,
          conversationBalance,
          objectionCount: objectionCount !== undefined ? objectionCount : existingInstantMetrics.objectionCount,
          techniquesUsed: techniquesUsed.length > 0 ? techniquesUsed : existingInstantMetrics.techniquesUsed,
          // Preserve other existing instant metrics fields
          ...(existingInstantMetrics.closeAttempts !== undefined && { closeAttempts: existingInstantMetrics.closeAttempts }),
          ...(existingInstantMetrics.closeSuccessRate !== undefined && { closeSuccessRate: existingInstantMetrics.closeSuccessRate })
        }
        
        console.log('✅ PATCH: Instant metrics populated', {
          wordsPerMinute,
          conversationBalance,
          userCharCount,
          homeownerCharCount,
          totalChars,
          calculatedFromTranscript: !analytics.voice_analysis?.avgWPM
        })
      }
    } else if (hadExistingAnalytics) {
      // Preserve existing analytics even if no voice_analysis in this request
      updateData.analytics = analytics
      console.log('✅ PATCH: Analytics will be saved (preserving existing analytics)')
    } else {
      console.log('ℹ️ PATCH: No analytics to save (no voice_analysis and no existing analytics)')
    }
    
    // Add optional fields if provided
    if (agent_name) updateData.agent_name = agent_name
    if (homeowner_name) updateData.homeowner_name = homeowner_name
    if (agent_persona) updateData.agent_persona = agent_persona
    if (end_reason) updateData.end_reason = end_reason

    // Log what we're about to save
    console.log('💾 PATCH: About to save updateData', {
      hasAnalytics: !!updateData.analytics,
      analyticsKeys: updateData.analytics ? Object.keys(updateData.analytics) : [],
      hasVoiceAnalysis: updateData.analytics?.voice_analysis ? true : false,
      sessionId: id
    })
    
    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .update(updateData)
      .eq('id', id)
      .select('id, full_transcript, analytics')
      .single()
    
    if (error) {
      console.error('❌ PATCH: Update failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Verify the transcript was actually saved
    const savedTranscript = data.full_transcript
    const savedAnalytics = data.analytics
    
    console.log('✅ PATCH: Session updated successfully:', {
      id: data.id,
      transcriptSaved: !!savedTranscript,
      transcriptLength: Array.isArray(savedTranscript) ? savedTranscript.length : 0,
      analyticsSaved: !!savedAnalytics,
      analyticsKeys: savedAnalytics ? Object.keys(savedAnalytics) : [],
      voiceAnalysisSaved: savedAnalytics?.voice_analysis ? true : false
    })
    
    if (!savedTranscript || (Array.isArray(savedTranscript) && savedTranscript.length === 0)) {
      console.error('❌ CRITICAL: Transcript was NOT saved to database!', {
        sessionId: id,
        updateDataTranscriptLength: finalTranscript.length,
        savedTranscriptLength: Array.isArray(savedTranscript) ? savedTranscript.length : 'N/A'
      })
    }
    
    // Verify voice_analysis was saved if it was provided
    if (voice_analysis && !savedAnalytics?.voice_analysis) {
      console.error('❌ CRITICAL: voice_analysis was provided but NOT saved to database!', {
        sessionId: id,
        voiceAnalysisKeys: Object.keys(voice_analysis || {}),
        savedAnalyticsKeys: savedAnalytics ? Object.keys(savedAnalytics) : []
      })
    } else if (voice_analysis && savedAnalytics?.voice_analysis) {
      console.log('✅ PATCH: voice_analysis confirmed saved in database', {
        sessionId: id,
        avgWPM: savedAnalytics.voice_analysis?.avgWPM,
        totalFillerWords: savedAnalytics.voice_analysis?.totalFillerWords
      })
    }
    
    return NextResponse.json({ 
      id: data.id,
      analytics: savedAnalytics // Include analytics in response so client can verify
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET session by ID
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    const supabase = await createServiceSupabaseClient()
    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !data) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    // Debug logging for voice_analysis
    console.log('🔍 GET: Session data retrieved', {
      sessionId: id,
      hasAnalytics: !!data.analytics,
      analyticsType: typeof data.analytics,
      analyticsKeys: data.analytics ? Object.keys(data.analytics) : [],
      hasVoiceAnalysis: !!data.analytics?.voice_analysis,
      voiceAnalysisKeys: data.analytics?.voice_analysis ? Object.keys(data.analytics.voice_analysis) : [],
      voiceAnalysisSample: data.analytics?.voice_analysis ? {
        avgWPM: data.analytics.voice_analysis.avgWPM,
        totalFillerWords: data.analytics.voice_analysis.totalFillerWords,
        hasPitchData: data.analytics.voice_analysis.avgPitch > 0
      } : null
    })
    
    // Add caching headers for GET requests
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE session by ID (owner only)
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Verify user
    const server = await createServerSupabaseClient()
    const { data: { user } } = await server.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = await createServiceSupabaseClient()
    // Ensure ownership
    const { data: session, error: fetchErr } = await (supabase as any)
      .from('live_sessions')
      .select('id,user_id')
      .eq('id', id)
      .single()
    if (fetchErr || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await (supabase as any)
      .from('live_sessions')
      .delete()
      .eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
