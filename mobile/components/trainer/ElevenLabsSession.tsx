import { useEffect, useRef, useState } from 'react'
import { Audio } from 'expo-av'
import { DeviceEventEmitter } from 'react-native'

interface ElevenLabsSessionProps {
  agentId: string
  conversationToken: string
  sessionId: string | null
}

// Simplified WebSocket-based ElevenLabs integration for React Native
export function ElevenLabsSession({
  agentId,
  conversationToken,
  sessionId,
}: ElevenLabsSessionProps) {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const audioRef = useRef<Audio.Sound | null>(null)

  useEffect(() => {
    startSession()

    return () => {
      stopSession()
    }
  }, [agentId, conversationToken])

  const startSession = async () => {
    try {
      // Request audio permissions
      await Audio.requestPermissionsAsync()
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      setStatus('connecting')

      // Connect to ElevenLabs WebSocket
      // Note: This is a simplified implementation
      // The actual WebSocket URL and protocol would need to be obtained from ElevenLabs documentation
      const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?token=${conversationToken}`
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('✅ ElevenLabs WebSocket connected')
        setStatus('connected')

        // Start audio recording
        startAudioRecording()
      }

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data)

          // Handle different message types
          if (data.type === 'audio') {
            // Play received audio
            await playAudio(data.audio)
          } else if (data.type === 'transcript') {
            // Emit transcript events
            if (data.speaker === 'user') {
              DeviceEventEmitter.emit('agent:user', { detail: data.text })
            } else {
              DeviceEventEmitter.emit('agent:response', { detail: data.text })
            }
          } else if (data.type === 'end_call') {
            // Session ended by agent
            DeviceEventEmitter.emit('agent:end_call', { detail: { reason: data.reason } })
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setStatus('disconnected')
      }

      ws.onclose = () => {
        console.log('WebSocket closed')
        setStatus('disconnected')
        stopAudioRecording()
      }
    } catch (error) {
      console.error('Error starting session:', error)
      setStatus('disconnected')
    }
  }

  const stopSession = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    stopAudioRecording()
    setStatus('disconnected')
  }

  const startAudioRecording = async () => {
    try {
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        async (recordingStatus) => {
          // Send audio chunks to WebSocket
          if (recordingStatus.isRecording && wsRef.current?.readyState === WebSocket.OPEN) {
            // In a real implementation, you would capture audio chunks and send them
            // This is a placeholder for the actual audio streaming logic
          }
        }
      )
      // Store recording reference
      audioRef.current = recording as any
    } catch (error) {
      console.error('Error starting audio recording:', error)
    }
  }

  const stopAudioRecording = async () => {
    try {
      if (audioRef.current) {
        await audioRef.current.stopAndUnloadAsync()
        audioRef.current = null
      }
    } catch (error) {
      console.error('Error stopping audio recording:', error)
    }
  }

  const playAudio = async (audioData: string) => {
    try {
      // Decode and play audio
      // This would need proper audio decoding based on the format ElevenLabs sends
      // For now, this is a placeholder
      console.log('Playing audio chunk')
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }

  // This component doesn't render anything - it just manages the WebSocket connection
  return null
}

