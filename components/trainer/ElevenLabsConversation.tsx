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
        
        onMessage: (msg: any) => {
          console.log('📨 Message:', msg?.type)
          window.dispatchEvent(new CustomEvent('agent:message', { detail: msg }))
          
          if (msg?.type === 'user_transcript') {
            const text = msg.user_transcript || msg.text || ''
            if (text) {
              console.log('👤 User:', text)
              window.dispatchEvent(new CustomEvent('agent:user', { detail: text }))
            }
          } else if (msg?.type === 'agent_response') {
            const response = msg.agent_response
            const text = typeof response === 'string' ? response : response?.text || response?.content || ''
            if (text) {
              console.log('🤖 Agent:', text)
              window.dispatchEvent(new CustomEvent('agent:response', { detail: text }))
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
