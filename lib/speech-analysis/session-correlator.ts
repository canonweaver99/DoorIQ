import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

interface ConversationData {
  conversation_id: string
  agent_id: string
  created_at?: string
  started_at?: string
  metadata?: {
    started_at?: string
    ended_at?: string
  }
}

interface SessionMatch {
  session_id: string
  user_id: string
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Correlates ElevenLabs conversations with DoorIQ sessions
 * Uses agent_id + timestamp window matching (±5 minutes)
 */
export class SessionCorrelator {
  private async getSupabase() {
    return await createServiceSupabaseClient()
  }

  /**
   * Match an ElevenLabs conversation to a DoorIQ session
   * @param conversationData - Conversation data from webhook
   * @returns Matched session_id or null
   */
  async correlateConversationToSession(
    conversationData: ConversationData
  ): Promise<SessionMatch | null> {
    const supabase = await this.getSupabase()

    try {
      const { conversation_id, agent_id } = conversationData

      // Get conversation timestamp (prefer metadata.started_at, fallback to created_at)
      const conversationStartTime = conversationData.metadata?.started_at 
        ? new Date(conversationData.metadata.started_at)
        : conversationData.created_at 
        ? new Date(conversationData.created_at)
        : new Date()

      // Search window: ±5 minutes
      const windowMinutes = 5
      const searchStart = new Date(conversationStartTime.getTime() - windowMinutes * 60 * 1000)
      const searchEnd = new Date(conversationStartTime.getTime() + windowMinutes * 60 * 1000)

      logger.info('Correlating conversation to session', {
        conversation_id,
        agent_id,
        conversationStartTime: conversationStartTime.toISOString(),
        searchWindow: {
          start: searchStart.toISOString(),
          end: searchEnd.toISOString()
        }
      })

      // Find matching sessions by agent_id and timestamp
      const { data: sessions, error } = await supabase
        .from('live_sessions')
        .select('id, user_id, started_at, agent_id')
        .eq('agent_id', agent_id)
        .gte('started_at', searchStart.toISOString())
        .lte('started_at', searchEnd.toISOString())
        .order('started_at', { ascending: false })
        .limit(10)

      if (error) {
        logger.error('Error querying sessions for correlation', error)
        return null
      }

      if (!sessions || sessions.length === 0) {
        logger.warn('No matching sessions found for conversation', {
          conversation_id,
          agent_id,
          searchWindow: {
            start: searchStart.toISOString(),
            end: searchEnd.toISOString()
          }
        })
        return null
      }

      // If multiple matches, use the closest timestamp
      let bestMatch = sessions[0]
      let minTimeDiff = Math.abs(
        new Date(sessions[0].started_at).getTime() - conversationStartTime.getTime()
      )

      for (const session of sessions.slice(1)) {
        const timeDiff = Math.abs(
          new Date(session.started_at).getTime() - conversationStartTime.getTime()
        )
        if (timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff
          bestMatch = session
        }
      }

      // Determine confidence level
      const timeDiffMinutes = minTimeDiff / (60 * 1000)
      let confidence: 'high' | 'medium' | 'low' = 'low'
      if (timeDiffMinutes < 1) {
        confidence = 'high'
      } else if (timeDiffMinutes < 3) {
        confidence = 'medium'
      }

      logger.info('Found session match', {
        conversation_id,
        session_id: bestMatch.id,
        user_id: bestMatch.user_id,
        confidence,
        timeDiffMinutes: timeDiffMinutes.toFixed(2)
      })

      return {
        session_id: bestMatch.id,
        user_id: bestMatch.user_id,
        confidence
      }
    } catch (error) {
      logger.error('Error in session correlation', error)
      return null
    }
  }

  /**
   * Update live_sessions with conversation_id after correlation
   */
  async updateSessionWithConversationId(
    sessionId: string,
    conversationId: string
  ): Promise<boolean> {
    const supabase = await this.getSupabase()

    try {
      const { error } = await supabase
        .from('live_sessions')
        .update({ conversation_id: conversationId })
        .eq('id', sessionId)

      if (error) {
        logger.error('Error updating session with conversation_id', error)
        return false
      }

      logger.info('Updated session with conversation_id', {
        session_id: sessionId,
        conversation_id: conversationId
      })

      return true
    } catch (error) {
      logger.error('Error updating session', error)
      return false
    }
  }

  /**
   * Update elevenlabs_conversations with session_id after correlation
   */
  async updateConversationWithSessionId(
    conversationId: string,
    sessionId: string,
    userId: string
  ): Promise<boolean> {
    const supabase = await this.getSupabase()

    try {
      const { error } = await supabase
        .from('elevenlabs_conversations')
        .update({ 
          session_id: sessionId,
          user_id: userId
        })
        .eq('conversation_id', conversationId)

      if (error) {
        logger.error('Error updating conversation with session_id', error)
        return false
      }

      logger.info('Updated conversation with session_id', {
        conversation_id: conversationId,
        session_id: sessionId,
        user_id: userId
      })

      return true
    } catch (error) {
      logger.error('Error updating conversation', error)
      return false
    }
  }
}

