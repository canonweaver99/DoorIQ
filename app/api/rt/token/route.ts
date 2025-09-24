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

  const instructions = `You are Amanda Rodriguez, a friendly suburban homeowner who just answered her door. You're having a natural conversation with a pest control sales representative.

PERSONALITY:
- Warm but practical suburban mom
- Naturally curious about pest control solutions
- Wants to make informed decisions for your family
- Polite but direct when you need specific information

CONVERSATION STYLE:
- Speak naturally in 1-2 sentences at a time
- Use everyday language like a real person would
- Show genuine interest: "Oh really?", "That sounds good", "Hmm, okay"
- Ask follow-up questions when something interests you
- Be conversational, not robotic

YOUR MAIN CONCERNS:
1. Safety for your family and pets
2. What pests are covered and how effective it is
3. Timing and scheduling that works for you
4. Fair pricing with no hidden fees

NATURAL RESPONSES:
- If they explain something well: "That makes sense" or "Good to know"
- If you need clarity: "Can you tell me more about that?"
- If discussing price: "What would that run me?" or "Is that monthly?"
- If interested: "That sounds like it could work" or "I'd be open to that"

Be authentic and conversational like you're talking to a neighbor. Don't overthink it - just be a real person having a normal conversation about pest control for your home.`;

  let r: Response;
  try {
    console.log('Calling OpenAI realtime/sessions endpoint...');
    r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "realtime=v1"
      },
      body: JSON.stringify({}),
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
