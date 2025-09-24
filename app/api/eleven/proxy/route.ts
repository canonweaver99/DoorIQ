// app/api/eleven/proxy/route.ts
import { NextResponse } from "next/server";
export const runtime = "edge";

// Simple guard for WebSocket upgrade
function isWebSocketUpgrade(req: Request): boolean {
  return (req.headers.get("upgrade") || "").toLowerCase() === "websocket";
}

export async function GET(req: Request) {
  try {
    if (!isWebSocketUpgrade(req)) {
      return new NextResponse("Expected WebSocket upgrade", { status: 426 });
    }

    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agent_id") || process.env.ELEVENLABS_AGENT_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "ELEVENLABS_API_KEY missing" }, { status: 500 });
    }
    if (!agentId) {
      return NextResponse.json({ error: "agent_id missing" }, { status: 400 });
    }

    // Upstream ConvAI WS URL (kept configurable via env for future changes)
    const baseWs = process.env.ELEVENLABS_CONVAI_WS_URL || "wss://api.elevenlabs.io/v1/convai/chat";
    const upstreamUrl = `${baseWs}?agent_id=${encodeURIComponent(agentId)}`;

    // Create a WebSocketPair (Edge runtime API)
    const pair = (globalThis as any).WebSocketPair ? new (globalThis as any).WebSocketPair() : null;
    if (!pair) {
      return new NextResponse("WebSocket not supported in this runtime", { status: 500 });
    }
    const client = pair[0];
    const server = pair[1];

    // Accept client side immediately
    (server as WebSocket).accept();

    // Connect upstream with server-side API key
    const upstream = new (globalThis as any).WebSocket(upstreamUrl, [], {
      headers: { "xi-api-key": apiKey }
    }) as WebSocket;

    let closed = false;
    const safeClose = (code = 1000, reason = "") => {
      if (closed) return;
      closed = true;
      try { (server as WebSocket).close(code, reason); } catch {}
      try { upstream.close(code, reason); } catch {}
    };

    // Bridge: client -> upstream
    (server as WebSocket).addEventListener("message", (evt: MessageEvent) => {
      try {
        if (upstream.readyState === upstream.OPEN) {
          // Forward text or binary
          const data = evt.data;
          upstream.send(data as any);
        }
      } catch (e) {
        safeClose(1011, "proxy forward error");
      }
    });

    (server as WebSocket).addEventListener("close", () => safeClose(1000, "client closed"));
    (server as WebSocket).addEventListener("error", () => safeClose(1011, "client error"));

    // Bridge: upstream -> client
    upstream.addEventListener("open", () => {
      try { (server as WebSocket).send(JSON.stringify({ type: "proxy.status", state: "upstream_open" })); } catch {}
    });

    upstream.addEventListener("message", (evt: MessageEvent) => {
      try {
        if ((server as WebSocket).readyState === (server as any).OPEN) {
          (server as WebSocket).send(evt.data as any);
        }
      } catch (e) {
        safeClose(1011, "proxy back error");
      }
    });

    upstream.addEventListener("close", (evt: CloseEvent) => safeClose(evt.code, evt.reason || "upstream closed"));
    upstream.addEventListener("error", () => safeClose(1011, "upstream error"));

    return new NextResponse(null, { status: 101, webSocket: client });
  } catch (e: any) {
    return NextResponse.json({ error: "proxy_init_failed", detail: String(e?.message || e) }, { status: 500 });
  }
}
