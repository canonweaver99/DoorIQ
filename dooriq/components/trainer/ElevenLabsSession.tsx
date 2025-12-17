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
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== 'granted') {
        console.error('Audio permission denied')
        setStatus('disconnected')
        return
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      })

      setStatus('connecting')

      // Connect to ElevenLabs WebSocket
      // Note: Mobile uses WebSocket instead of WebRTC due to React Native limitations
      // The conversation token should be obtained from the API
      const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?token=${conversationToken}`
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('✅ ElevenLabs WebSocket connected')
        setStatus('connected')

        // Start audio recording for session recording
        startAudioRecording()
      }

      ws.onmessage = async (event) => {
        try {
          // Handle both JSON and binary messages
          let data: any
          
          if (typeof event.data === 'string') {
            data = JSON.parse(event.data)
          } else {
            // Binary audio data - would need proper handling
            console.log('Received binary audio data')
            return
          }

          console.log('📨 Received message:', data.type)

          // Handle different message types based on ElevenLabs protocol
          if (data.type === 'audio' || data.audio) {
            // Audio data received - decode and play
            // Note: React Native audio handling is more complex than web
            // This is a placeholder - full implementation would require audio decoding
            console.log('🔊 Audio data received')
            // await playAudio(data.audio)
          } else if (data.type === 'transcript' || data.text) {
            // Transcript data
            const text = data.text || data.transcript
            const speaker = data.speaker || (data.role === 'user' ? 'user' : 'homeowner')
            
            if (text) {
              console.log(`📝 Transcript [${speaker}]:`, text)
              // Emit transcript events
              if (speaker === 'user') {
                DeviceEventEmitter.emit('agent:user', { detail: text })
              } else {
                DeviceEventEmitter.emit('agent:response', { detail: text })
              }
            }
          } else if (data.type === 'conversation_initiation' || data.type === 'ping') {
            // Connection keepalive
            console.log('💓 Ping received')
          } else if (data.type === 'end_call' || data.type === 'conversation_end') {
            // Session ended
            console.log('🔚 Conversation ended:', data.reason || 'Unknown')
            DeviceEventEmitter.emit('agent:end_call', { detail: { reason: data.reason || 'ended' } })
            stopSession()
          } else {
            // Unknown message type - log for debugging
            console.log('❓ Unknown message type:', data.type, data)
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setStatus('disconnected')
      }

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
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
      // Start recording for session archival
      // Note: This records locally but doesn't stream to ElevenLabs
      // ElevenLabs handles audio through WebSocket/WebRTC on their end
      const { recording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.m4a',
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
        },
        async (recordingStatus) => {
          // Recording status updates
          if (recordingStatus.isRecording) {
            // Could potentially send audio chunks to WebSocket here
            // but ElevenLabs handles this through their SDK/WebSocket protocol
          }
        }
      )
      audioRef.current = recording as any
      console.log('🎙️ Audio recording started for session archival')
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

  const playAudio = async (audioData: string | ArrayBuffer) => {
    try {
      // Note: React Native audio playback from WebSocket streams is complex
      // ElevenLabs typically handles audio playback through their SDK
      // This would require:
      // 1. Decoding the audio format (usually PCM or encoded audio)
      // 2. Creating an Audio.Sound instance
      // 3. Playing the decoded audio
      
      // For now, audio playback is handled by ElevenLabs through their WebSocket connection
      // The mobile app receives transcripts and displays them
      console.log('🔊 Audio playback would happen here - handled by ElevenLabs SDK')
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }

  // This component doesn't render anything - it just manages the WebSocket connection
  return null
}

