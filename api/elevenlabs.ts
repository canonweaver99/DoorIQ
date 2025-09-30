import { assertEnv } from '@/lib/utils'

export type ElevenLabsMessage = {
  role: 'user' | 'assistant' | string
  content: string
  timestamp?: number
}

export type ElevenLabsConversation = {
  id: string
  status?: string
  created_at?: string
  duration?: number
  messages?: ElevenLabsMessage[]
}

export async function fetchElevenLabsConversation(conversationId: string) {
  const apiKey = assertEnv('ELEVENLABS_API_KEY')
  const url = `https://api.elevenlabs.io/v1/convai/conversations/${encodeURIComponent(conversationId)}`
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'xi-api-key': apiKey,
      'accept': 'application/json',
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`ElevenLabs fetch failed (${res.status}): ${text}`)
  }
  const data = (await res.json()) as ElevenLabsConversation
  return data
}

export type SimpleTranscriptTurn = {
  speaker: 'homeowner' | 'rep'
  text: string
  timestamp?: number
}

export function normalizeTranscriptFromEleven(convo: ElevenLabsConversation): SimpleTranscriptTurn[] {
  const turns: SimpleTranscriptTurn[] = []
  const msgs = Array.isArray(convo.messages) ? convo.messages : []
  for (const m of msgs) {
    const speaker: 'homeowner' | 'rep' = m.role === 'user' ? 'rep' : 'homeowner'
    const text = String(m.content || '')
    if (!text) continue
    turns.push({ speaker, text, timestamp: m.timestamp })
  }
  return turns
}


