import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get("agent_id");
  if (!agentId) return NextResponse.json({ error: "Missing agent_id" }, { status: 400 });

  try {
    // Ask ElevenLabs for a signed WebSocket URL (do this server-side only)
    // NOTE: Endpoint name can change; consult "Authentication → Signed URLs" in docs if needed.
    const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ELEVENLABS_API_KEY missing" }, { status: 500 });
    }

    const res = await fetch("https://api.elevenlabs.io/v1/convai/conversations/get-signed-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({ agent_id: agentId }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `ElevenLabs error: ${res.status} ${text}` }, { status: 500 });
    }

    const data = await res.json(); // { signed_url: "wss://api.elevenlabs.io/..." }
    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
