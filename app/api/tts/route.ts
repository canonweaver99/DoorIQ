// app/api/tts/route.ts
import { NextResponse } from "next/server";
export const runtime = "edge";

// ElevenLabs voice IDs for Amanda - choose one that fits
const AMANDA_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel voice (clear, professional)
// Alternative voices:
// "EXAVITQu4vr4xnSDxMaL" - Bella (warm, friendly)
// "pNInz6obpgDQGcFmaJgB" - Adam (if you want male)

export async function POST(req: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY missing in environment" },
      { status: 500 }
    );
  }

  try {
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: "Invalid text input" },
        { status: 400 }
      );
    }

    console.log('Generating ElevenLabs speech for:', text.substring(0, 50) + '...');

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${AMANDA_VOICE_ID}`,
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
            stability: 0.45,        // Lower = more expressive
            similarity_boost: 0.85, // Higher = more consistent
            style: 0.3,            // Conversational style
            use_speaker_boost: true
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', response.status, error);
      return NextResponse.json(
        { error: "TTS generation failed", detail: error },
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
