import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { SessionCorrelator } from '@/lib/speech-analysis/session-correlator'
import { logger } from '@/lib/logger'

const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET

/**
 * POST /api/elevenlabs/webhook
 * Handle ElevenLabs webhook events for conversation completion
 * 
 * Webhook URL: https://yourdomain.com/api/elevenlabs/webhook
 * Configure in ElevenLabs dashboard with events: conversation.completed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-elevenlabs-signature')

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex')

      if (signature !== expectedSignature) {
        logger.warn('Invalid webhook signature', {
          received: signature.substring(0, 10) + '...',
          expected: expectedSignature.substring(0, 10) + '...'
        })
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    } else if (!webhookSecret) {
      logger.warn('ELEVENLABS_WEBHOOK_SECRET not configured - accepting webhook without signature verification')
    }

    const data = JSON.parse(body)
    
    logger.info('Received ElevenLabs webhook', {
      type: data.type || 'unknown',
      conversation_id: data.conversation_id,
      agent_id: data.agent_id
    })

    // Handle different webhook types
    // Based on ElevenLabs docs: transcription webhooks contain full conversation data
    if (data.type === 'conversation.completed' || data.transcript) {
      await handleConversationCompleted(data)
    } else if (data.type === 'conversation.analyzed') {
      await handleConversationAnalyzed(data)
    } else if (data.type === 'call.initiation.failure') {
      await handleCallInitiationFailure(data)
    } else {
      logger.warn('Unknown webhook type', { type: data.type, data })
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    logger.error('Error processing ElevenLabs webhook', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

/**
 * Handle conversation.completed webhook (transcription webhook)
 * Stores full conversation data including transcript, metadata, and analysis
 */
async function handleConversationCompleted(data: any) {
  const supabase = await createServiceSupabaseClient()
  const correlator = new SessionCorrelator()

  try {
    const {
      conversation_id,
      agent_id,
      transcript,
      metadata,
      analysis
    } = data

    if (!conversation_id || !agent_id) {
      logger.error('Missing required fields in webhook', { conversation_id, agent_id })
      return
    }

    // Extract metadata
    const durationSeconds = metadata?.duration_seconds || 
                           (metadata?.ended_at && metadata?.started_at
                             ? Math.floor((new Date(metadata.ended_at).getTime() - new Date(metadata.started_at).getTime()) / 1000)
                             : null)
    
    const messageCount = transcript?.length || 
                        (Array.isArray(transcript) ? transcript.length : 0)

    logger.info('Storing conversation data', {
      conversation_id,
      agent_id,
      duration_seconds: durationSeconds,
      message_count: messageCount
    })

    // First, try to correlate with existing session
    const sessionMatch = await correlator.correlateConversationToSession({
      conversation_id,
      agent_id,
      created_at: metadata?.started_at,
      metadata
    })

    // Store conversation data
    const { error: insertError } = await supabase
      .from('elevenlabs_conversations')
      .insert({
        conversation_id,
        agent_id,
        user_id: sessionMatch?.user_id || null,
        session_id: sessionMatch?.session_id || null,
        transcript: transcript || null,
        metadata: metadata || null,
        analysis: analysis || null,
        raw_payload: data, // Store full payload for reference
        duration_seconds: durationSeconds,
        message_count: messageCount
      })

    if (insertError) {
      // If duplicate, try to update instead
      if (insertError.code === '23505') { // Unique violation
        logger.info('Conversation already exists, updating', { conversation_id })
        const { error: updateError } = await supabase
          .from('elevenlabs_conversations')
          .update({
            transcript: transcript || null,
            metadata: metadata || null,
            analysis: analysis || null,
            raw_payload: data,
            duration_seconds: durationSeconds,
            message_count: messageCount,
            user_id: sessionMatch?.user_id || null,
            session_id: sessionMatch?.session_id || null
          })
          .eq('conversation_id', conversation_id)

        if (updateError) {
          logger.error('Error updating conversation', updateError)
          throw updateError
        }
      } else {
        logger.error('Error inserting conversation', insertError)
        throw insertError
      }
    }

    // Update session with conversation_id if we found a match
    if (sessionMatch && sessionMatch.confidence !== 'low') {
      await correlator.updateSessionWithConversationId(
        sessionMatch.session_id,
        conversation_id
      )
      
      // Also update the conversation record with session_id if not already set in insert
      await correlator.updateConversationWithSessionId(
        conversation_id,
        sessionMatch.session_id,
        sessionMatch.user_id
      )
    }

    logger.info('Successfully stored conversation', {
      conversation_id,
      session_id: sessionMatch?.session_id || null,
      matched: !!sessionMatch
    })

    // TODO: Trigger async speech analysis (Phase 2)
    // await analyzeConversation(conversation_id)

  } catch (error: any) {
    logger.error('Error handling conversation completed', error)
    throw error
  }
}

/**
 * Handle conversation.analyzed webhook
 * Updates existing conversation with analysis data
 */
async function handleConversationAnalyzed(data: any) {
  const supabase = await createServiceSupabaseClient()

  try {
    const { conversation_id, analysis } = data

    if (!conversation_id) {
      logger.error('Missing conversation_id in analyzed webhook')
      return
    }

    const { error } = await supabase
      .from('elevenlabs_conversations')
      .update({
        analysis: analysis || null
      })
      .eq('conversation_id', conversation_id)

    if (error) {
      logger.error('Error updating conversation analysis', error)
      throw error
    }

    logger.info('Updated conversation analysis', { conversation_id })
  } catch (error: any) {
    logger.error('Error handling conversation analyzed', error)
    throw error
  }
}

/**
 * Handle call initiation failure webhook
 * Logs the failure for debugging
 */
async function handleCallInitiationFailure(data: any) {
  logger.warn('Call initiation failure', {
    conversation_id: data.conversation_id,
    agent_id: data.agent_id,
    error: data.error,
    reason: data.reason
  })
  
  // Could store this in a separate table for monitoring
  // For now, just log it
}

