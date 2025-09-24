// app/api/tts/route.ts
import { NextResponse } from "next/server";
export const runtime = "edge";

// ElevenLabs voice configuration for Amanda
// Voice can be overridden via env ELEVENLABS_VOICE_ID; defaults to Rachel (public voice)
const AMANDA_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Rachel

// Tunable voice settings with sensible defaults for a warm, conversational tone
const VOICE_STABILITY = Number.parseFloat(process.env.ELEVENLABS_STABILITY || "0.30");
const VOICE_SIMILARITY = Number.parseFloat(process.env.ELEVENLABS_SIMILARITY || "0.90");
const VOICE_STYLE = Number.parseFloat(process.env.ELEVENLABS_STYLE || "0.50");
const VOICE_SPEAKER_BOOST = (process.env.ELEVENLABS_SPEAKER_BOOST || "true").toLowerCase() !== "false";

export async function POST(req: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY missing in environment" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const text: string | undefined = body?.text;
    const overrideVoiceId: string | undefined = body?.voiceId;
    const overrideSettings = body?.voice_settings as {
      stability?: number;
      similarity_boost?: number;
      style?: number;
      use_speaker_boost?: boolean;
    } | undefined;
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: "Invalid text input" },
        { status: 400 }
      );
    }

    console.log('Generating ElevenLabs speech for:', text.substring(0, 50) + '...');
    const voiceId = (overrideVoiceId && typeof overrideVoiceId === 'string' ? overrideVoiceId : AMANDA_VOICE_ID).trim();
    console.log('Using voice ID:', voiceId);
    console.log('API Key present:', !!apiKey);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg"
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: overrideSettings?.stability ?? VOICE_STABILITY,
            similarity_boost: overrideSettings?.similarity_boost ?? VOICE_SIMILARITY,
            style: overrideSettings?.style ?? VOICE_STYLE,
            use_speaker_boost: overrideSettings?.use_speaker_boost ?? VOICE_SPEAKER_BOOST
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', response.status, error);
      
      // Try to parse error for better debugging
      let errorDetail;
      try {
        errorDetail = JSON.parse(error);
      } catch {
        errorDetail = error;
      }
      
      return NextResponse.json(
        { 
          error: "TTS generation failed", 
          status: response.status,
          detail: errorDetail,
          voice_id: voiceId
        },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    console.log('TTS generated successfully, size:', audioBuffer.byteLength);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store"
      }
    });
  } catch (error: any) {
    console.error('TTS route error:', error);
    return NextResponse.json(
      { error: "TTS processing failed", detail: error.message },
      { status: 500 }
    );
  }
}
