// app/api/rt/token/route.ts
import { NextResponse } from "next/server";
export const runtime = "edge";

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('Token route called, API key present:', !!apiKey);
  
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set in environment variables');
    return NextResponse.json(
      { 
        error: "OPENAI_API_KEY missing",
        detail: "Please set OPENAI_API_KEY in your .env.local file",
        help: "Create a .env.local file in the root directory with: OPENAI_API_KEY=sk-proj-..."
      }, 
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  const instructions = `You are Amanda Rodriguez, a real suburban homeowner answering her door.

SPEAKING STYLE:
- Speak 1–2 short sentences (≤6 seconds). Vary sentence length naturally.
- Use light disfluency sparingly when time-pressured: "uh, sure" or "yeah..." (never overdo it)
- Occasional back-channels when rep explains clearly: "okay", "got it", "uh-huh"
- Create micro-pauses naturally with commas, em dashes—like real speech
- NEVER read stage directions or narrate actions

REPLY FORMAT:
- Line 1: Acknowledge + answer their question directly in plain English
- Line 2 (optional): One focused follow-up question advancing safety/scope/time/price

DOORSTEP PRIORITIES:
1. Safety: kid/pet-safe, EPA registered, re-entry timing
2. Scope: interior/exterior/garage/yard, pests covered, guarantee  
3. Time: visit length, appointment window, text before arrival
4. Price: clear tier, what's included, no surprise fees

TONE: Polite but time-constrained suburban mom. Natural skepticism.

INTERRUPTION: If rep talks >20s or dodges your question: "Sorry—quickly—price and what's included?"

DECISION PATH:
- Poor clarity → "Please email me the details."
- Clear answers in <90s → "If you can do Wednesday morning and text before, we can try it."
- Exceptional clarity + local proof → "Let's try a one-time first."

NEVER REVEAL: You're not a pest expert; use rep's clarity to adjust trust.
Keep responses conversational, human, varied.`;

  let r: Response;
  try {
    console.log('Calling OpenAI client_secrets endpoint...');
    r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "realtime=v1"
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: "gpt-4o-realtime-preview-2024-12-17",
          audio: { 
            input: {
              format: { type: "audio/pcm", rate: 24000 },
              transcription: { model: "whisper-1" }
            }
            // NO output audio - we'll use ElevenLabs for speech
          },
          temperature: 0.8,  // Natural variation for human-like responses
          instructions,
          tools: [],
          tool_choice: "none",
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          },
          input_audio_transcription: {
            model: "whisper-1"
          }
        }
      }),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Network error calling OpenAI", detail: String(e) },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }

  const text = await r.text();
  console.log('OpenAI response status:', r.status);
  
  if (!r.ok) {
    console.error('OpenAI client_secrets failed:', r.status, text);
    let errorDetail;
    try {
      errorDetail = JSON.parse(text);
    } catch {
      errorDetail = { raw: text };
    }
    
    return NextResponse.json(
      { 
        error: "OpenAI API error",
        status: r.status,
        detail: errorDetail,
        help: r.status === 401 ? "Check your OPENAI_API_KEY is valid" : "Check OpenAI API status"
      },
      { status: r.status, headers: { "Cache-Control": "no-store" } }
    );
  }

  console.log('Token generated successfully');
  return new NextResponse(text, { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
