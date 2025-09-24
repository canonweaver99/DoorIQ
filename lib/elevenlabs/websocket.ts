export interface ElevenLabsConfig {
  agentId: string
  apiKey: string
}

export class ElevenLabsWebSocket {
  private ws: WebSocket | null = null
  private config: ElevenLabsConfig
  private onMessage?: (message: any) => void
  private onConnect?: () => void
  private onDisconnect?: () => void

  constructor(config: ElevenLabsConfig) {
    this.config = config
  }

  connect(callbacks?: {
    onMessage?: (message: any) => void
    onConnect?: () => void
    onDisconnect?: () => void
  }) {
    this.onMessage = callbacks?.onMessage
    this.onConnect = callbacks?.onConnect
    this.onDisconnect = callbacks?.onDisconnect

    // Use the correct ElevenLabs WebSocket endpoint
    const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${this.config.agentId}&xi-api-key=${this.config.apiKey}`
    
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      console.log('ElevenLabs WebSocket connected')
      this.onConnect?.()
    }

    this.ws.onmessage = (event) => {
      try {
        // ElevenLabs can send either JSON strings or binary audio chunks
        if (typeof event.data === 'string') {
          const data = JSON.parse(event.data)
          this.onMessage?.(data)
        } else if (event.data instanceof ArrayBuffer) {
          // Binary audio - convert to base64 and emit as audio_chunk
          const bytes = new Uint8Array(event.data)
          let binary = ''
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
          const base64 = btoa(binary)
          this.onMessage?.({ type: 'audio_chunk', audio_chunk: base64 })
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error)
      }
    }

    this.ws.onclose = () => {
      console.log('ElevenLabs WebSocket disconnected')
      this.onDisconnect?.()
    }

    this.ws.onerror = (error) => {
      console.error('ElevenLabs WebSocket error:', error)
    }
  }

  sendAudio(audioData: ArrayBuffer) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(audioData)
    }
  }

  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
