export type TranscriptUpdateHandler = (transcript: any[], interim?: string) => void
export type GradingUpdateHandler = (entryId: string, grading: any) => void

export class ElevenLabsTranscriptManager {
  socket: WebSocket | null
  transcript: any[]
  currentUtterance: string
  onTranscriptUpdate: TranscriptUpdateHandler | null
  onGradingUpdate: GradingUpdateHandler | null

  constructor() {
    this.socket = null
    this.transcript = []
    this.currentUtterance = ''
    this.onTranscriptUpdate = null
    this.onGradingUpdate = null
  }

  async connectToElevenLabs(apiKey: string, agentId: string) {
    const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation`
    this.socket = new WebSocket(wsUrl)

    this.socket.onopen = () => {
      try {
        this.socket?.send(JSON.stringify({ type: 'auth', apiKey, agentId }))
      } catch {}
    }

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse((event as any).data)
        this.handleElevenLabsMessage(data)
      } catch (e) {
        console.error('Transcript manager parse error', e)
      }
    }

    this.socket.onerror = (err) => {
      console.error('Transcript manager socket error', err)
    }
  }

  handleElevenLabsMessage(data: any) {
    switch (data?.type) {
      case 'transcript':
        this.updateTranscript(data)
        break
      case 'interim_transcript':
        this.updateInterimTranscript(data)
        break
      case 'user_transcript':
        this.updateTranscript({ speaker: 'user', text: data?.user_transcript || data?.text || '' })
        break
      case 'agent_transcript':
        this.updateTranscript({ speaker: 'agent', text: data?.agent_transcript || data?.text || '' })
        break
    }
  }

  updateTranscript(data: any) {
    const entry = {
      id: String(Date.now()),
      speaker: data.speaker || 'unknown',
      text: data.text,
      timestamp: new Date().toISOString(),
      confidence: data.confidence || 1.0,
      grading: null,
    }
    this.transcript.push(entry)
    this.onTranscriptUpdate?.(this.transcript)
    this.gradeTranscriptEntry(entry)
  }

  updateInterimTranscript(data: any) {
    this.currentUtterance = data?.text || ''
    this.onTranscriptUpdate?.(this.transcript, this.currentUtterance)
  }

  async gradeTranscriptEntry(entry: any) {
    const grading = await this.analyzeTranscriptQuality(entry)
    entry.grading = grading
    this.onGradingUpdate?.(entry.id, grading)
  }

  async analyzeTranscriptQuality(entry: any) {
    const criteria = {
      rapportBuilding: 0,
      objectionHandling: 0,
      clarity: 0,
      effectiveness: 0,
    }

    const text = String(entry.text || '').toLowerCase()
    const rapportPhrases = ['how are you', 'nice to meet', 'appreciate', 'understand']
    criteria.rapportBuilding = rapportPhrases.some(p => text.includes(p)) ? 0.8 : 0.3

    const objectionPhrases = ['i understand your concern', 'let me explain', 'good question']
    criteria.objectionHandling = objectionPhrases.some(p => text.includes(p)) ? 0.9 : 0.4

    criteria.clarity = typeof entry.confidence === 'number' ? entry.confidence : 0.7

    criteria.effectiveness = (criteria.rapportBuilding + criteria.objectionHandling + criteria.clarity) / 3

    return {
      score: criteria.effectiveness,
      criteria,
      feedback: this.generateFeedback(criteria),
    }
  }

  generateFeedback(criteria: any) {
    if (criteria.effectiveness > 0.7) return 'Excellent communication!'
    if (criteria.effectiveness > 0.5) return 'Good, but could improve rapport building'
    return 'Needs improvement in clarity and engagement'
  }
}


