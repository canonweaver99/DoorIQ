import { NextRequest, NextResponse } from "next/server";
import { scoreTranscript } from "@/lib/eval/score";
import { loadRubric } from "@/lib/eval/loadRubric";
import { Turn, GradeResponse } from "@/lib/eval/types";

const EVAL_API_KEY = process.env.EVAL_API_KEY!;
const USE_LLM = process.env.EVAL_USE_LLM === "true";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const runtime = "nodejs";
export const preferredRegion = ["iad1", "cle1", "dub1"];

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  // --- Auth ---
  const auth = req.headers.get("authorization") || "";
  if (!EVAL_API_KEY || !auth.startsWith("Bearer ") || auth.slice(7) !== EVAL_API_KEY) {
    return unauthorized();
  }

  // --- Parse ---
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const {
    session_id,
    agent_id,
    started_at,
    ended_at,
    transcript,
    rubric_id = "amanda_v1",
    evaluate_speaker = "rep",
  } = body as {
    session_id: string;
    agent_id: string;
    started_at?: string;
    ended_at?: string;
    transcript: Turn[];
    rubric_id?: string;
    evaluate_speaker?: "rep" | "customer";
  };

  if (!session_id || !agent_id || !Array.isArray(transcript)) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // --- Deterministic baseline ---
  const rubric = loadRubric(rubric_id);
  const det = scoreTranscript(transcript, rubric, evaluate_speaker);

  // --- Optional LLM enhancement ---
  let llm: GradeResponse | null = null;
  if (USE_LLM) {
    if (!OPENAI_API_KEY) {
      console.warn("EVAL_USE_LLM=true but OPENAI_API_KEY missing; skipping LLM grade.");
    } else {
      try {
        const prompt = `
You are grading a pest-control sales call with a suburban mom persona (Amanda).
Score 0-5 on each axis, total /20. Provide 3 succinct coaching notes.

Rubric:
- Safety clarity (EPA, kid/pet specifics, re-entry timing)
- Value & scope (what's covered, guarantee)
- Time respect (appointment window + text-before-arrival, <90s to first price)
- Price clarity (range with inclusions, no hidden fees)

Return strict JSON:
{
  "total": number,
  "axes": { "safety": number, "value": number, "time": number, "price": number },
  "notes": [string, string, string]
}

Transcript (speaker: text):
${transcript.map(t => `${t.speaker.toUpperCase()}: ${t.text}`).join("\n")}
`.trim();

        // Minimal client to avoid heavy deps
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: "You are a sales call evaluator. Return only valid JSON." },
              { role: "user", content: prompt }
            ]
          })
        });

        const data = await resp.json();
        const raw = data?.choices?.[0]?.message?.content || "{}";
        llm = JSON.parse(raw);
      } catch (e) {
        llm = { error: "llm_parse_failed" } as any;
      }
    }
  }

  // --- Merge/choose final ---
  const final: GradeResponse = llm?.total
    ? llm
    : {
        total: det.total,
        axes: {
          safety: det.axes.safety.score,
          value: det.axes.value?.score ?? det.axes.scope?.score ?? 0,
          time: det.axes.time.score,
          price: det.axes.price.score
        },
        notes: [
          ...(det.axes.safety.reasons[0] ? [det.axes.safety.reasons[0]] : []),
          ...(det.axes.time.reasons[0] ? [det.axes.time.reasons[0]] : []),
          ...(det.axes.price.reasons[0] ? [det.axes.price.reasons[0]] : [])
        ].slice(0, 3)
      };

  // TODO: persist to DB if needed

  return NextResponse.json({
    session_id,
    agent_id,
    started_at,
    ended_at,
    deterministic: det,
    grading: final
  });
}
