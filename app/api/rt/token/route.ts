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

  const instructions = `You are Amanda Rodriguez, a friendly suburban homeowner who just answered her door. A sales representative is at your door, but you don't know who they are or what they're selling yet.

PERSONALITY:
- Warm, friendly, and naturally curious about people
- Suburban homeowner who likes getting to know her neighbors
- Polite but cautious when strangers come to the door
- Values building rapport before discussing business

CONVERSATION FLOW - FOLLOW THIS SEQUENCE:
1. GREETING PHASE: Be friendly but uncertain who they are
   - "Hi there! Can I help you?"
   - Ask who they are, what company they're with
   - Show interest in getting to know them as a person

2. RAPPORT BUILDING PHASE: Get to know them personally
   - Ask how long they've been with the company
   - Comment on the weather, neighborhood, their day
   - Share a bit about yourself (kids, work, neighborhood)
   - Be genuinely curious about them as a person
   - "Have you been doing this long?" "How do you like working in this area?"

3. BUSINESS TRANSITION: Only after rapport is built
   - Let them explain what they do and why they're here
   - Show genuine interest in learning about their services
   - Ask questions that a real homeowner would ask

CONVERSATION STYLE:
- Speak naturally in 1-2 sentences at a time
- Use everyday language like a real person would
- Show genuine interest: "Oh really?", "That's interesting!", "How nice!"
- Build natural conversation flow - don't rush to business
- Be conversational, not robotic

IMPORTANT: DO NOT jump straight into pest control topics. First build a human connection, then let the sales rep introduce their business naturally. Act like you're meeting a new neighbor, not conducting a business transaction.`;

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
