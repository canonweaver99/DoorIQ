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
  
  // Audio recording only (video is handled by dual camera compositor in trainer page)
  const { isRecording: isAudioRecording, startRecording: startAudioRecording, stopRecording: stopAudioRecording } = useSessionRecording(sessionId)
  
  // Track recording state with refs for reliable cleanup
  const audioRecordingActiveRef = useRef(false)
  const wasConnectedRef = useRef(false) // Track if we were ever connected to detect actual disconnects

  const dispatchStatus = (s: 'disconnected' | 'connecting' | 'connected' | 'error') => {
    window.dispatchEvent(new CustomEvent('connection:status', { detail: s === 'connected' ? 'connected' : s === 'connecting' ? 'connecting' : s === 'error' ? 'error' : 'idle' }))
  }

  const start = useCallback(async () => {
    console.log('🎬 start() called')
    console.log('🎟️ currentToken:', currentToken ? currentToken.substring(0, 30) + '...' : 'MISSING')
    console.log('🤖 agentId:', agentId)

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
          
          // Dispatch agent:end_call event when disconnecting during active session
          // This is a reliable signal that ElevenLabs has ended the conversation
          if (wasConnectedRef.current) {
            console.log('🔌 Disconnect detected during active session, dispatching agent:end_call event')
            window.dispatchEvent(new CustomEvent('agent:end_call', { 
              detail: { 
                reason: reason || 'Connection ended',
                source: 'disconnect'
              } 
            }))
            wasConnectedRef.current = false // Reset for next connection
          }
          
          setStatus('disconnected')
          dispatchStatus('disconnected')
          
          // Stop audio recording when conversation ends
          console.log('🛑 onDisconnect - audioRecordingActive:', audioRecordingActiveRef.current)
          if (audioRecordingActiveRef.current) {
            console.log('🛑 Calling stopAudioRecording from onDisconnect')
            stopAudioRecording()
            audioRecordingActiveRef.current = false
          } else {
            console.log('ℹ️ onDisconnect called but audio recording was not active')
          }
        },
        
        onModeChange: (mode: any) => {
          console.log('🎯 Mode changed:', mode)
          // Mode can be: 'speaking', 'listening', 'idle', etc.
          window.dispatchEvent(new CustomEvent('agent:mode', { detail: mode }))
        },
        
        onStatusChange: (status: any) => {
          console.log('📊 Status changed:', status)
          window.dispatchEvent(new CustomEvent('agent:status', { detail: status }))
        },
        
        onMessage: (msg: any) => {
          console.log('📨 RAW MESSAGE FROM ELEVENLABS:', JSON.stringify(msg, null, 2))
          console.log('📨 Message type:', msg?.type)
          console.log('📨 Message keys:', Object.keys(msg || {}))
          window.dispatchEvent(new CustomEvent('agent:message', { detail: msg }))
          
          // Check for end_call tool invocation in multiple possible formats
          let endCallDetected = false
          
          // Format 1: Direct tool_call or function_call type
          if (msg?.type === 'tool_call' || msg?.type === 'function_call') {
            const toolName = msg?.tool_name || msg?.name || msg?.function_name
            console.log('🔍 Checking tool call, name:', toolName)
            if (toolName === 'end_call') {
              console.log('🛑 END_CALL TOOL DETECTED (Format 1)!')
              endCallDetected = true
              const endCallData = {
                reason: msg?.arguments?.reason || msg?.parameters?.reason || 'Agent ended call',
                notes: msg?.arguments?.notes || msg?.parameters?.notes || ''
              }
              console.log('🎯 Dispatching agent:end_call event with data:', endCallData)
              window.dispatchEvent(new CustomEvent('agent:end_call', { detail: endCallData }))
            }
          }
          
          // Format 2: Inside conversation_updated messages
          if (msg?.type === 'conversation_updated' && !endCallDetected) {
            const messages = msg?.conversation?.messages || []
            console.log('🔍 Checking conversation_updated, message count:', messages.length)
            
            // Check last few messages for tool calls
            const recentMessages = messages.slice(-3)
            recentMessages.forEach((m: any, idx: number) => {
              console.log(`🔍 Message ${messages.length - 3 + idx}: role=${m?.role}, has tool_calls=${!!m?.tool_calls}`)
              
              if (m?.role === 'tool_call' || m?.role === 'function' || m?.tool_calls?.length > 0) {
                const toolCalls = m?.tool_calls || [m]
                toolCalls.forEach((tc: any) => {
                  const toolName = tc?.function?.name || tc?.name || tc?.tool_name || tc?.type
                  console.log('🔍 Tool call found:', toolName)
                  
                  if (toolName === 'end_call') {
                    console.log('🛑 END_CALL TOOL DETECTED (Format 2 - conversation_updated)!')
                    endCallDetected = true
                    const args = typeof tc?.function?.arguments === 'string' 
                      ? JSON.parse(tc.function.arguments) 
                      : (tc?.function?.arguments || tc?.arguments || {})
                    const endCallData = {
                      reason: args?.reason || 'Agent ended call',
                      notes: args?.notes || ''
                    }
                    console.log('🎯 Dispatching agent:end_call event with data:', endCallData)
                    window.dispatchEvent(new CustomEvent('agent:end_call', { detail: endCallData }))
                  }
                })
              }
            })
          }
          
          // Format 3: Check message content for end_call signals (fallback)
          if (!endCallDetected && msg?.type === 'conversation_updated') {
            const messages = msg?.conversation?.messages || []
            const lastMsg = messages[messages.length - 1]
            const content = lastMsg?.content?.toLowerCase() || ''
            
            // Look for phrases that indicate the conversation is ending
            const endPhrases = ['have a great day', 'goodbye', 'take care', 'talk to you later', 'see you then']
            if (endPhrases.some(phrase => content.includes(phrase))) {
              console.log('🛑 END PHRASE DETECTED in agent message:', content.substring(0, 50))
              // Don't dispatch end_call event for phrase detection, just log it
              // The actual end_call tool should be used by the agent
            }
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
            window.dispatchEvent(new CustomEvent('agent:user', { detail: userText }))
          }
          
          if (agentText) {
            console.log('🤖 AGENT TRANSCRIPT EXTRACTED:', agentText)
            console.log('🤖 Dispatching agent:response event with:', agentText)
            window.dispatchEvent(new CustomEvent('agent:response', { detail: agentText }))
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
              window.dispatchEvent(new CustomEvent('agent:delta', { detail: interimText }))
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
            } else if (msg?.type === 'audio') {
              console.log('🔊 Audio chunk')
            } else if (msg?.type !== 'transcript.delta' && msg?.type !== 'interim_transcript' && msg?.type) {
              console.log('ℹ️  Unhandled message type:', msg.type, '- Consider adding support if this contains transcript data')
            }
          }
        },
        
        onError: (err: any) => {
          console.error('❌ WebRTC Error:', err)
          const errMsg = err?.message || err?.error || err?.detail || 'Connection error'
          setErrorMessage(errMsg)
          setStatus('error')
          dispatchStatus('error')
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

  const stop = useCallback(async () => {
    try {
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
  }, [stopAudioRecording])

  useEffect(() => {
    if (autostart) {
      console.log('🎬 Autostart enabled, starting in 100ms...')
      const id = setTimeout(() => start(), 100)
      return () => clearTimeout(id)
    }
  }, [autostart, start])

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop audio recording on unmount
      if (audioRecordingActiveRef.current) {
        stopAudioRecording()
        audioRecordingActiveRef.current = false
      }
      
      if (conversationRef.current) {
        console.log('🧹 Cleaning up conversation on unmount')
        conversationRef.current.endSession().catch(() => {})
      }
    }
  }, [stopAudioRecording])

  // This component is headless
  return null
}
