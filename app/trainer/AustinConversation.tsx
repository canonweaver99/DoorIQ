'use client'

import { useConversation } from '@elevenlabs/react'
import { useCallback, useEffect } from 'react'

export default function AustinConversation({ autostart }: { autostart?: boolean }) {
  const conversation = useConversation({
    onConnect: () => console.log('ElevenLabs connected'),
    onDisconnect: () => console.log('ElevenLabs disconnected'),
    onMessage: (message) => console.log('ElevenLabs message:', message),
    onError: (error) => console.error('ElevenLabs error:', error),
  })

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      await conversation.startSession({
        agentId: 'agent_7001k5jqfjmtejvs77jvhjf254tz',
        connectionType: 'websocket',
        signedUrl: undefined,
        conversationToken: undefined,
      } as any)
    } catch (err) {
      console.error('Failed to start conversation:', err)
    }
  }, [conversation])

  const stopConversation = useCallback(async () => {
    await conversation.endSession()
  }, [conversation])

  useEffect(() => {
    if (autostart && conversation.status !== 'connected') {
      startConversation()
    }
  }, [autostart, conversation.status, startConversation])

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2">
        <button
          onClick={startConversation}
          disabled={conversation.status === 'connected'}
          className="px-3 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
        >
          Start Conversation
        </button>
        <button
          onClick={stopConversation}
          disabled={conversation.status !== 'connected'}
          className="px-3 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
        >
          Stop
        </button>
      </div>
      <div className="text-sm text-gray-600">
        <p>Status: {conversation.status}</p>
        <p>Agent is {conversation.isSpeaking ? 'speaking' : 'listening'}</p>
      </div>
    </div>
  )
}


