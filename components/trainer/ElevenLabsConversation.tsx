'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Conversation } from '@elevenlabs/client'

type ElevenLabsConversationProps = {
  agentId: string
  conversationToken: string
  autostart?: boolean
}

export default function ElevenLabsConversation({ agentId, conversationToken, autostart = true }: ElevenLabsConversationProps) {
  const conversationRef = useRef<any>(null)
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const dispatchStatus = (s: 'disconnected' | 'connecting' | 'connected' | 'error') => {
    window.dispatchEvent(new CustomEvent('connection:status', { detail: s === 'connected' ? 'connected' : s === 'connecting' ? 'connecting' : s === 'error' ? 'error' : 'idle' }))
  }

  const start = useCallback(async () => {
    console.log('🎬 start() called')
    console.log('🎟️ conversationToken:', conversationToken ? conversationToken.substring(0, 30) + '...' : 'MISSING')
    console.log('🤖 agentId:', agentId)

    if (!agentId) {
      console.error('❌ No agent ID provided')
      setErrorMessage('No agent ID provided')
      setStatus('error')
      dispatchStatus('error')
      return
    }

    if (!conversationToken) {
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
        conversationToken,
        connectionType: 'webrtc',
        
        onConnect: () => {
          console.log('✅ WebRTC Connected!')
          setStatus('connected')
          dispatchStatus('connected')
          setErrorMessage('')
        },
        
        onDisconnect: (reason?: any) => {
          console.log('🔌 Disconnected:', reason)
          setStatus('disconnected')
          dispatchStatus('disconnected')
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
      const errMsg = error?.message || error?.error || 'Failed to connect'
      setErrorMessage(errMsg)
      setStatus('error')
      dispatchStatus('error')
    }
  }, [agentId, conversationToken])

  const stop = useCallback(async () => {
    try {
      if (conversationRef.current) {
        await conversationRef.current.endSession()
        conversationRef.current = null
      }
      setStatus('disconnected')
      dispatchStatus('disconnected')
    } catch (e) {
      console.error('❌ Error ending conversation:', e)
    }
  }, [])

  useEffect(() => {
    if (autostart) {
      console.log('🎬 Autostart enabled, starting in 100ms...')
      const id = setTimeout(() => start(), 100)
      return () => clearTimeout(id)
    }
  }, [autostart, start])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        console.log('🧹 Cleaning up conversation on unmount')
        conversationRef.current.endSession().catch(() => {})
      }
    }
  }, [])

  // This component is headless
  return null
}
