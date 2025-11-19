'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Conversation } from '@elevenlabs/client'
import { useSessionRecording } from '@/hooks/useSessionRecording'

type ElevenLabsConversationProps = {
  agentId: string
  conversationToken: string
  autostart?: boolean
  sessionId?: string | null
}

export default function ElevenLabsConversation({ agentId, conversationToken, autostart = true, sessionId = null }: ElevenLabsConversationProps) {
  const conversationRef = useRef<any>(null)
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [currentToken, setCurrentToken] = useState(conversationToken)
  const sessionIdRef = useRef<string | null>(sessionId) // Track sessionId with ref for callbacks
  
  // Update ref when sessionId changes
  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])
  
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

  // Helper to safely dispatch events (guards against SSR)
  const safeDispatchEvent = (eventName: string, detail: any) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName, { detail }))
    }
  }

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

    // Check if we're on the trainer page (basic check)
    if (typeof window !== 'undefined') {
      const isTrainerPage = window.location.pathname.includes('/trainer')
      if (!isTrainerPage) {
        console.error('❌ Not on trainer page - refusing to start conversation')
        setErrorMessage('Conversation can only start on trainer page')
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
        
        onConnect: () => {
          console.log('✅ WebRTC Connected!')
          setStatus('connected')
          wasConnectedRef.current = true // Mark that we were connected
          dispatchStatus('connected')
          setErrorMessage('')
          
          // Reset reconnection state on successful connection
          reconnectAttemptsRef.current = 0
          isReconnectingRef.current = false
          lastMessageTimeRef.current = Date.now()
          lastPingTimeRef.current = Date.now()
          
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
          console.log('🔌 Disconnected:', reason)
          console.log('📊 Disconnect context:', {
            reason,
            wasConnected: wasConnectedRef.current,
            isReconnecting: isReconnectingRef.current,
            hasSessionId: !!sessionIdRef.current,
            reconnectAttempts: reconnectAttemptsRef.current
          })
          
          // Stop health monitoring
          stopHealthMonitoringFn()
          
          const hasActiveSession = !!sessionIdRef.current
          
          // Check if this was an unexpected disconnect (for reconnection logic)
          const reasonStr = String(reason || '').toLowerCase()
          const isUnexpected = wasConnectedRef.current && 
                              !reasonStr.includes('end_call') && 
                              !reasonStr.includes('completed') &&
                              !reasonStr.includes('ended') &&
                              !reasonStr.includes('conversation ended') &&
                              !reasonStr.includes('call ended')
          
          // Only attempt reconnection if we DON'T have an active session (connection error outside session)
          if (isUnexpected && !isReconnectingRef.current && !hasActiveSession) {
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
            console.warn('⚠️ Received message but no sessionId - ignoring message to prevent speaking outside session')
            return
          }
          
          // Check if we're still on the trainer page
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/trainer')) {
            console.warn('⚠️ Received message but not on trainer page - ignoring message')
            // Stop the conversation if we're not on the trainer page
            if (conversationRef.current) {
              console.log('🛑 Stopping conversation - no longer on trainer page')
              conversationRef.current.endSession().catch(() => {})
            }
            return
          }
          
          console.log('📨 RAW MESSAGE FROM ELEVENLABS:', JSON.stringify(msg, null, 2))
          console.log('📨 Message type:', msg?.type)
          console.log('📨 Message keys:', Object.keys(msg || {}))
          safeDispatchEvent('agent:message', msg)
          
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
          
          if (userText) {
            console.log('👤 USER TRANSCRIPT EXTRACTED:', userText)
            console.log('👤 Dispatching agent:user event with:', userText)
            safeDispatchEvent('agent:user', userText)
          }
          
          if (agentText) {
            console.log('🤖 AGENT TRANSCRIPT EXTRACTED:', agentText)
            console.log('🤖 Dispatching agent:response event with:', agentText)
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
              console.warn('⚠️ Received message type', msg.type, 'but no transcript text was extracted. Agent may have stopped responding.')
            }
          }
        },
        
        onError: (err: any) => {
          console.error('❌ WebRTC Error:', err)
          const errMsg = err?.message || err?.error || err?.detail || 'Connection error'
          setErrorMessage(errMsg)
          setStatus('error')
          dispatchStatus('error')
          
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

    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached')
      setErrorMessage('Connection failed. Please try starting a new conversation.')
      setStatus('error')
      dispatchStatus('error')
      return
    }

    isReconnectingRef.current = true
    reconnectAttemptsRef.current += 1
    
    console.log(`🔄 Attempting reconnection (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`)
    
    try {
      // Stop current conversation if it exists
      if (conversationRef.current) {
        try {
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
          // The start function will be called automatically via useEffect
          // But we'll also try calling it directly after a short delay
          reconnectTimeoutRef.current = setTimeout(async () => {
            await start()
            isReconnectingRef.current = false
          }, 500)
        } else {
          throw new Error('No token in response')
        }
      } else {
        throw new Error(`Failed to get new token: ${response.status}`)
      }
    } catch (error: any) {
      console.error('❌ Reconnection attempt failed:', error)
      isReconnectingRef.current = false
      
      // Try again after a delay if we haven't exceeded max attempts
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        console.log(`⏳ Will retry reconnection in 3 seconds...`)
        reconnectTimeoutRef.current = setTimeout(() => {
          attemptReconnect()
        }, 3000)
      } else {
        setErrorMessage('Connection failed after multiple attempts. Please try starting a new conversation.')
        setStatus('error')
        dispatchStatus('error')
      }
    }
  }, [agentId, start])

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
      const now = Date.now()
      const timeSinceLastMessage = now - lastMessageTimeRef.current
      const timeSinceLastPing = now - lastPingTimeRef.current
      const currentStatus = status
      
      // Check if connection seems dead
      if (timeSinceLastPing > PING_TIMEOUT && currentStatus === 'connected') {
        console.warn('⚠️ Connection appears dead (no ping for', Math.round(timeSinceLastPing / 1000), 'seconds)')
        if (!isReconnectingRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          attemptReconnect()
        }
      } else if (timeSinceLastMessage > MESSAGE_TIMEOUT && currentStatus === 'connected') {
        console.warn('⚠️ No messages received for', Math.round(timeSinceLastMessage / 1000), 'seconds')
        // Don't immediately reconnect on message timeout, but log it
        // Sometimes the agent might just be listening for user input
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
