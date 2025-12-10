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
  sessionActive?: boolean
  onAgentEndCall?: (reason: EndCallReason) => void
}

export default function ElevenLabsConversation({ 
  agentId, 
  conversationToken, 
  autostart = true, 
  sessionId = null,
  sessionActive = true,
  onAgentEndCall
}: ElevenLabsConversationProps) {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const conversationRef = useRef<any>(null)
  const onAgentEndCallRef = useRef(onAgentEndCall)
  const sessionIdRef = useRef(sessionId)
  const endCallTriggeredRef = useRef(false)

  // Update refs when props change
  useEffect(() => {
    onAgentEndCallRef.current = onAgentEndCall
    sessionIdRef.current = sessionId
  }, [onAgentEndCall, sessionId])

  // Audio recording hook
  const { startRecording: startAudioRecording, stopRecording: stopAudioRecording } = useSessionRecording(sessionId)

  // Dispatch status event helper
  const dispatchStatus = useCallback((newStatus: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('connection:status', { detail: newStatus }))
    }
  }, [])

  // Start conversation
  const start = useCallback(async () => {
    // Validation
    if (!agentId) {
      console.error('❌ No agent ID provided')
      setErrorMessage('No agent ID provided')
      setStatus('error')
      return
    }

    if (!conversationToken) {
      console.error('❌ No conversation token provided')
      setErrorMessage('No conversation token provided')
      setStatus('error')
      return
    }

    if (!sessionId) {
      console.error('❌ No sessionId provided')
      setErrorMessage('No session ID - conversation can only start during active training session')
      setStatus('error')
      return
    }

    // Check if we're on an allowed page
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      const isAllowedPage = currentPath.includes('/trainer') || currentPath.includes('/eleven-labs-test')
      if (!isAllowedPage) {
        console.error('❌ Not on allowed page')
        setErrorMessage('Conversation can only start on trainer page or test page')
        setStatus('error')
        return
      }
    }

    // Don't start if already connected or connecting
    if (conversationRef.current || status === 'connecting' || status === 'connected') {
      console.log('⚠️ Conversation already exists or in progress')
      return
    }

    try {
      console.log('🎤 Requesting microphone permission...')
      await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('✅ Microphone permission granted')

      setStatus('connecting')
      dispatchStatus('connecting')
      setErrorMessage('')
      endCallTriggeredRef.current = false

      console.log('🚀 Starting ElevenLabs conversation with WebRTC...')
      
      const conversation = await Conversation.startSession({
        conversationToken,
        connectionType: 'webrtc',
        clientTools: {
          end_call: async (parameters: { reason?: string }) => {
            const reason = (parameters?.reason || 'goodbye') as EndCallReason
            
            console.log('🚪 end_call tool triggered by AI:', reason)
            
            if (endCallTriggeredRef.current) {
              console.log('⚠️ end_call already triggered, ignoring duplicate')
              return 'Call already ending'
            }
            
            endCallTriggeredRef.current = true

            // Dispatch event
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('agent:end_call', {
                detail: {
                  reason,
                  sessionId: sessionIdRef.current,
                  timestamp: Date.now()
                }
              }))
            }

            // Call callback
            if (onAgentEndCallRef.current) {
              setTimeout(() => {
                onAgentEndCallRef.current?.(reason)
              }, 1500)
            }

            return `Call ended: ${reason}`
          }
        },
        onConnect: () => {
          console.log('✅ WebRTC Connected!')
          setStatus('connected')
          dispatchStatus('connected')
          setErrorMessage('')

          // Resume audio context if suspended (browser autoplay policy)
          if (typeof window !== 'undefined' && window.AudioContext) {
            try {
              const audioContext = new AudioContext()
              if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                  console.log('🔊 Audio context resumed')
                  audioContext.close()
                }).catch(() => {
                  audioContext.close()
                })
              } else {
                audioContext.close()
              }
            } catch (e) {
              console.warn('⚠️ Could not check audio context:', e)
            }
          }

          // Start audio recording
          if (sessionIdRef.current) {
            console.log('🎙️ Starting audio recording for session:', sessionIdRef.current)
            startAudioRecording()
          }
        },
        onDisconnect: (reason?: any) => {
          console.log('🔌 Disconnected:', reason)
          setStatus('disconnected')
          dispatchStatus('disconnected')

          // Stop audio recording
          stopAudioRecording()

          // Dispatch disconnect event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('agent:disconnect', {
              detail: {
                reason: reason || 'Unknown',
                sessionId: sessionIdRef.current
              }
            }))
          }
        },
        onMessage: (message: any) => {
          // Log message for debugging
          if (message?.type === 'conversation_updated') {
            const messages = message?.conversation?.messages || []
            if (messages.length > 0) {
              const lastMsg = messages[messages.length - 1]
              if (lastMsg?.role === 'assistant' && lastMsg?.content) {
                console.log('🤖 Agent:', lastMsg.content.substring(0, 100))
              }
            }
          }

          // Dispatch message event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('agent:message', { detail: message }))
          }
        },
        onError: (err: any) => {
          const errMsg = err?.message || err?.error || err?.detail || String(err) || 'Connection error'
          const errStr = String(errMsg).toLowerCase()

          // Suppress harmless WebRTC timing warnings
          const isHarmlessError = (
            errStr.includes('cannot send signal request before connected') ||
            errStr.includes('trickle') ||
            errStr.includes('ice candidate') ||
            errStr.includes('datachannel') && errStr.includes('lossy')
          )

          if (isHarmlessError) {
            console.log('ℹ️ Suppressing harmless WebRTC warning:', errMsg)
            return
          }

          console.error('❌ ElevenLabs Error:', err)
          setErrorMessage(errMsg)
          setStatus('error')
          dispatchStatus('error')

          // Dispatch error event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('agent:error', {
              detail: {
                error: errMsg,
                errorDetails: err,
                sessionId: sessionIdRef.current
              }
            }))
          }
        }
      })

      conversationRef.current = conversation
      console.log('✅ Conversation started successfully')
      
    } catch (error: any) {
      console.error('❌ Failed to start conversation:', error)
      const errMsg = error?.name === 'NotAllowedError' 
        ? 'Microphone blocked by browser' 
        : (error?.message || error?.error || 'Failed to connect')
      setErrorMessage(errMsg)
      setStatus('error')
      dispatchStatus('error')
      
      if (error?.name === 'NotAllowedError') {
        alert('Microphone access is blocked. Please allow microphone access and try again.')
      }
    }
  }, [agentId, conversationToken, sessionId, status, dispatchStatus, startAudioRecording, stopAudioRecording])

  // Stop conversation
  const stop = useCallback(async () => {
    try {
      if (conversationRef.current) {
        console.log('🛑 Stopping conversation...')
        await conversationRef.current.endSession()
        conversationRef.current = null
      }
      stopAudioRecording()
      setStatus('disconnected')
      dispatchStatus('disconnected')
    } catch (e) {
      console.error('❌ Error stopping conversation:', e)
    }
  }, [stopAudioRecording, dispatchStatus])

  // Auto-start when conditions are met
  useEffect(() => {
    if (autostart && sessionId && conversationToken && agentId && status === 'disconnected') {
      console.log('🎬 Autostart enabled, starting conversation...')
      const timer = setTimeout(() => {
        start()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [autostart, sessionId, conversationToken, agentId, status, start])

  // Cleanup on unmount or when session becomes inactive
  useEffect(() => {
    if (!sessionActive && conversationRef.current) {
      console.log('🛑 Session inactive, stopping conversation...')
      stop()
    }
  }, [sessionActive, stop])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        console.log('🧹 Cleaning up conversation on unmount...')
        conversationRef.current.endSession().catch((err: any) => {
          console.error('❌ Error ending session on unmount:', err)
        })
        conversationRef.current = null
      }
      stopAudioRecording()
    }
  }, [stopAudioRecording])

  // This component doesn't render anything - it's just a connection manager
  return null
}
