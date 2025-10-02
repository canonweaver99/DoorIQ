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
    if (!agentId) {
      console.error('❌ No agent ID provided')
      setErrorMessage('No agent ID provided')
      setStatus('error')
      dispatchStatus('error')
      return
    }

    if (!conversationToken) {
      console.error('❌ No conversation token provided')
      setErrorMessage('No conversation token provided. Failed to fetch token from server.')
      setStatus('error')
      dispatchStatus('error')
      return
    }

    try {
      if (conversationRef.current) {
        console.log('⚠️ Conversation already exists')
        return
      }

      console.log('🚀 Starting ElevenLabs conversation with agent:', agentId)
      console.log('🎟️ Token length:', conversationToken?.length)
      setStatus('connecting')
      dispatchStatus('connecting')
      setErrorMessage('')

      // Ensure microphone permission
      console.log('🎤 Requesting microphone permission...')
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        console.log('✅ Microphone permission granted')
      } catch (e) {
        console.error('❌ Microphone permission denied:', e)
        setErrorMessage('Microphone permission denied. Please allow microphone access.')
        setStatus('error')
        dispatchStatus('error')
        return
      }

      // Use WebRTC with conversation token
      console.log('🔐 Using WebRTC with conversation token')
      console.log('🎟️ Token:', conversationToken ? conversationToken.substring(0, 20) + '...' : 'MISSING')
      console.log('🎟️ Token full length:', conversationToken?.length)
      console.log('🎟️ Token type:', typeof conversationToken)
      console.log('🤖 Agent ID:', agentId)
      console.log('🔌 Attempting to connect...')
      
      console.log('📦 Creating session config object...')
      console.log('📦 conversationToken value:', conversationToken)
      console.log('📦 conversationToken typeof:', typeof conversationToken)
      
      const sessionConfig: any = {
        conversationToken,
        connectionType: 'webrtc',
        onConnect: () => {
          console.log('✅ Connected to ElevenLabs')
          setStatus('connected')
          dispatchStatus('connected')
          setErrorMessage('')
        },
          onDisconnect: (reason?: any) => {
            console.log('🔌 Disconnected from ElevenLabs')
            console.log('🔌 Disconnect reason:', reason)
            console.log('🔌 Disconnect reason type:', typeof reason)
            if (reason) {
              console.log('🔌 Disconnect reason keys:', Object.keys(reason))
              try {
                console.log('🔌 Disconnect reason JSON:', JSON.stringify(reason, null, 2))
              } catch (e) {
                console.log('🔌 Could not stringify disconnect reason')
              }
            }
            setStatus('disconnected')
            dispatchStatus('disconnected')
          },
          onMessage: (msg: any) => {
            console.log('📨 Message received:', msg?.type)
            // Bubble up as window events to integrate with existing page handlers
            window.dispatchEvent(new CustomEvent('agent:message', { detail: msg }))
            try {
              if (msg?.type === 'user_transcript') {
                const text = msg.user_transcript || msg.text || ''
                if (text) {
                  console.log('👤 User said:', text)
                  window.dispatchEvent(new CustomEvent('agent:user', { detail: text }))
                }
              } else if (msg?.type === 'agent_response') {
                const response = msg.agent_response
                let text = ''
                if (typeof response === 'string') text = response
                else if (response?.text) text = response.text
                else if (response?.content) text = response.content
                if (text) {
                  console.log('🤖 Agent said:', text)
                  window.dispatchEvent(new CustomEvent('agent:response', { detail: text }))
                }
              }
            } catch (e) {
              console.error('❌ Error processing message:', e)
            }
          },
          onError: (err: any) => {
            console.error('❌ ElevenLabs SDK onError callback triggered')
            console.error('❌ Error type:', typeof err)
            console.error('❌ Error object:', err)
            console.error('❌ Error constructor:', err?.constructor?.name)
            
            // Try to get keys
            if (err && typeof err === 'object') {
              console.error('❌ Error keys:', Object.keys(err))
              console.error('❌ Error own property names:', Object.getOwnPropertyNames(err))
              
              // Try JSON stringify
              try {
                console.error('❌ Error JSON:', JSON.stringify(err, null, 2))
              } catch (e) {
                console.error('❌ Could not stringify error')
              }
              
              // Try to log all properties
              for (const key in err) {
                console.error(`❌ Error.${key}:`, err[key])
              }
            }
            
            // Try multiple ways to extract error message
            const errMsg = 
              err?.message || 
              err?.error || 
              err?.detail || 
              err?.details ||
              err?.msg ||
              err?.description ||
              err?.reason ||
              err?.code ||
              (typeof err === 'string' ? err : null) ||
              'Connection error (no details available)'
            
            console.error('❌ Extracted error message:', errMsg)
            setErrorMessage(errMsg)
            setStatus('error')
            dispatchStatus('error')
          },
      }
      
      console.log('📦 Final session config:', JSON.stringify({
        hasToken: !!sessionConfig.conversationToken,
        tokenLength: sessionConfig.conversationToken?.length,
        connectionType: sessionConfig.connectionType,
        hasCallbacks: !!(sessionConfig.onConnect && sessionConfig.onError)
      }))
      
      console.log('🚀 Calling Conversation.startSession...')
      try {
        convo = await Conversation.startSession(sessionConfig)
      } catch (syncErr: any) {
        console.error('❌ Synchronous error during Conversation.startSession:', syncErr)
        console.error('❌ Sync error type:', typeof syncErr)
        console.error('❌ Sync error object:', syncErr)
        
        if (syncErr && typeof syncErr === 'object') {
          console.error('❌ Sync error keys:', Object.keys(syncErr))
          try {
            console.error('❌ Sync error JSON:', JSON.stringify(syncErr, null, 2))
          } catch (e) {
            console.error('❌ Could not stringify sync error')
          }
        }
        
        const errMsg = syncErr?.message || syncErr?.error || syncErr?.detail || 'Failed to start session'
        setErrorMessage(errMsg)
        setStatus('error')
        dispatchStatus('error')
        return
      }

      // Log the conversation object
      console.log('✅ Conversation object returned:', convo)
      console.log('✅ Conversation object type:', typeof convo)
      if (convo && typeof convo === 'object') {
        console.log('✅ Conversation object keys:', Object.keys(convo))
        console.log('✅ Conversation object constructor:', convo?.constructor?.name)
      }

      conversationRef.current = convo
      console.log('✅ Conversation session started successfully')
    } catch (err: any) {
      console.error('❌ Outer catch: Failed to start ElevenLabs conversation')
      console.error('❌ Outer error type:', typeof err)
      console.error('❌ Outer error object:', err)
      
      if (err && typeof err === 'object') {
        console.error('❌ Outer error keys:', Object.keys(err))
        try {
          console.error('❌ Outer error JSON:', JSON.stringify(err, null, 2))
        } catch (e) {
          console.error('❌ Could not stringify outer error')
        }
      }
      
      const errMsg = err?.message || err?.error || err?.detail || 'Failed to connect'
      console.error('❌ Final extracted error message:', errMsg)
      setErrorMessage(errMsg)
      setStatus('error')
      dispatchStatus('error')
    }
  }, [agentId, conversationToken])

  const stop = useCallback(async () => {
    try {
      await conversationRef.current?.endSession()
    } catch (e) {
      console.error('❌ Error ending conversation:', e)
    }
    conversationRef.current = null
    setStatus('disconnected')
    dispatchStatus('disconnected')
  }, [])

  useEffect(() => {
    if (autostart) {
      const id = setTimeout(() => start(), 100)
      return () => clearTimeout(id)
    }
  }, [autostart, start])

  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail
      if (!detail) return
      if (detail?.signedUrl && detail?.agentId) {
        // not used currently
      }
    }
    window.addEventListener('trainer:start-conversation', handler)
    return () => window.removeEventListener('trainer:start-conversation', handler)
  }, [])

  // This component is headless; page-level UI already exists
  return null
}


