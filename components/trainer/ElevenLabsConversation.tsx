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

  const dispatchStatus = (s: 'disconnected' | 'connecting' | 'connected' | 'error') => {
    window.dispatchEvent(new CustomEvent('connection:status', { detail: s === 'connected' ? 'connected' : s === 'connecting' ? 'connecting' : s === 'error' ? 'error' : 'idle' }))
  }

  const start = useCallback(async () => {
    if (!agentId || !signedUrl) return
    try {
      if (conversationRef.current) return
      setStatus('connecting')
      dispatchStatus('connecting')

      // Ensure microphone permission
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch (e) {
        console.error('❌ Microphone permission denied:', e)
      }

      const convo = await Conversation.startSession({
        agentId,
        signedUrl,
        onConnect: () => {
          setStatus('connected')
          dispatchStatus('connected')
        },
        onDisconnect: () => {
          setStatus('disconnected')
          dispatchStatus('disconnected')
        },
        onMessage: (msg: any) => {
          // Bubble up as window events to integrate with existing page handlers
          window.dispatchEvent(new CustomEvent('agent:message', { detail: msg }))
          try {
            if (msg?.type === 'user_transcript') {
              const text = msg.user_transcript || msg.text || ''
              if (text) window.dispatchEvent(new CustomEvent('agent:user', { detail: text }))
            } else if (msg?.type === 'agent_response') {
              const response = msg.agent_response
              let text = ''
              if (typeof response === 'string') text = response
              else if (response?.text) text = response.text
              else if (response?.content) text = response.content
              if (text) window.dispatchEvent(new CustomEvent('agent:response', { detail: text }))
            }
          } catch (e) {
            console.error('❌ Error processing message:', e)
          }
        },
        onError: (err: any) => {
          console.error('❌ ElevenLabs SDK error:', err)
          setStatus('error')
          dispatchStatus('error')
        },
      })

      conversationRef.current = convo
    } catch (err) {
      console.error('❌ Failed to start ElevenLabs conversation:', err)
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


