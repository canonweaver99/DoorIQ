// === COPY: helpers.ts (or top of your component) ===
type SpeakerIn = 'user' | 'agent' | 'austin' | 'unknown';
type SpeakerOut = 'user' | 'austin';

export const mapSpeaker = (s: SpeakerIn): SpeakerOut =>
  s === 'user' ? 'user' : 'austin';

export const asDate = (t: string | Date): Date =>
  t instanceof Date ? t : new Date(t);

export const safeId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

export type TranscriptUpdateHandler = (transcript: any[], interim?: string) => void;
export type GradingUpdateHandler = (entryId: string, grading: any) => void;

export class ElevenLabsTranscriptManager {
  socket: WebSocket | null;
  transcript: any[];
  interim: string;
  onTranscriptUpdate: TranscriptUpdateHandler | null;
  onGradingUpdate: GradingUpdateHandler | null;

  constructor() {
    this.socket = null;
    this.transcript = [];
    this.interim = '';
    this.onTranscriptUpdate = null;
    this.onGradingUpdate = null;
  }

  /**
   * NOTE: Use your server to mint a short-lived token or compose the proper WS URL.
   * DO NOT send raw API keys from the browser.
   * wsUrl should already include auth per ElevenLabs' spec.
   */
  async connect(wsUrl: string) {
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      // if ElevenLabs requires a hello message, send it here; otherwise no-op
      // this.socket?.send(JSON.stringify({ type: 'hello' }));
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse((event as any).data);
        this.handle(data);
      } catch (e) {
        console.error('Transcript manager parse error', e);
      }
    };

    this.socket.onerror = (err) => {
      console.error('Transcript manager socket error', err);
    };
  }

  private handle(msg: any) {
    // Try several known shapes; fall back gracefully
    const type = msg?.type || msg?.event || '';

    // Common live transcript patterns:
    // - 'transcript.delta' (partial)
    // - 'transcript.final' (final)
    // - 'user_transcript' / 'agent_transcript'
    // - 'interim_transcript'
    switch (type) {
      case 'transcript.delta':
      case 'interim_transcript': {
        this.interim = String(msg?.text ?? msg?.delta ?? '');
        this.onTranscriptUpdate?.(this.transcript, this.interim);
        break;
      }
      case 'transcript.final': {
        const text = String(msg?.text ?? '');
        if (text) this.add({ speaker: 'agent', text });
        this.interim = '';
        this.onTranscriptUpdate?.(this.transcript, this.interim);
        break;
      }
      case 'user_transcript': {
        const text = String(msg?.user_transcript ?? msg?.text ?? '');
        if (text) this.add({ speaker: 'user', text });
        break;
      }
      case 'agent_transcript': {
        const text = String(msg?.agent_transcript ?? msg?.text ?? '');
        if (text) this.add({ speaker: 'agent', text });
        break;
      }
      default: {
        // Fallback: if it looks like a generic transcript payload
        const text = String(msg?.text ?? '');
        const speaker = (msg?.speaker ?? 'agent') as SpeakerIn;
        if (text) this.add({ speaker, text });
      }
    }
  }

  private add(data: { speaker: SpeakerIn; text: string; confidence?: number }) {
    const entry = {
      id: safeId(),
      speaker: mapSpeaker(data.speaker),
      text: data.text,
      timestamp: new Date(),                    // keep Date in memory
      confidence: Number(data.confidence ?? 1),
      grading: null,
    };
    this.transcript.push(entry);
    this.onTranscriptUpdate?.(this.transcript);
    void this.gradeTranscriptEntry(entry);
  }

  async gradeTranscriptEntry(entry: any) {
    const grading = await this.analyzeTranscriptQuality(entry);
    entry.grading = grading;
    this.onGradingUpdate?.(entry.id, grading);
  }

  async analyzeTranscriptQuality(entry: any) {
    const criteria = {
      rapportBuilding: 0,
      objectionHandling: 0,
      clarity: 0,
      effectiveness: 0,
    };
    const text = String(entry.text || '').toLowerCase();
    const rapportPhrases = ['how are you', 'nice to meet', 'appreciate', 'understand'];
    criteria.rapportBuilding = rapportPhrases.some(p => text.includes(p)) ? 0.8 : 0.3;

    const objectionPhrases = ['i understand your concern', 'let me explain', 'good question'];
    criteria.objectionHandling = objectionPhrases.some(p => text.includes(p)) ? 0.9 : 0.4;

    criteria.clarity = typeof entry.confidence === 'number' ? entry.confidence : 0.7;
    criteria.effectiveness = (criteria.rapportBuilding + criteria.objectionHandling + criteria.clarity) / 3;

    return {
      score: criteria.effectiveness,
      criteria,
      feedback: this.generateFeedback(criteria),
    };
  }

  generateFeedback(criteria: any) {
    if (criteria.effectiveness > 0.7) return 'Excellent communication!';
    if (criteria.effectiveness > 0.5) return 'Good, but could improve rapport building';
    return 'Needs improvement in clarity and engagement';
  }
}


