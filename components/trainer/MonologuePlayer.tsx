'use client'

import { useCallback, useEffect, useState } from 'react'
import { useConversation } from '@elevenlabs/react'
import { useAmbientAudio } from '@/hooks/useAmbientAudio'

export default function MonologuePlayer() {
  const [hasStarted, setHasStarted] = useState(false)

  const conversation = useConversation({
    onConnect: () => {
      ;(window as any).__doorIQ_conversationActive = true
    },
    onDisconnect: () => {
      ;(window as any).__doorIQ_conversationActive = false
    },
    onError: (e) => console.error('ElevenLabs error:', e),
  })

  const [ambientState, ambientControls] = useAmbientAudio({
    assets: {
      ambience: {
        suburban: '/sounds/kids-background.mp3',
      },
      sfx: {
        doorKnock: '/sounds/knock.mp3',
        doorOpen: '/sounds/door_open.mp3',
        dogBark1: '/sounds/dog-bark-distant-1.mp3',
      },
    },
    levels: { ambience: 0.12, sfx: 0.35, voice: 1.0 },
    scheduling: { enabled: false, assetKeys: [], baseInterval: [25, 45] },
    integration: { enableElevenLabs: true, autoConnect: false },
  })

  const playMonologue = useCallback(async () => {
    try {
      setHasStarted(true)
      ;(window as any).__doorIQ_conversationActive = true

      // Ambient setup
      if (ambientState.isInitialized) {
        await ambientControls.startAmbience('suburban')
        setTimeout(() => { try { ambientControls.playSfx('dogBark1', 0.35) } catch {} }, 1000)
      }

      // Start session
      // Request mic permission (required by ElevenLabs even if we don't talk)
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch (e) {
        console.warn('Microphone permission not granted, attempting to continue…')
      }
      await conversation.startSession({
        agentId: 'agent_7001k5jqfjmtejvs77jvhjf254tz',
        connectionType: 'websocket',
      } as any)

      // Send monologue prompt
      setTimeout(() => {
        try {
          const prompt = `Please speak for about 30 seconds in a friendly, natural tone about what you were doing last weekend.
Mention a quick apology if there's a dog barking in the background, then smoothly continue your story without stopping.
Keep it casual and conversational, with light details (e.g., errands, family time, small home projects), and avoid asking questions.`

          const anyConv: any = conversation as any
          if (typeof anyConv?.sendUserMessage === 'function') anyConv.sendUserMessage({ text: prompt })
          else if (typeof anyConv?.sendMessage === 'function') anyConv.sendMessage(prompt)
          else if (typeof anyConv?.say === 'function') anyConv.say(prompt)
          else if (typeof anyConv?.send === 'function') anyConv.send(prompt)
          else console.warn('No known send method on conversation to deliver monologue prompt')
        } catch (e) {
          console.error('Failed to send monologue prompt:', e)
        }
      }, 1500)
    } catch (e) {
      console.error('Failed to play monologue:', e)
      setHasStarted(false)
    }
  }, [ambientControls, ambientState.isInitialized, conversation])

  // Cleanup ambience when component unmounts
  useEffect(() => () => { try { ambientControls.stopAmbience(); } catch {} }, [ambientControls])

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={playMonologue}
        disabled={hasStarted || conversation.status === 'connected'}
        className="px-5 py-3 bg-blue-600 text-white rounded-lg disabled:bg-gray-500 hover:bg-blue-700 transition-colors font-medium"
      >
        {hasStarted || conversation.status === 'connected' ? 'Playing…' : 'Play Austin Monologue (30s)'}
      </button>
      {ambientState.isLoading && (
        <div className="text-xs text-gray-400">Loading audio engine…</div>
      )}
      <div className="text-xs text-gray-400">Ambience: kids playing, dog bark, natural background</div>
    </div>
  )
}


