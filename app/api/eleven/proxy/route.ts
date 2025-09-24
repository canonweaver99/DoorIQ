// app/api/eleven/proxy/route.ts  
import { NextResponse } from "next/server";
export const runtime = "edge";

// Since Vercel Edge Runtime has WebSocket limitations, 
// we'll return connection info for direct client connection
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agent_id") || process.env.ELEVENLABS_AGENT_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "ELEVENLABS_API_KEY missing" }, { status: 500 });
    }
    if (!agentId) {
      return NextResponse.json({ error: "agent_id missing" }, { status: 400 });
    }

    // Return connection info for client to use
    const baseWs = process.env.ELEVENLABS_CONVAI_WS_URL || "wss://api.elevenlabs.io/v1/convai/conversation";
    
    return NextResponse.json({
      websocket_url: `${baseWs}?agent_id=${encodeURIComponent(agentId)}`,
      api_key: apiKey, // Only for dev - in production this should be more secure
      agent_id: agentId
    });
  } catch (e: any) {
    return NextResponse.json({ error: "connection_info_failed", detail: String(e?.message || e) }, { status: 500 });
  }
}
