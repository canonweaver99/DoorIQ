'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Conversation } from '@elevenlabs/client'
import { useSessionRecording } from '@/hooks/useSessionRecording'

// End call reason type - export for use in trainer page
export type EndCallReason = 'rejection' | 'sale_complete' | 'goodbye' | 'hostile'

type ElevenLabsConversationProps = {
  agentId: string
  conversationToken: string
  autostart?: boolean
  sessionId?: string | null
  sessionActive?: boolean  // Track if session is still active (prevents reconnect during ending)
  onAgentEndCall?: (reason: EndCallReason) => void  // Callback when AI ends the call
}

export default function ElevenLabsConversation({ 
  agentId, 
  conversationToken, 
  autostart = true, 
  sessionId = null,
  sessionActive = true,
  onAgentEndCall
}: ElevenLabsConversationProps) {
  const conversationRef = useRef<any>(null)
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [currentToken, setCurrentToken] = useState(conversationToken)
  const sessionIdRef = useRef<string | null>(sessionId) // Track sessionId with ref for callbacks
  const sessionActiveRef = useRef<boolean>(sessionActive) // Track sessionActive with ref for callbacks
  
  // Update refs when props change
  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])
  
  useEffect(() => {
    sessionActiveRef.current = sessionActive
  }, [sessionActive])
  
  // Audio recording only (video is handled by dual camera compositor in trainer page)
  const { isRecording: isAudioRecording, startRecording: startAudioRecording, stopRecording: stopAudioRecording } = useSessionRecording(sessionId)
  
  // Track recording state with refs for reliable cleanup
  const audioRecordingActiveRef = useRef(false)
  const wasConnectedRef = useRef(false) // Track if we were ever connected to detect actual disconnects
  
  // Connection health monitoring
  const lastMessageTimeRef = useRef<number>(Date.now())
  const lastPingTimeRef = useRef<number>(Date.now())
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 3
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isReconnectingRef = useRef(false)
  
  // Connection health thresholds (in milliseconds)
  const MESSAGE_TIMEOUT = 30000 // 30 seconds without any message = potential connection issue
  const PING_TIMEOUT = 60000 // 60 seconds without ping = connection likely dead
  const AGENT_RESPONSE_TIMEOUT = 45000 // 45 seconds without agent response = agent may have stopped
  const lastAgentResponseTimeRef = useRef<number>(Date.now()) // Track last time agent actually spoke
  
  // Track intentional ends (via client tool) to skip reconnection
  const intentionalEndRef = useRef<boolean>(false)
  const intentionalEndReasonRef = useRef<string | null>(null)
  
  // Track if end_call was already triggered (prevent double-fires)
  const endCallTriggeredRef = useRef(false)
  
  // Store callback in ref so it's accessible in clientTools without stale closure issues
  const onAgentEndCallRef = useRef(onAgentEndCall)
  useEffect(() => {
    onAgentEndCallRef.current = onAgentEndCall
  }, [onAgentEndCall])

  // Helper to safely dispatch events (guards against SSR)
  const safeDispatchEvent = (eventName: string, detail: any) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName, { detail }))
    }
  }

  // Save transcript directly to database
  const saveTranscriptToDatabase = useCallback(async (sessionId: string, speaker: 'user' | 'homeowner', text: string) => {
    try {
      const response = await fetch('/api/session/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          speaker,
          text
        })
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || 'Failed to save transcript')
      }
      
      const result = await response.json()
      console.log('✅ Transcript saved:', { entryId: result.entryId, transcriptLength: result.transcriptLength })
    } catch (error) {
      console.error('❌ Error saving transcript:', error)
      throw error
    }
  }, [])

  const dispatchStatus = (s: 'disconnected' | 'connecting' | 'connected' | 'error') => {
    // Dispatch the status exactly as passed (don't map disconnected to 'idle')
    safeDispatchEvent('connection:status', s)
  }

  const start = useCallback(async () => {
    console.log('🎬 start() called')
    console.log('🎟️ currentToken:', currentToken ? currentToken.substring(0, 30) + '...' : 'MISSING')
    console.log('🤖 agentId:', agentId)
    console.log('📋 sessionId:', sessionId)

    // CRITICAL: Don't start if we're not in an active session
    if (!sessionId) {
      console.error('❌ No sessionId provided - refusing to start conversation outside of active session')
      setErrorMessage('No session ID - conversation can only start during active training session')
      setStatus('error')
      dispatchStatus('error')
      return
    }

    // Check if we're on an allowed page (trainer page or test page)
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      const isAllowedPage = currentPath.includes('/trainer') || currentPath.includes('/eleven-labs-test')
      if (!isAllowedPage) {
        console.error('❌ Not on allowed page - refusing to start conversation')
        setErrorMessage('Conversation can only start on trainer page or test page')
        setStatus('error')
        dispatchStatus('error')
        return
      }
    }

    if (!agentId) {
      console.error('❌ No agent ID provided')
      setErrorMessage('No agent ID provided')
      setStatus('error')
      dispatchStatus('error')
      return
    }

    if (!currentToken) {
      console.error('❌ No conversation token provided')
      setErrorMessage('No conversation token provided')
      setStatus('error')
      dispatchStatus('error')
      return
    }

    if (conversationRef.current) {
      console.log('⚠️ Conversation already exists, skipping')
      return
    }

    // Reset end call trigger on new session
    endCallTriggeredRef.current = false

    try {
      console.log('🎤 Requesting microphone permission...')
      await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('✅ Microphone permission granted')

      setStatus('connecting')
      dispatchStatus('connecting')
      setErrorMessage('')

      console.log('🚀 Calling Conversation.startSession with WebRTC...')
      
      const conversation = await Conversation.startSession({
        conversationToken: currentToken,
        connectionType: 'webrtc',
        
        // ========== CLIENT TOOLS - AI can call these directly ==========
        clientTools: {
          // end_call tool - AI calls this to close the door
          end_call: async (parameters: { reason?: string }) => {
            const reason = (parameters?.reason || 'goodbye') as EndCallReason
            
            console.log('🚪 ========================================')
            console.log('🚪 end_call TOOL TRIGGERED BY AI AGENT!')
            console.log('🚪 Reason:', reason)
            console.log('🚪 Session ID:', sessionIdRef.current)
            console.log('🚪 ========================================')
            
            // Prevent double-firing
            if (endCallTriggeredRef.current) {
              console.log('⚠️ end_call already triggered, ignoring duplicate')
              return 'Call already ending'
            }
            endCallTriggeredRef.current = true
            
            // Dispatch event for trainer page to catch (backup method)
            safeDispatchEvent('agent:end_call', {
              reason,
              sessionId: sessionIdRef.current,
              timestamp: Date.now()
            })
            
            // Call the callback prop if provided (primary method)
            if (onAgentEndCallRef.current) {
              console.log('🚪 Calling onAgentEndCall callback with reason:', reason)
              // Small delay to let the AI's final audio play
              setTimeout(() => {
                onAgentEndCallRef.current?.(reason)
              }, 1500)
            }
            
            // Return acknowledgment to the AI
            return `Call ended: ${reason}`
          }
        },
        // ================================================================
        
        onConnect: () => {
          console.log('✅ WebRTC Connected!')
          setStatus('connected')
          wasConnectedRef.current = true // Mark that we were connected
          dispatchStatus('connected')
          setErrorMessage('')
          
          // CRITICAL: Ensure audio can play by resuming audio context if suspended
          // This must happen AFTER user interaction (which getUserMedia provides)
          if (typeof window !== 'undefined' && window.AudioContext) {
            // Create a temporary audio context to resume any suspended contexts
            // This unlocks browser audio after user interaction
            try {
              const audioContext = new AudioContext()
              if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                  console.log('🔊 Audio context resumed - audio should now play')
                  audioContext.close()
                }).catch(() => {
                  audioContext.close()
                })
              } else {
                console.log('🔊 Audio context already active')
                audioContext.close()
              }
            } catch (e) {
              console.warn('⚠️ Could not check audio context:', e)
            }
          }
          
          // Reset reconnection state on successful connection
          reconnectAttemptsRef.current = 0
          isReconnectingRef.current = false
          lastMessageTimeRef.current = Date.now()
          lastPingTimeRef.current = Date.now()
          lastAgentResponseTimeRef.current = Date.now() // Reset agent response timer
          intentionalEndRef.current = false // Reset intentional end flag
          intentionalEndReasonRef.current = null
          endCallTriggeredRef.current = false  // Reset end call trigger
          
          // Start connection health monitoring
          setTimeout(() => startHealthMonitoring(), 1000)
          
          // Start audio recording when conversation connects
          console.log('🎙️ Checking audio recording - sessionId:', sessionId, 'isRecording:', isAudioRecording)
          if (sessionId) {
            if (!audioRecordingActiveRef.current) {
              console.log('🎙️ Starting audio recording for session:', sessionId)
              startAudioRecording()
              audioRecordingActiveRef.current = true
            } else {
              console.log('⚠️ Already audio recording, skipping start')
            }
          } else {
            console.warn('⚠️ No sessionId provided to ElevenLabsConversation - audio will not be recorded')
          }
        },
        
        onDisconnect: (reason?: any) => {
          const reasonStr = String(reason || '').toLowerCase()
          const disconnectDetails = {
            reason,
            reasonString: reasonStr,
            wasConnected: wasConnectedRef.current,
            isReconnecting: isReconnectingRef.current,
            hasSessionId: !!sessionIdRef.current,
            sessionId: sessionIdRef.current,
            reconnectAttempts: reconnectAttemptsRef.current,
            timeSinceLastMessage: Date.now() - lastMessageTimeRef.current,
            timeSinceLastPing: Date.now() - lastPingTimeRef.current,
            status: status
          }
          console.log('🔌 Disconnected:', reason)
          console.log('📊 Disconnect context:', disconnectDetails)
          
          // Dispatch disconnect event with full details for debugging
          safeDispatchEvent('agent:disconnect', disconnectDetails)
          
          // Stop health monitoring
          stopHealthMonitoringFn()
          
          const hasActiveSession = !!sessionIdRef.current
          
          // If end_call was triggered, the door close is already being handled
          // Just clean up without trying to trigger door close again
          if (endCallTriggeredRef.current) {
            console.log('🚪 end_call was already triggered - disconnect is expected, cleaning up')
            wasConnectedRef.current = false
            setStatus('disconnected')
            dispatchStatus('disconnected')
            
            if (audioRecordingActiveRef.current) {
              console.log('🛑 Stopping audio recording from onDisconnect (end_call triggered)')
              stopAudioRecording()
              audioRecordingActiveRef.current = false
            }
            
            if (conversationRef.current) {
              conversationRef.current = null
            }
            return
          }
          
          // CRITICAL: Always dispatch disconnect status when there's an active session
          // This ensures the trainer page detects when ElevenLabs hangs up
          if (hasActiveSession) {
            console.log('🔌 Active session detected - dispatching disconnect status immediately')
            console.log('📊 Disconnect reason:', reason, 'Type:', typeof reason)
            wasConnectedRef.current = false
            setStatus('disconnected')
            dispatchStatus('disconnected')
            
            // Stop audio recording when conversation ends
            if (audioRecordingActiveRef.current) {
              console.log('🛑 Stopping audio recording from onDisconnect (active session)')
              stopAudioRecording()
              audioRecordingActiveRef.current = false
            }
            
            // Clean up conversation reference
            if (conversationRef.current) {
              console.log('🧹 Cleaning up conversation reference')
              conversationRef.current = null
            }
            
            // Don't attempt reconnection if we have an active session - the session should end
            return
          }
          
          // Don't reconnect if this was an intentional end (via client tool)
          if (intentionalEndRef.current) {
            console.log('🚪 Intentional end detected - skipping reconnection')
            return
          }
          
          // Don't reconnect if session is not active (session ending or ended)
          if (!sessionActiveRef.current) {
            console.log('⚠️ Session not active - skipping reconnection in disconnect handler')
            return
          }
          
          // Check if this was an unexpected disconnect (for reconnection logic)
          // Only relevant when there's NO active session
          // reasonStr already declared above, reuse it
          const isUnexpected = wasConnectedRef.current && 
                              !reasonStr.includes('end_call') && 
                              !reasonStr.includes('completed') &&
                              !reasonStr.includes('ended') &&
                              !reasonStr.includes('conversation ended') &&
                              !reasonStr.includes('call ended')
          
          // Only attempt reconnection if we DON'T have an active session (connection error outside session)
          if (isUnexpected && !isReconnectingRef.current) {
            console.warn('⚠️ Unexpected disconnect detected (no active session), attempting reconnection...')
            // Only attempt reconnect if we haven't exceeded max attempts
            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
              attemptReconnect()
              // Stop audio recording during reconnection attempt
              if (audioRecordingActiveRef.current) {
                console.log('🛑 Stopping audio recording during reconnection attempt')
                stopAudioRecording()
                audioRecordingActiveRef.current = false
              }
              return
            } else {
              console.error('❌ Max reconnection attempts reached')
            }
          }
          
          wasConnectedRef.current = false // Reset for next connection
          
          setStatus('disconnected')
          dispatchStatus('disconnected')
          
          // Stop audio recording when conversation ends
          if (audioRecordingActiveRef.current) {
            console.log('🛑 Stopping audio recording from onDisconnect')
            stopAudioRecording()
            audioRecordingActiveRef.current = false
          }
        },
        
        onModeChange: (mode: any) => {
          console.log('🎯 Mode changed:', mode)
          // Mode can be: 'speaking', 'listening', 'idle', etc.
          safeDispatchEvent('agent:mode', mode)
        },
        
        onStatusChange: (status: any) => {
          console.log('📊 Status changed:', status)
          safeDispatchEvent('agent:status', status)
        },
        
        onMessage: (msg: any) => {
          // CRITICAL: Don't process messages if we're not in an active session
          // Use ref to get current sessionId value (callbacks capture stale values)
          if (!sessionIdRef.current) {
            // Log more details to help diagnose why sessionId is null
            console.error('❌ CRITICAL: Received message but no sessionId!', {
              messageType: msg?.type,
              hasConversation: !!conversationRef.current,
              status: status,
              wasConnected: wasConnectedRef.current,
              messagePreview: JSON.stringify(msg).substring(0, 200)
            })
            // Still allow ping/audio messages through to maintain connection health
            // These don't cause the agent to speak, but help keep the connection alive
            if (msg?.type === 'ping' || msg?.type === 'audio' || msg?.type === 'audio_chunk') {
              console.log('⚠️ Allowing ping/audio message through despite missing sessionId to maintain connection')
              lastMessageTimeRef.current = Date.now()
              if (msg?.type === 'ping') {
                lastPingTimeRef.current = Date.now()
              }
              return
            }
            console.warn('⚠️ Ignoring non-ping message without sessionId to prevent speaking outside session')
            return
          }
          
          // Check if we're still on an allowed page
          // Only check if we have a valid pathname (dev tools opening can cause temporary pathname issues)
          if (typeof window !== 'undefined' && window.location.pathname) {
            const currentPath = window.location.pathname
            const isAllowedPage = currentPath.includes('/trainer') || 
                                  currentPath.includes('/eleven-labs-test') ||
                                  currentPath.includes('/feedback') || 
                                  currentPath.includes('/loading')
            
            if (!isAllowedPage) {
              console.warn('⚠️ Received message but not on allowed page - ignoring message')
              // Don't stop conversation immediately - might be a temporary navigation issue
              // Only stop if we're definitely on a different page
              if (currentPath && currentPath.length > 0) {
                if (conversationRef.current) {
                  console.log('🛑 Stopping conversation - no longer on allowed page')
                  conversationRef.current.endSession().catch(() => {})
                }
                return
              }
            }
          }
          
          console.log('📨 RAW MESSAGE FROM ELEVENLABS:', JSON.stringify(msg, null, 2))
          console.log('📨 Message type:', msg?.type)
          console.log('📨 Message keys:', Object.keys(msg || {}))
          safeDispatchEvent('agent:message', msg)
          
          // Handle tool calls (client tools) - check for tool_call or function_call message types
          if (msg?.type === 'tool_call' || msg?.type === 'function_call' || msg?.tool_call || msg?.function_call) {
            const toolCall = msg.tool_call || msg.function_call || msg
            const toolName = toolCall.name || toolCall.function?.name || msg.name
            let toolArgs = toolCall.arguments || toolCall.function?.arguments || msg.arguments || {}
            
            // Parse arguments if they're a string
            if (typeof toolArgs === 'string') {
              try {
                toolArgs = JSON.parse(toolArgs)
              } catch (e) {
                console.warn('⚠️ Failed to parse tool arguments:', e)
                toolArgs = {}
              }
            }
            
            console.log('🔧 Tool call detected in message:', { toolName, toolArgs })
            
            // Handle end_call tool - immediate door close trigger
            if (toolName === 'end_call' || toolName === 'trigger_door_close' || toolName === 'end_conversation') {
              const reason = toolArgs.reason || toolArgs.message || 'Agent requested door close'
              const finalMessage = toolArgs.finalMessage || toolArgs.message || null
              
              console.log('🚪 end_call tool called by agent:', { reason, finalMessage })
              
              // Mark as intentional end to prevent reconnection
              intentionalEndRef.current = true
              intentionalEndReasonRef.current = reason
              
              // Stop health monitoring immediately
              stopHealthMonitoringFn()
              
              // Dispatch door close event immediately (no wait)
              safeDispatchEvent('agent:door-close-requested', {
                reason,
                finalMessage,
                timestamp: Date.now(),
                intentional: true,
                sessionId: sessionIdRef.current
              })
              
              // Also dispatch disconnect event with intentional flag
              safeDispatchEvent('agent:disconnect', {
                reason: `Intentional end: ${reason}`,
                intentional: true,
                hasSessionId: !!sessionIdRef.current,
                sessionId: sessionIdRef.current
              })
              
              // Don't process further - tool call handled
              return
            }
            
            // Handle other tools if needed
            console.warn('⚠️ Unknown tool call:', toolName)
          }
          
          // Update last message time for connection health monitoring
          lastMessageTimeRef.current = Date.now()
          
          // Update ping time if this is a ping message
          if (msg?.type === 'ping') {
            lastPingTimeRef.current = Date.now()
            console.log('🏓 Ping received, connection healthy')
            // Dispatch ping event to reset activity timer even without text
            safeDispatchEvent('agent:ping', msg)
          }
          
          // Also dispatch audio activity events to keep conversation alive
          if (msg?.type === 'audio' || msg?.type === 'audio_chunk') {
            console.log('🔊 Audio activity detected, connection still active')
            safeDispatchEvent('agent:audio', msg)
          }
          
          // Extract transcript text from various message formats
          const extractTranscripts = (message: any) => {
            let userText = ''
            let agentText = ''
            
            try {
              // Handle conversation_updated messages (WebRTC format - most common)
              if (message?.type === 'conversation_updated') {
                const messages = message?.conversation?.messages || []
                if (messages.length > 0) {
                  const lastMsg = messages[messages.length - 1]
                  if (lastMsg?.role === 'user' && lastMsg?.content) {
                    userText = lastMsg.content
                  } else if (lastMsg?.role === 'assistant' && lastMsg?.content) {
                    agentText = lastMsg.content
                  }
                }
              }
              
              // Handle explicit user_transcript messages
              else if (message?.type === 'user_transcript') {
                userText = typeof message.user_transcript === 'string' 
                  ? message.user_transcript 
                  : (message.user_transcript?.text || message.text || '')
              }
              
              // Handle agent_transcript messages
              else if (message?.type === 'agent_transcript') {
                agentText = typeof message.agent_transcript === 'string'
                  ? message.agent_transcript
                  : (message.agent_transcript?.text || message.text || '')
              }
              
              // Handle agent_response messages
              else if (message?.type === 'agent_response') {
                const ar = message.agent_response
                if (typeof ar === 'string') {
                  agentText = ar
                } else if (ar?.text) {
                  agentText = ar.text
                } else if (ar?.content) {
                  agentText = ar.content
                } else if (Array.isArray(ar?.messages)) {
                  agentText = ar.messages.map((m: any) => m?.text).filter(Boolean).join(' ')
                }
              }
              
              // Handle transcript.final messages
              else if (message?.type === 'transcript.final') {
                const text = message?.text || message?.delta || ''
                if (text) {
                  // Determine speaker from role or speaker field
                  const role = message?.role || message?.speaker || 'assistant'
                  if (role === 'user') {
                    userText = text
                  } else {
                    agentText = text
                  }
                }
              }
              
              // Generic fallback: check for user/agent fields
              if (!userText && (message?.user || message?.speaker === 'user')) {
                const u = message.user
                if (typeof u === 'string') userText = u
                else if (u?.text) userText = u.text
                else if (u?.transcript) userText = u.transcript
              }
              
              if (!agentText && (message?.agent || message?.speaker === 'agent' || message?.speaker === 'assistant' || message?.role === 'assistant')) {
                const a = message.agent || message
                if (typeof a === 'string') agentText = a
                else if (a?.text) agentText = a.text
                else if (a?.response) agentText = a.response
              }
              
              // Conversation update style: messages array with role/content
              if (!userText && !agentText) {
                const messages = message?.messages || message?.conversation?.messages || []
                if (Array.isArray(messages) && messages.length) {
                  const uParts = messages
                    .filter((m: any) => m?.role === 'user' || m?.speaker === 'user')
                    .map((m: any) => m?.text || m?.content || '')
                    .filter(Boolean)
                  const aParts = messages
                    .filter((m: any) => m?.role === 'assistant' || m?.speaker === 'agent' || m?.role === 'agent')
                    .map((m: any) => m?.text || m?.content || '')
                    .filter(Boolean)
                  if (uParts.length) userText = uParts.join(' ')
                  if (aParts.length) agentText = aParts.join(' ')
                }
              }
              
              // Handle source + message format (ElevenLabs specific)
              if (!userText && !agentText && message?.message) {
                const text = message.message
                const source = message.source || message.role || message.speaker || 'ai'
                if (source === 'user') {
                  userText = text
                } else {
                  agentText = text
                }
              }
              
              // Final fallback: single text field with role
              if (!userText && !agentText && message?.text) {
                const role = message?.role || message?.speaker || 'assistant'
                if (role === 'user') userText = message.text
                else agentText = message.text
              }
              
            } catch (e) {
              console.error('Error extracting transcripts:', e)
            }
            
            return { userText, agentText }
          }
          
          const { userText, agentText } = extractTranscripts(msg)
          
          console.log('🔍 EXTRACTION RESULT:', { userText, agentText, messageType: msg?.type })
          
          // Save transcripts directly to database instead of using events
          if (userText && sessionIdRef.current) {
            console.log('👤 USER TRANSCRIPT EXTRACTED:', userText)
            console.log('💾 Saving user transcript to database...')
            saveTranscriptToDatabase(sessionIdRef.current, 'user', userText).catch((err) => {
              console.error('❌ Failed to save user transcript:', err)
            })
            // Still dispatch event for UI updates
            safeDispatchEvent('agent:user', userText)
          }
          
          if (agentText && sessionIdRef.current) {
            console.log('🤖 AGENT TRANSCRIPT EXTRACTED:', agentText)
            console.log('💾 Saving agent transcript to database...')
            // Update last agent response time when we get actual agent text
            lastAgentResponseTimeRef.current = Date.now()
            saveTranscriptToDatabase(sessionIdRef.current, 'homeowner', agentText).catch((err) => {
              console.error('❌ Failed to save agent transcript:', err)
            })
            // Still dispatch event for UI updates
            safeDispatchEvent('agent:response', agentText)
          }
          
          if (!userText && !agentText) {
            console.warn('⚠️ NO TEXT EXTRACTED from message type:', msg?.type)
            console.warn('⚠️ Full message was:', msg)
          }
          
          // Handle interim/delta transcripts (partial text as it's being spoken)
          if (!userText && !agentText && (msg?.type === 'transcript.delta' || msg?.type === 'interim_transcript')) {
            const interimText = msg?.text || msg?.delta || ''
            if (interimText) {
              console.log('📝 Interim text:', interimText)
              // Dispatch delta event for live preview (optional - shows text as it's being spoken)
              safeDispatchEvent('agent:delta', interimText)
            }
          }
          
          // Log other message types for debugging
          if (!userText && !agentText) {
            if (msg?.type === 'conversation_initiation_metadata') {
              console.log('🎬 Conversation initiated')
            } else if (msg?.type === 'interruption') {
              console.log('✋ User interrupted agent')
            } else if (msg?.type === 'ping') {
              console.log('🏓 Ping')
            } else if (msg?.type === 'audio' || msg?.type === 'audio_chunk') {
              console.log('🔊 Audio chunk received - connection still active')
            } else if (msg?.type !== 'transcript.delta' && msg?.type !== 'interim_transcript' && msg?.type) {
              console.log('ℹ️  Unhandled message type:', msg.type, '- Consider adding support if this contains transcript data')
            }
            
            // Warn if we're receiving messages but no text is being extracted (potential issue)
            if (msg?.type && msg?.type !== 'ping' && msg?.type !== 'audio' && msg?.type !== 'audio_chunk' && 
                msg?.type !== 'transcript.delta' && msg?.type !== 'interim_transcript' && 
                msg?.type !== 'conversation_initiation_metadata' && msg?.type !== 'interruption') {
              console.warn('⚠️ Received message type', msg.type, 'but no transcript text was extracted. Agent may have stopped responding.', {
                messageKeys: Object.keys(msg || {}),
                messagePreview: JSON.stringify(msg).substring(0, 300),
                sessionId: sessionIdRef.current,
                hasConversation: !!conversationRef.current
              })
            }
          }
        },
        
        onError: (err: any) => {
          console.error('❌ WebRTC Error:', err, {
            errorType: err?.type,
            errorCode: err?.code,
            errorMessage: err?.message,
            errorDetail: err?.detail,
            hasSessionId: !!sessionIdRef.current,
            sessionId: sessionIdRef.current,
            wasConnected: wasConnectedRef.current,
            isReconnecting: isReconnectingRef.current,
            reconnectAttempts: reconnectAttemptsRef.current,
            fullError: JSON.stringify(err, Object.getOwnPropertyNames(err))
          })
          const errMsg = err?.message || err?.error || err?.detail || 'Connection error'
          setErrorMessage(errMsg)
          setStatus('error')
          dispatchStatus('error')
          
          // Dispatch error event so trainer page can handle it
          safeDispatchEvent('agent:error', {
            error: errMsg,
            errorDetails: err,
            sessionId: sessionIdRef.current
          })
          
          // Don't reconnect if this was an intentional end
          if (intentionalEndRef.current) {
            console.log('🚪 Intentional end detected - skipping reconnection')
            return
          }
          
          // Don't reconnect if session is not active (session ending or ended)
          if (!sessionActiveRef.current) {
            console.log('⚠️ Session not active - skipping reconnection in error handler')
            return
          }
          
          // Attempt automatic reconnection if we were previously connected
          if (wasConnectedRef.current && !isReconnectingRef.current) {
            console.warn('⚠️ Connection error during active session, attempting reconnection...')
            attemptReconnect()
          }
        },
      })

      conversationRef.current = conversation
      console.log('✅ Conversation started successfully')
      console.log('📋 Conversation object type:', typeof conversation)
      console.log('📋 Conversation methods:', conversation ? Object.keys(conversation) : 'none')
      console.log('🔍 Checking conversation object for transcript methods...')
      console.log('🔍 Has getConversation?', typeof (conversation as any)?.getConversation === 'function')
      console.log('🔍 Has getId?', typeof (conversation as any)?.getId === 'function')
      console.log('🔍 Has getInputVolume?', typeof (conversation as any)?.getInputVolume === 'function')
      console.log('🔍 Has setVolume?', typeof (conversation as any)?.setVolume === 'function')
      
      // Try to get conversation ID to fetch transcripts
      if (typeof (conversation as any)?.getId === 'function') {
        try {
          const convId = await (conversation as any).getId()
          console.log('🆔 Conversation ID:', convId)
          
          // Store it globally so we can fetch transcripts
          ;(window as any).elevenConversationId = convId
        } catch (e) {
          console.log('⚠️ Could not get conversation ID:', e)
        }
      }
      
    } catch (error: any) {
      console.error('❌ Failed to start conversation:', error)
      const errMsg = error?.name === 'NotAllowedError' ? 'Microphone blocked by browser' : (error?.message || error?.error || 'Failed to connect')
      setErrorMessage(errMsg)
      setStatus('error')
      dispatchStatus('error')
      // If mic blocked, surface a helpful hint toast via alert for now
      if (error?.name === 'NotAllowedError') {
        alert('Microphone access is blocked. Click the red status pill to retry permission, or allow mic access from the address bar and reload.')
      }
    }
  }, [agentId, currentToken])

  const stopHealthMonitoringFn = useCallback(() => {
    if (healthCheckIntervalRef.current) {
      console.log('🏥 Stopping connection health monitoring')
      clearInterval(healthCheckIntervalRef.current)
      healthCheckIntervalRef.current = null
    }
  }, [])

  // Automatic reconnection function (defined before startHealthMonitoring to avoid dependency issues)
  const attemptReconnect = useCallback(async () => {
    if (isReconnectingRef.current) {
      console.log('🔄 Already reconnecting, skipping duplicate attempt')
      return
    }

    // Don't reconnect if end_call was already triggered (session is ending)
    if (endCallTriggeredRef.current) {
      console.log('🚪 end_call was triggered - skipping reconnection attempt (session ending)')
      return
    }

    // Don't reconnect if session is not active (session ending or ended)
    // Use ref to get current value (callbacks can have stale closures)
    if (!sessionActiveRef.current) {
      console.log('⚠️ Session not active - skipping reconnection attempt')
      return
    }

    // Don't reconnect if we don't have an active session
    if (!sessionIdRef.current) {
      console.log('⚠️ No active session - skipping reconnection attempt')
      return
    }

    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached')
      setErrorMessage('Connection failed after multiple attempts. Please try starting a new conversation.')
      setStatus('error')
      dispatchStatus('error')
      // Dispatch event so trainer page can show user-friendly message
      safeDispatchEvent('agent:reconnect-failed', {
        attempts: reconnectAttemptsRef.current,
        sessionId: sessionIdRef.current
      })
      return
    }

    isReconnectingRef.current = true
    reconnectAttemptsRef.current += 1
    
    console.log(`🔄 Attempting reconnection (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`)
    console.log(`🔄 Reconnection context:`, {
      sessionId: sessionIdRef.current,
      currentStatus: status,
      wasConnected: wasConnectedRef.current,
      timeSinceLastMessage: Math.round((Date.now() - lastMessageTimeRef.current) / 1000),
      timeSinceLastAgentResponse: Math.round((Date.now() - lastAgentResponseTimeRef.current) / 1000)
    })
    
    // Dispatch reconnection attempt event
    safeDispatchEvent('agent:reconnecting', {
      attempt: reconnectAttemptsRef.current,
      maxAttempts: maxReconnectAttempts,
      sessionId: sessionIdRef.current
    })
    
    try {
      // Stop current conversation if it exists
      if (conversationRef.current) {
        try {
          console.log('🛑 Ending current session before reconnection...')
          await conversationRef.current.endSession()
        } catch (e) {
          console.warn('⚠️ Error ending session during reconnect:', e)
        }
        conversationRef.current = null
      }
      
      // Wait before reconnecting (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 5000)
      console.log(`⏳ Waiting ${delay}ms before reconnecting...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      
      // Try to get a new token first
      console.log('🔄 Requesting new conversation token for reconnection...')
      const response = await fetch('/api/eleven/conversation-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data?.conversation_token) {
          console.log('✅ New token obtained, updating and restarting...')
          setCurrentToken(data.conversation_token)
          // Reset timers for new connection
          lastMessageTimeRef.current = Date.now()
          lastPingTimeRef.current = Date.now()
          lastAgentResponseTimeRef.current = Date.now()
          
          // The start function will be called automatically via useEffect
          // But we'll also try calling it directly after a short delay
          reconnectTimeoutRef.current = setTimeout(async () => {
            try {
              await start()
              console.log('✅ Reconnection successful!')
              // Dispatch success event
              safeDispatchEvent('agent:reconnected', {
                attempt: reconnectAttemptsRef.current,
                sessionId: sessionIdRef.current
              })
              isReconnectingRef.current = false
            } catch (error) {
              console.error('❌ Error during reconnection start:', error)
              isReconnectingRef.current = false
              // Will retry if under max attempts
              if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                setTimeout(() => attemptReconnect(), 2000)
              }
            }
          }, 500)
        } else {
          throw new Error('No token in response')
        }
      } else {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`Failed to get new token: ${response.status} - ${errorText}`)
      }
    } catch (error: any) {
      console.error('❌ Reconnection attempt failed:', error)
      isReconnectingRef.current = false
      
      // Try again after a delay if we haven't exceeded max attempts
      if (reconnectAttemptsRef.current < maxReconnectAttempts && sessionIdRef.current) {
        console.log(`⏳ Will retry reconnection in 3 seconds...`)
        reconnectTimeoutRef.current = setTimeout(() => {
          attemptReconnect()
        }, 3000)
      } else {
        console.error('❌ Reconnection failed after all attempts')
        setErrorMessage('Connection failed after multiple attempts. Please try starting a new conversation.')
        setStatus('error')
        dispatchStatus('error')
        safeDispatchEvent('agent:reconnect-failed', {
          attempts: reconnectAttemptsRef.current,
          sessionId: sessionIdRef.current,
          error: error?.message
        })
      }
    }
  }, [agentId, start, status])

  const stop = useCallback(async () => {
    try {
      // Stop health monitoring
      stopHealthMonitoringFn()
      
      // Stop audio recording
      if (audioRecordingActiveRef.current) {
        console.log('🛑 Stopping audio recording from stop()')
        stopAudioRecording()
        audioRecordingActiveRef.current = false
      }
      
      if (conversationRef.current) {
        await conversationRef.current.endSession()
        conversationRef.current = null
      }
      setStatus('disconnected')
      dispatchStatus('disconnected')
    } catch (e) {
      console.error('❌ Error ending conversation:', e)
    }
  }, [stopAudioRecording, stopHealthMonitoringFn])

  // Connection health monitoring functions
  const startHealthMonitoring = useCallback(() => {
    stopHealthMonitoringFn() // Clear any existing interval
    
    console.log('🏥 Starting connection health monitoring')
    healthCheckIntervalRef.current = setInterval(() => {
      // Don't run health checks if end_call was already triggered
      if (endCallTriggeredRef.current) {
        console.log('🏥 Skipping health check - end_call already triggered')
        return
      }
      
      // Skip all health checks if this was an intentional end
      if (intentionalEndRef.current) {
        console.log('🚪 Intentional end - skipping health monitoring')
        return
      }
      
      const now = Date.now()
      const timeSinceLastMessage = now - lastMessageTimeRef.current
      const timeSinceLastPing = now - lastPingTimeRef.current
      const timeSinceLastAgentResponse = now - lastAgentResponseTimeRef.current
      const currentStatus = status
      const hasActiveSession = !!sessionIdRef.current
      
      // Check if connection seems dead (no pings)
      if (timeSinceLastPing > PING_TIMEOUT && currentStatus === 'connected') {
        console.warn('⚠️ Connection appears dead (no ping for', Math.round(timeSinceLastPing / 1000), 'seconds)')
        if (hasActiveSession && !isReconnectingRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          console.log('🔄 Attempting reconnection due to dead connection...')
          attemptReconnect()
          return
        }
      }
      
      // Check if agent stopped responding mid-conversation (connection alive but agent silent)
      if (hasActiveSession && currentStatus === 'connected' && timeSinceLastAgentResponse > AGENT_RESPONSE_TIMEOUT) {
        const secondsSinceAgentResponse = Math.round(timeSinceLastAgentResponse / 1000)
        console.warn('⚠️ Agent stopped responding mid-conversation (no response for', secondsSinceAgentResponse, 'seconds)')
        console.warn('⚠️ Connection status:', currentStatus, '| Last ping:', Math.round(timeSinceLastPing / 1000), 's ago | Last message:', Math.round(timeSinceLastMessage / 1000), 's ago')
        
        // Dispatch inactivity event
        safeDispatchEvent('agent:inactivity', { 
          secondsSinceLastMessage: secondsSinceAgentResponse,
          timeSinceLastPing: Math.round(timeSinceLastPing / 1000),
          agentStoppedResponding: true
        })
        
        // Attempt reconnection if agent has been silent for too long during active session
        // This handles "zombie" connections where status is "connected" but agent isn't responding
        if (!isReconnectingRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          console.log('🔄 Agent stopped responding - attempting reconnection to restore conversation...')
          attemptReconnect()
          return
        }
      }
      
      // Check for general message timeout (but don't reconnect immediately - might just be listening)
      if (timeSinceLastMessage > MESSAGE_TIMEOUT && currentStatus === 'connected') {
        const secondsSinceMessage = Math.round(timeSinceLastMessage / 1000)
        console.warn('⚠️ No messages received for', secondsSinceMessage, 'seconds')
        
        // Dispatch inactivity event if we have an active session
        // This helps detect when agent stops responding (even if connection is still active)
        if (hasActiveSession && timeSinceLastMessage > 15000) { // 15 seconds of silence
          console.log('🔇 Agent inactivity detected - dispatching event')
          safeDispatchEvent('agent:inactivity', { 
            secondsSinceLastMessage: secondsSinceMessage,
            timeSinceLastPing: Math.round(timeSinceLastPing / 1000)
          })
        }
        // Don't immediately reconnect on general message timeout - might just be listening
        // But if it's been a very long time and we have an active session, consider reconnecting
        if (hasActiveSession && timeSinceLastMessage > 60000 && !isReconnectingRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          console.warn('⚠️ No messages for over 60 seconds during active session - attempting reconnection')
          attemptReconnect()
        }
      }
    }, 10000) // Check every 10 seconds
  }, [status, attemptReconnect, stopHealthMonitoringFn])

  useEffect(() => {
    // Only autostart if we have a sessionId (active session)
    if (autostart && sessionId) {
      console.log('🎬 Autostart enabled with sessionId, starting in 100ms...')
      const id = setTimeout(() => {
        // Double-check sessionId still exists before starting
        if (sessionId) {
          start()
        } else {
          console.warn('⚠️ sessionId no longer exists, aborting autostart')
        }
      }, 100)
      return () => clearTimeout(id)
    } else if (autostart && !sessionId) {
      console.warn('⚠️ Autostart enabled but no sessionId - refusing to start conversation')
    }
  }, [autostart, start, sessionId])

  // Update token when prop changes
  useEffect(() => {
    if (conversationToken !== currentToken) {
      console.log('🔄 Conversation token updated from props')
      setCurrentToken(conversationToken)
    }
  }, [conversationToken, currentToken])

  // Auto-restart conversation when token changes (after renewal/reconnect)
  useEffect(() => {
    if (!currentToken || !conversationRef.current) return
    
    // If we have a new token but conversation is already running, it was updated by renewal
    const tokenChanged = conversationToken !== currentToken
    if (tokenChanged && conversationRef.current) {
      console.log('🔄 Token changed during active conversation, triggering restart...')
      const restart = async () => {
        try {
          if (conversationRef.current) {
            await conversationRef.current.endSession()
            conversationRef.current = null
          }
          await new Promise(resolve => setTimeout(resolve, 500))
          await start()
        } catch (error) {
          console.error('❌ Error restarting conversation:', error)
        }
      }
      restart()
    }
  }, [currentToken])

  // Listen for token renewal events
  useEffect(() => {
    const handleTokenRenewal = async (e: any) => {
      const newToken = e.detail?.conversationToken
      if (!newToken) return
      
      console.log('🔄 Token renewed event received, restarting conversation...')
      
      try {
        // Update token in state
        setCurrentToken(newToken)
        
        // End current conversation
        if (conversationRef.current) {
          await conversationRef.current.endSession()
          conversationRef.current = null
        }
        
        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // The start function will be called automatically by the useEffect watching currentToken
        console.log('✅ Token updated, conversation will restart automatically')
      } catch (error) {
        console.error('❌ Error handling token renewal:', error)
      }
    }
    
    const handleReconnect = async (e: any) => {
      const newToken = e.detail?.conversationToken
      if (!newToken) return
      
      console.log('🔄 Reconnect event received')
      
      try {
        // Update token in state
        setCurrentToken(newToken)
        
        // End current conversation
        if (conversationRef.current) {
          await conversationRef.current.endSession()
          conversationRef.current = null
        }
        
        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // The start function will be called automatically
        console.log('✅ Token updated for reconnection')
      } catch (error) {
        console.error('❌ Error reconnecting:', error)
      }
    }
    
    window.addEventListener('trainer:token-renewed', handleTokenRenewal as EventListener)
    window.addEventListener('trainer:reconnect', handleReconnect as EventListener)
    
    return () => {
      window.removeEventListener('trainer:token-renewed', handleTokenRenewal as EventListener)
      window.removeEventListener('trainer:reconnect', handleReconnect as EventListener)
    }
  }, [])

  // Monitor sessionId and stop conversation if it becomes null
  useEffect(() => {
    if (!sessionId && conversationRef.current) {
      console.warn('⚠️ sessionId became null - stopping conversation immediately')
      stop().catch((err) => {
        console.error('❌ Error stopping conversation when sessionId became null:', err)
      })
    }
  }, [sessionId, stop])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 ElevenLabsConversation component unmounting - cleaning up')
      
      // Clear any pending timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      
      // Stop health monitoring
      stopHealthMonitoringFn()
      
      // Stop audio recording on unmount
      if (audioRecordingActiveRef.current) {
        console.log('🛑 Stopping audio recording on unmount')
        stopAudioRecording()
        audioRecordingActiveRef.current = false
      }
      
      if (conversationRef.current) {
        console.log('🧹 Cleaning up conversation on unmount')
        conversationRef.current.endSession().catch((err: any) => {
          console.error('❌ Error ending session on unmount:', err)
        })
        conversationRef.current = null
      }
    }
  }, [stopAudioRecording, stopHealthMonitoringFn])

  // This component is headless
  return null
}
