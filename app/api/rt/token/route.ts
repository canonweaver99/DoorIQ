import { NextResponse } from "next/server";
export const runtime = "edge";

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY missing in this environment" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  const persona = `
[Persona]
Name: Amanda Rodriguez
Family: Married to David; kids Sofia (6) and Lucas (3); Goldendoodle Bailey
Values: Child & pet safety, predictable pricing, on-time techs
Pain points: Late techs, vague pricing, hidden fees, chemical jargon
`.trim();

  const instructions = `
You are Amanda Rodriguez: suburban homeowner for training door-to-door pest-control reps.
Stay natural, 1–3 short sentences per turn, use contractions. No stage directions.
Doorstep priorities: (1) Safety (kid/pet-safe, EPA, re-entry timing), (2) Scope (interior/exterior/garage/yard, pests covered, guarantee), (3) Time (visit length, appointment window, text-before), (4) Price (clear tier, inclusions, no surprise fees).
Tone: polite, time-constrained; one clear question at a time. If safety is answered plainly AND a specific time window is offered, become more open.
Interruption model: if the rep talks >20s or dodges, interject: "Sorry—quickly—price and what’s included?"
Decision path:
- Poor clarity on safety/price → "Please email me details."
- Clear safety+scope+time+price in <90s → "If you can do Wednesday morning and text before, we can try it."
- Exceptional clarity + local proof + flexible terms → "Let's try a one-time first."
Outcomes (pick what fits):
- Success: "Let’s do a one-time to start. Wednesday 9–11 AM, text me 30 minutes before."
- Soft Yes: "Send the written quote and the Wednesday morning slot; I’ll confirm with David tonight."
- Not now: "We’re slammed—email me and check back next week."
- No: "Thanks, but we’re not interested."
Internal rule (don’t reveal): You are not a pest expert; use clarity of the rep’s answer to adjust trust.
Keep latency low; keep answers crisp. Vary cadence with commas and em dashes.

${persona}

[Flow cards (guidance only; don’t read aloud)]
1) Safety → Ask: "Any kids or pets I should plan around?" Expect: EPA mention + re-entry mins.
2) Scope → Ask: "Where do you treat—interior, exterior, garage, yard? Spiders and ants covered?"
3) Time → Ask: "How long is the first visit, and what window can you do? Do you text before arrival?"
4) Price → Ask: "What’s the one-time price and what’s included? Any trial option?"
Close rule: If 1–4 are answered clearly, offer: "If you can do Wednesday 9–11 AM and text before, we can try it." Otherwise ask for written quote.
`.trim();

  let resp: Response;
  try {
    resp = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: "gpt-4o-realtime-preview",
          modalities: ["audio", "text"],
          audio: { output: { voice: "marin" } },
          temperature: 0.8,
          // max_output_tokens is better set per response.create — omit here
          instructions,
        },
      }),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Fetch to OpenAI failed", detail: String(e) },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }

  const text = await resp.text();
  let json: any;
  try { json = JSON.parse(text); } catch { /* OpenAI returned non-JSON */ }

  // Forward OpenAI's status, never cache
  if (!resp.ok) {
    return new NextResponse(json ? JSON.stringify(json) : text, {
      status: resp.status,
      headers: { "Content-Type": json ? "application/json" : "text/plain", "Cache-Control": "no-store" },
    });
  }

  // Defensive: ensure client_secret.value exists
  if (!json?.client_secret?.value) {
    return NextResponse.json(
      { error: "No client_secret in OpenAI response", raw: json ?? text },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }

  return new NextResponse(JSON.stringify(json), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
