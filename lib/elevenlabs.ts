const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';

export const VOICE_IDS = {
  rachel: 'EXAVITQu4vr4xnSDxMaL', // Female, versatile
  adam: 'pNInz6obpgDQGcFmaJgB', // Male, friendly
  bella: '21m00Tcm4TlvDq8ikWAM', // Female, young
  josh: 'TxGEqnHWrfWFTfGW9XjX', // Male, professional
} as const;

export interface VoiceSettings {
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export class ElevenLabsClient {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || ELEVENLABS_API_KEY;
  }

  async textToSpeech(
    text: string,
    voiceId: string = VOICE_IDS.rachel,
    settings?: VoiceSettings
  ): Promise<ArrayBuffer> {
    const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: settings?.stability ?? 0.5,
          similarity_boost: settings?.similarity_boost ?? 0.5,
          style: settings?.style ?? 0.5,
          use_speaker_boost: settings?.use_speaker_boost ?? true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  async speechToText(audioData: string): Promise<{ text: string; confidence?: number }> {
    const response = await fetch(`${this.baseUrl}/speech-to-text`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio: audioData,
        model: 'eleven_english_sts_v2'
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getVoices() {
    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: {
        'xi-api-key': this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    return response.json();
  }
}

export const elevenLabsClient = new ElevenLabsClient();

