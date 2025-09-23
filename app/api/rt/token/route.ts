import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Return shape expected by the WebRTC sample: { client_secret: { value: string } }
export async function GET() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 400 });
    }

    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "content-type": "application/json",
        "openai-beta": "realtime=v1",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        modalities: ["audio", "text"],
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      return NextResponse.json({ error: err }, { status: r.status });
    }

    const data = await r.json();
    const value = data?.client_secret?.value;
    if (!value) return NextResponse.json({ error: "no_token" }, { status: 500 });
    return NextResponse.json({ client_secret: { value } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "token_failed" }, { status: 500 });
  }
}


