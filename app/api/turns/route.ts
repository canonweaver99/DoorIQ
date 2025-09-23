import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/server/supabase";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { sessionId, speaker, text, ts, latency_ms, asr_confidence } = await req.json();
    if (!sessionId || !speaker || !text) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from("turns")
      .insert([{ session_id: sessionId, speaker, text, ts: ts || new Date().toISOString(), latency_ms: latency_ms ?? null, asr_confidence: asr_confidence ?? null }]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "turns_failed" }, { status: 500 });
  }
}


