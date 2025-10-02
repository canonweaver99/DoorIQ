'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Conversation } from '@elevenlabs/client'

type ElevenLabsConversationProps = {
  agentId: string
  signedUrl: string
  autostart?: boolean
}

export default function ElevenLabsConversation({ agentId, signedUrl, autostart = true }: ElevenLabsConversationProps) {
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

    try {
      if (conversationRef.current) {
        console.log('⚠️ Conversation already exists')
        return
      }

      console.log('🚀 Starting ElevenLabs conversation with agent:', agentId)
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

      // Try with signed URL first, fallback to agentId only if it fails
      let connectionConfig: any = { agentId }
      
      if (signedUrl) {
        console.log('🔐 Using signed URL for connection')
        connectionConfig.signedUrl = signedUrl
      } else {
        console.log('⚠️ No signed URL available, connecting with agentId only (public agent mode)')
      }

      console.log('🔌 Attempting to connect...')
      const convo = await Conversation.startSession({
        ...connectionConfig,
        onConnect: () => {
          console.log('✅ Connected to ElevenLabs')
          setStatus('connected')
          dispatchStatus('connected')
          setErrorMessage('')
        },
        onDisconnect: () => {
          console.log('🔌 Disconnected from ElevenLabs')
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
          console.error('❌ ElevenLabs SDK error:', err)
          const errMsg = err?.message || 'Connection error'
          setErrorMessage(errMsg)
          setStatus('error')
          dispatchStatus('error')
        },
      })

      conversationRef.current = convo
      console.log('✅ Conversation session started')
    } catch (err: any) {
      console.error('❌ Failed to start ElevenLabs conversation:', err)
      const errMsg = err?.message || 'Failed to connect'
      setErrorMessage(errMsg)
      setStatus('error')
      dispatchStatus('error')
    }
  }, [agentId, signedUrl])

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


