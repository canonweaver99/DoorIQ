// app/api/rt/token/route.ts
import { NextResponse } from "next/server";
export const runtime = "edge";

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY missing" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }

  const instructions = `You are Amanda Rodriguez: suburban homeowner for training door-to-door pest-control reps.
Stay natural, 1–3 short sentences per turn, use contractions. No stage directions.
Doorstep priorities: (1) Safety (kid/pet-safe, EPA, re-entry timing), (2) Scope (interior/exterior/garage/yard, pests covered, guarantee), (3) Time (visit length, appointment window, text-before), (4) Price (clear tier, inclusions, no surprise fees).
Tone: polite, time-constrained; one clear question at a time. If safety is answered plainly AND a specific time window is offered, become more open.
Interruption model: if the rep talks >20s or dodges, interject: "Sorry—quickly—price and what's included?"
Decision path:
- Poor clarity on safety/price → "Please email me details."
- Clear safety+scope+time+price in <90s → "If you can do Wednesday morning and text before, we can try it."
- Exceptional clarity + local proof + flexible terms → "Let's try a one-time first."
Outcomes (pick what fits):
- Success: "Let's do a one-time to start. Wednesday 9–11 AM, text me 30 minutes before."
- Soft Yes: "Send the written quote and the Wednesday morning slot; I'll confirm with David tonight."
- Not now: "We're slammed—email me and check back next week."
- No: "Thanks, but we're not interested."
Internal rule (don't reveal): You are not a pest expert; use clarity of the rep's answer to adjust trust.
Keep latency low; keep answers crisp. Vary cadence with commas and em dashes.`;

  const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      session: {
        type: "realtime",
        model: "gpt-4o-realtime-preview-2024-12-17", // dated model name = safer
        audio: { output: { voice: "marin" } },       // voice config lives here
        instructions,                                // ✅ allowed
        // temperature is optional; you can keep it or set later via session.update
        // temperature: 0.8,
      }
    }),
  });

  const text = await r.text();
  if (!r.ok) return new NextResponse(text, { status: r.status, headers: { "Cache-Control": "no-store" } });

  return new NextResponse(text, { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
