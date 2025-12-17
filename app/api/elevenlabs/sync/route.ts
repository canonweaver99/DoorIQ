import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export const maxDuration = 30

// Find matching conversation by time window
function findMatchingConversation(
  conversations: any[],
  sessionStartTime: string,
  sessionEndTime: string | null
): any | null {
  if (!conversations || conversations.length === 0) return null
  
  const sessionStart = new Date(sessionStartTime).getTime()
  const sessionEnd = sessionEndTime ? new Date(sessionEndTime).getTime() : Date.now()
  
  // Find conversation that overlaps with session time window (±5 minutes)
  const windowMinutes = 5
  const searchStart = sessionStart - (windowMinutes * 60 * 1000)
  const searchEnd = (sessionEnd || sessionStart) + (windowMinutes * 60 * 1000)
  
  for (const convo of conversations) {
    const convoStart = convo.created_at ? new Date(convo.created_at).getTime() : null
    const convoEnd = convo.ended_at ? new Date(convo.ended_at).getTime() : null
    
    if (!convoStart) continue
    
    // Check if conversation overlaps with session window
    if (convoStart >= searchStart && convoStart <= searchEnd) {
      return convo
    }
    
    // Also check if conversation end overlaps
    if (convoEnd && convoEnd >= searchStart && convoEnd <= searchEnd) {
      return convo
    }
  }
  
  return null
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, agentId } = await req.json()
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 400 })
    }
    
    const supabase = await createServiceSupabaseClient()
    
    // Step 1: Get session data
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    if (sessionError || !session) {
      logger.error('Session not found for sync', { sessionId, error: sessionError })
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    // Step 2: Try to fetch from ElevenLabs API if we have API key
    // Note: This requires ElevenLabs API access - if not available, try database lookup
    let matchingConvo = null
    
    if (process.env.ELEVEN_LABS_API_KEY) {
      try {
        // List recent conversations from ElevenLabs API
        const response = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${agentId}&limit=20`,
          {
            headers: {
              'xi-api-key': process.env.ELEVEN_LABS_API_KEY
            }
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          const conversations = data.conversations || []
          
          // Find matching conversation by time window
          matchingConvo = findMatchingConversation(
            conversations,
            session.started_at || session.created_at,
            session.ended_at
          )
        } else {
          logger.warn('Failed to fetch conversations from ElevenLabs API', {
            status: response.status,
            agentId
          })
        }
      } catch (error: any) {
        logger.warn('Error fetching from ElevenLabs API, trying database lookup', error)
      }
    }
    
    // Step 3: If no API match, try database lookup
    if (!matchingConvo) {
      const { data: conversations, error: dbError } = await supabase
        .from('elevenlabs_conversations')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (!dbError && conversations) {
        matchingConvo = findMatchingConversation(
          conversations,
          session.started_at || session.created_at,
          session.ended_at
        )
      }
    }
    
    if (matchingConvo) {
      // Step 4: Get full conversation details
      let convoDetails = matchingConvo
      
      // If we have conversation_id but not full details, try to fetch from database
      if (matchingConvo.conversation_id && !matchingConvo.transcript) {
        const { data: fullConvo, error: fetchError } = await supabase
          .from('elevenlabs_conversations')
          .select('*')
          .eq('conversation_id', matchingConvo.conversation_id)
          .single()
        
        if (!fetchError && fullConvo) {
          convoDetails = fullConvo
        }
      }
      
      // Step 5: Extract valuable metrics
      const elevenLabsMetrics = {
        conversation_id: convoDetails.conversation_id || matchingConvo.conversation_id,
        duration: convoDetails.duration_seconds || matchingConvo.duration_seconds || null,
        message_count: convoDetails.message_count || matchingConvo.message_count || 0,
        analysis: convoDetails.analysis || matchingConvo.analysis || null,
        metadata: convoDetails.metadata || matchingConvo.metadata || null,
        transcript_backup: convoDetails.transcript || matchingConvo.transcript || null,
        sentiment_progression: convoDetails.analysis?.sentiment_progression || 
                              convoDetails.metadata?.sentiment_progression || [],
        interruption_count: convoDetails.metadata?.interruptions_count || 0,
        audio_quality: convoDetails.metadata?.audio_quality || 85
      }
      
      // Step 6: Update session with ElevenLabs data
      const { error: updateError } = await supabase
        .from('live_sessions')
        .update({
          elevenlabs_conversation_id: elevenLabsMetrics.conversation_id,
          elevenlabs_metrics: elevenLabsMetrics
        })
        .eq('id', sessionId)
      
      if (updateError) {
        logger.error('Error updating session with ElevenLabs data', updateError)
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
      }
      
      logger.info('Successfully synced ElevenLabs conversation', {
        sessionId,
        conversationId: elevenLabsMetrics.conversation_id
      })
      
      return NextResponse.json({ 
        synced: true, 
        conversationId: elevenLabsMetrics.conversation_id,
        metrics: elevenLabsMetrics
      })
    } else {
      logger.info('No matching ElevenLabs conversation found', {
        sessionId,
        agentId,
        sessionStart: session.started_at || session.created_at
      })
      
      return NextResponse.json({ 
        synced: false,
        message: 'No matching conversation found in time window'
      })
    }
  } catch (error: any) {
    logger.error('ElevenLabs sync failed', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync ElevenLabs data' },
      { status: 500 }
    )
  }
}

