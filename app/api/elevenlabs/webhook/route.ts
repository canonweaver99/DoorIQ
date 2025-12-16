export const dynamic = "force-dynamic";

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

    // Extract ElevenLabs metrics for instant grading
    const elevenLabsMetrics = {
      conversation_id,
      duration: durationSeconds,
      message_count: messageCount,
      analysis: analysis || null,
      metadata: metadata || null,
      sentiment_progression: analysis?.sentiment_progression || metadata?.sentiment_progression || [],
      interruption_count: metadata?.interruptions_count || 0,
      audio_quality: metadata?.audio_quality || 85
    }

    // Update session with conversation_id and metrics if we found a match
    if (sessionMatch && sessionMatch.confidence !== 'low') {
      await correlator.updateSessionWithConversationId(
        sessionMatch.session_id,
        conversation_id
      )
      
      // Update session with ElevenLabs metrics immediately for instant grading
      const { error: metricsError } = await supabase
        .from('live_sessions')
        .update({
          elevenlabs_conversation_id: conversation_id,
          elevenlabs_metrics: elevenLabsMetrics
        })
        .eq('id', sessionMatch.session_id)
      
      if (metricsError) {
        logger.warn('Error updating session with ElevenLabs metrics', metricsError)
      }
      
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
      matched: !!sessionMatch,
      metricsStored: !!(sessionMatch && sessionMatch.confidence !== 'low')
    })

    // Trigger async speech analysis (Phase 2) - fire and forget
    if (sessionMatch?.session_id) {
      analyzeConversation(conversation_id, sessionMatch.session_id).catch((error) => {
        logger.error('Error in async speech analysis', { conversation_id, session_id: sessionMatch.session_id, error })
      })
    }

  } catch (error: any) {
    logger.error('Error handling conversation completed', error)
    throw error
  }
}

/**
 * Analyze conversation for speech metrics (Phase 2)
 * Runs asynchronously after conversation is stored
 */
async function analyzeConversation(conversationId: string, sessionId: string) {
  const supabase = await createServiceSupabaseClient()
  let session: any = null
  
  try {
    logger.info('Starting async speech analysis', { conversation_id: conversationId, session_id: sessionId })
    
    // Fetch conversation data
    const { data: conversation, error: convError } = await supabase
      .from('elevenlabs_conversations')
      .select('transcript, metadata, analysis, duration_seconds')
      .eq('conversation_id', conversationId)
      .single()
    
    if (convError || !conversation) {
      logger.error('Conversation not found for analysis', { conversation_id: conversationId, error: convError })
      // Mark speech grading as failed
      await supabase
        .from('live_sessions')
        .update({
          analytics: {
            speech_grading_error: 'Conversation data not found for analysis'
          }
        })
        .eq('id', sessionId)
      return
    }
    
    // Fetch session data for additional context
    const { data: sessionData, error: sessionError } = await supabase
      .from('live_sessions')
      .select('analytics, duration_seconds')
      .eq('id', sessionId)
      .single()
    
    if (sessionError) {
      logger.warn('Session not found for analysis', { session_id: sessionId, error: sessionError })
    } else {
      session = sessionData
    }
    
    // Extract speech metrics from transcript and analysis
    const transcript = conversation.transcript || []
    const durationSeconds = conversation.duration_seconds || session?.duration_seconds || 0
    
    // Calculate basic speech metrics
    const repMessages = Array.isArray(transcript) 
      ? transcript.filter((msg: any) => msg.role === 'user' || msg.role === 'rep')
      : []
    
    const totalWords = repMessages.reduce((sum: number, msg: any) => {
      const text = msg.content || msg.text || ''
      return sum + text.split(/\s+/).filter((w: string) => w.length > 0).length
    }, 0)
    
    const avgWPM = durationSeconds > 0 ? Math.round((totalWords / durationSeconds) * 60) : 0
    
    // Count filler words
    const fillerPattern = /\b(um|uhh?|uh|erm|err|hmm|like)\b/gi
    const fillerWords = repMessages.reduce((sum: number, msg: any) => {
      const text = msg.content || msg.text || ''
      const matches = text.match(fillerPattern)
      return sum + (matches ? matches.length : 0)
    }, 0)
    
    // Extract metrics from ElevenLabs analysis if available
    const elevenLabsAnalysis = conversation.analysis || {}
    const sentimentProgression = elevenLabsAnalysis.sentiment_progression || []
    const interruptionCount = conversation.metadata?.interruptions_count || 0
    
    // Store speech analysis results
    const { error: insertError } = await supabase
      .from('speech_analysis')
      .insert({
        session_id: sessionId,
        is_final: true,
        avg_wpm: avgWPM,
        total_filler_words: fillerWords,
        filler_words_per_minute: durationSeconds > 0 ? (fillerWords / durationSeconds) * 60 : 0,
        issues: {
          excessiveFillers: fillerWords > 10,
          tooFast: avgWPM > 200,
          tooSlow: avgWPM < 120 && avgWPM > 0
        },
        analysis_timestamp: new Date().toISOString()
      })
    
    if (insertError) {
      logger.error('Error storing speech analysis', { session_id: sessionId, error: insertError })
      // Mark speech grading as failed in session analytics
      await supabase
        .from('live_sessions')
        .update({
          analytics: {
            ...(session?.analytics || {}),
            speech_grading_error: 'Failed to store speech analysis data'
          }
        })
        .eq('id', sessionId)
    } else {
      logger.info('Speech analysis completed', { 
        conversation_id: conversationId, 
        session_id: sessionId,
        avg_wpm: avgWPM,
        filler_words: fillerWords
      })
    }
  } catch (error: any) {
    logger.error('Error in analyzeConversation', { conversation_id: conversationId, session_id: sessionId, error })
    // Mark speech grading as failed in session analytics
    try {
      await supabase
        .from('live_sessions')
        .update({
          analytics: {
            ...(session?.analytics || {}),
            speech_grading_error: error?.message || 'Speech analysis processing failed'
          }
        })
        .eq('id', sessionId)
    } catch (updateError) {
      logger.error('Failed to update session with speech grading error', updateError)
    }
    // Don't throw - this is async and shouldn't block webhook response
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

