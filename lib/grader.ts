// Battle-tested grading starter: deterministic metrics + JSON LLM rubric + aggregation.
// Assumes diarized transcript with timestamps (ms). No external deps.

//////////////////////
// Domain Types
//////////////////////

export type Speaker = 'rep' | 'homeowner';

export interface Turn {
  id: number;                 // stable turn id
  speaker: Speaker;
  startMs: number;            // inclusive
  endMs: number;              // exclusive
  text: string;
  overlapMs?: number;         // optional: audio overlap with the other speaker
}

export interface Transcript {
  sessionId: string;
  turns: Turn[];              // ordered by time
}

export interface ObjectiveMetrics {
  talkRatioRep: number;       // 0..1
  questionRate: number;       // repQuestions / repTurns
  interrupts: number;         // overlaps > 400ms where rep interrupts
  interruptsApologized: number;
  wpmRep: number;             // words per minute (rep)
  deadAirCount: number;       // silences > 2500ms between any two turns
  fillersPer100: number;      // rep fillers per 100 words
  stepCoverage: {
    opener: boolean;
    discovery: boolean;
    value: boolean;
    price: boolean;
    close: boolean;
  };
  closeAttempts: number;
  // raw counts helpful for debugging/UX chips
  _repWords: number;
  _homeWords: number;
  _repTurns: number;
  _repQuestions: number;
}

export type ObjectionLabel = 'price' | 'timing' | 'spouse' | 'pests_not_bad' | 'competitor' | 'chemicals_kids_pets';

export interface ObjectionSpan {
  label: ObjectionLabel;
  startTurnId: number;
  endTurnId: number;
}

export interface ObjectionCaseScore {
  label: ObjectionLabel;
  steps: { ack: 0|1; clarify: 0|1; address: 0|1; confirm: 0|1 };
  notes: string;
  score: number; // 0..20 (5 pts per step), minus 3 if missing confirm
}

export interface LlmRubricInput {
  transcript: Transcript;
  objectionSpans: ObjectionSpan[];
  policySnippets?: string[]; // e.g., compliance rules
}

export interface LlmRubricOutput {
  discovery: { score: number; evidence: number[] };
  objection_handling: {
    overall: number;
    cases: Array<{
      label: ObjectionLabel;
      steps: { ack: 0|1; clarify: 0|1; address: 0|1; confirm: 0|1 };
      notes: string;
      evidence?: number[];
    }>;
  };
  clarity_empathy: { score: number; notes: string };
  solution_framing: { score: number; notes: string };
  pricing_next_step: { score: number; notes: string };
  compliance: { score: number; violations: Array<{type: string; quote: string; turn_id: number}> };
  top_wins: string[];
  top_fixes: string[];
  drills: Array<{ skill: string; microplay: string }>;
  // defensive parsing
  _raw?: unknown;
}

export interface ComponentScores {
  objective: number;  // 0..60
  llm: number;        // 0..40
  penalties: number;  // negative
  final: number;      // 0..100
  band: 'Ready' | 'Needs polish' | 'Rework';
}

export interface GradePacket {
  sessionId: string;
  objective: ObjectiveMetrics;
  objectionSpans: ObjectionSpan[];
  objectionCases: ObjectionCaseScore[];
  llm: LlmRubricOutput | null;
  components: ComponentScores;
}

//////////////////////
// Helpers
//////////////////////

const WORD_RE = /[A-Za-z0-9’'-]+/g;
const FILLERS = /\b(uh|um|like|kinda|sorta|you know|i mean|right\?|ya know)\b/gi;
const APOLOGIES = /\b(sorry|my bad|apologies|didn'?t mean to cut.*you|go ahead|you first)\b/i;

function wordCount(s: string): number {
  return (s.match(WORD_RE) ?? []).length;
}

function isQuestion(s: string): boolean {
  if (s.trim().endsWith('?')) return true;
  // backup: leading interrogatives
  return /\b(what|why|how|when|where|which|who|would|could|can|do you|are you|did you|have you)\b/i.test(s);
}

function durationMs(t: Turn) { return Math.max(0, (t.endMs - t.startMs) | 0); }

function between(a: Turn, b: Turn): number {
  // gap (silence) between consecutive turns
  return Math.max(0, b.startMs - a.endMs);
}

//////////////////////
// Objective Metrics
//////////////////////

export function computeObjectiveMetrics(transcript: Transcript): ObjectiveMetrics {
  let repWords = 0, homeWords = 0, repTurns = 0, repQuestions = 0, repCharsPerMin = 0;
  let interrupts = 0, interruptsApologized = 0, deadAirCount = 0;
  let repSpeakingMs = 0;
  let fillerHits = 0;

  const turns = transcript.turns;

  // Silences
  for (let i = 0; i < turns.length - 1; i++) {
    const gap = between(turns[i], turns[i+1]);
    if (gap > 2500) deadAirCount++;
  }

  // Per-turn stats
  for (let i = 0; i < turns.length; i++) {
    const t = turns[i];
    const words = wordCount(t.text);
    const dur = durationMs(t);
    const overlaps = t.overlapMs ?? 0;

    if (t.speaker === 'rep') {
      repTurns++;
      repWords += words;
      repSpeakingMs += dur;
      if (isQuestion(t.text)) repQuestions++;
      // fillers
      const fillerMatches = t.text.match(FILLERS);
      if (fillerMatches) fillerHits += fillerMatches.length;
      // interrupts (rep caused) – conservative: count when overlap > 400ms at turn start
      if (overlaps > 400) {
        interrupts++;
        // scan next 2 rep turns for apology signal
        let apologized = false;
        for (let j = i; j < Math.min(turns.length, i+6); j++) {
          const tj = turns[j];
          if (tj.speaker === 'rep' && APOLOGIES.test(tj.text)) { apologized = true; break; }
        }
        if (apologized) interruptsApologized++;
      }
    } else {
      homeWords += words;
    }
  }

  const totalWords = repWords + homeWords || 1;
  const talkRatioRep = repWords / totalWords;
  const repMinutes = Math.max(0.01, repSpeakingMs / 60000);
  const wpmRep = repWords / repMinutes;
  const fillersPer100 = repWords ? (fillerHits / repWords) * 100 : 0;
  const questionRate = repTurns ? repQuestions / repTurns : 0;

  // Step coverage (very light heuristics you can refine later)
  const textAll = turns.map(t => t.text.toLowerCase());
  const hasOpener   = /^(hi|hey|hello|good (morning|afternoon|evening)|how's it going)/i.test(turns[0]?.text ?? '');
  const hasDiscovery= textAll.some(s => /\b(pests?|bugs?|ants?|spiders?|how often|when did|where do|issue|problem|concern|kids|pets)\b/.test(s) && /\?/.test(s));
  const hasValue    = textAll.some(s => /\b(safety|kid|pet|eco|warranty|guarantee|professional|prevent|protect|barrier|home)\b/.test(s));
  const hasPrice    = textAll.some(s => /\b(price|pricing|cost|dollars|\$\d)/.test(s));
  const hasClose    = textAll.some(s => /\b(schedule|book|tomorrow|this afternoon|we can do|does (tue|wed|thu|fri)|work for you|sound good)\b/.test(s));

  // Close attempts (trial/primary)
  const closeAttempts = textAll.filter(s => /\b(we can get you on|i can have a tech|does [\w\s]+ work|how's [\w\s]+|want me to lock|get you started|swing by)\b/.test(s)).length;

  return {
    talkRatioRep,
    questionRate,
    interrupts,
    interruptsApologized,
    wpmRep,
    deadAirCount,
    fillersPer100: Number(fillersPer100.toFixed(2)),
    stepCoverage: { opener: !!hasOpener, discovery: !!hasDiscovery, value: !!hasValue, price: !!hasPrice, close: !!hasClose },
    closeAttempts,
    _repWords: repWords,
    _homeWords: homeWords,
    _repTurns: repTurns,
    _repQuestions: repQuestions,
  };
}

//////////////////////
// Objection Detection (rule-first)
//////////////////////

const OBJECTION_PATTERNS: Record<ObjectionLabel, RegExp> = {
  price: /\b(too expensive|price(y)?|cost(s)? too much|that's a lot|\$\d+)/i,
  timing: /\b(not a good time|busy|later|come back|another day|we're heading out|nap time|kids down soon)\b/i,
  spouse: /\b(need to|gotta|have to) (ask|check with|talk to) (my|the) (husband|wife|spouse|partner)\b/i,
  pests_not_bad: /\b(don't see|haven't seen|not that bad|we DIY|i spray myself|rarely)\b/i,
  competitor: /\b(we have|already with|using) (another|a different) (company|service|provider|orkin|terminix|aptive|moxie)\b/i,
  chemicals_kids_pets: /\b(chemicals?|toxic|poison|safe for (kids|children|bab(y|ies))|dog|cat|pet|allerg(y|ies)|asthma)\b/i,
};

export function detectObjections(transcript: Transcript): ObjectionSpan[] {
  const spans: ObjectionSpan[] = [];
  // Simple: when homeowner raises a line matching pattern, span = that turn +/- next rep response
  for (const turn of transcript.turns) {
    if (turn.speaker !== 'homeowner') continue;
    for (const [label, rx] of Object.entries(OBJECTION_PATTERNS) as Array<[ObjectionLabel, RegExp]>) {
      if (rx.test(turn.text)) {
        // extend span to next 2-3 turns as the "handling" window
        const startId = turn.id;
        const endId = Math.min(startId + 5, (transcript.turns.at(-1)?.id ?? startId));
        spans.push({ label, startTurnId: startId, endTurnId: endId });
        break;
      }
    }
  }
  // Merge overlaps of same label
  spans.sort((a,b)=>a.startTurnId - b.startTurnId);
  const merged: ObjectionSpan[] = [];
  for (const s of spans) {
    const last = merged.at(-1);
    if (last && last.label === s.label && s.startTurnId <= last.endTurnId) {
      last.endTurnId = Math.max(last.endTurnId, s.endTurnId);
    } else merged.push({...s});
  }
  return merged;
}

//////////////////////
// 4-step Checker (Ack → Clarify → Address → Confirm)
//////////////////////

const ACK_RX = /\b(i (hear|get|understand)|totally|makes sense|fair|that's reasonable|good question)\b/i;
const CLARIFY_RX = /\b(just to clarify|when you say|how do you mean|what specifically|is it the|can you tell me more)\b/i;
const ADDRESS_RX = /\b(what we can do|here's how|the way we handle|option (a|b)|we typically|we use|we avoid)\b/i;
const CONFIRM_RX = /\b(does that help|make sense|how does that sound|would that work|okay if we)\b/i;

export function scoreObjectionCase(span: ObjectionSpan, transcript: Transcript): ObjectionCaseScore {
  const window = transcript.turns.filter(t => t.id >= span.startTurnId && t.id <= span.endTurnId);
  const repOnly = window.filter(t => t.speaker === 'rep').map(t => t.text).join(' ');
  const steps = {
    ack: ACK_RX.test(repOnly) ? 1 : 0,
    clarify: CLARIFY_RX.test(repOnly) ? 1 : 0,
    address: ADDRESS_RX.test(repOnly) ? 1 : 0,
    confirm: CONFIRM_RX.test(repOnly) ? 1 : 0,
  };
  let score = (steps.ack + steps.clarify + steps.address + steps.confirm) * 5;
  if (!steps.confirm) score -= 3; // loop not closed penalty
  score = Math.max(0, score);
  return {
    label: span.label,
    steps,
    notes: `Window ${span.startTurnId}-${span.endTurnId}`,
    score,
  };
}

//////////////////////
// Objective → 60 pts mapping
//////////////////////

export function objectiveToSixty(m: ObjectiveMetrics): number {
  let pts = 0;

  // Conversation Hygiene (20)
  // talk/listen ratio ideal 40–60 → full 8pts, outside 25–75 linearly down to -10 penalty (handled later)
  const talkCenter = Math.abs(m.talkRatioRep - 0.5);
  const talkBandPts = Math.max(0, 8 - (talkCenter / 0.25) * 8); // 0..8 within [0.25..0.75]
  const questionPts = Math.min(5, Math.max(0, (m.questionRate - 0.2) / (0.35 - 0.2) * 5)); // 0 at 0.2, 5 at 0.35+
  const interruptPts = Math.max(0, 4 - Math.max(0, m.interrupts - m.interruptsApologized)); // 4 if clean
  const fillerPts = Math.max(0, 3 - Math.min(3, m.fillersPer100 / 3)); // light curve
  const hygiene = talkBandPts + questionPts + interruptPts + fillerPts; // 0..20
  pts += hygiene;

  // Discovery & Needs (20)
  // Proxy: stepCoverage.discovery + question rate + rep words balance
  const discBase = (m.stepCoverage.discovery ? 10 : 0);
  const discQ = Math.min(6, Math.max(0, (m.questionRate) * 10)); // 0..6
  const confProb = Math.min(4, Math.max(0, (1 - Math.abs(m.talkRatioRep - 0.5)) * 8)); // 0..4
  pts += discBase + discQ + confProb;

  // Objection Handling (20) — placeholder until LLM: use stepCoverage + close attempts as weak signal
  const objProxy = Math.min(20, (m.stepCoverage.value ? 8 : 0) + (m.closeAttempts > 0 ? 6 : 0) + (m.stepCoverage.price ? 6 : 0));
  pts += objProxy;

  // Clarity/Empathy (10) proxy: WPM inside 130–170 and low fillers
  let clarity = 0;
  if (m.wpmRep >= 120 && m.wpmRep <= 190) clarity += 6;
  clarity += Math.max(0, 4 - Math.min(4, m.fillersPer100 / 2));
  pts += Math.min(10, clarity);

  // Compliance/Safety (10) proxy: objective layer can’t fully judge; award baseline 8
  // (true penalties applied later)
  pts += 8;

  // Solution Framing (10) + Pricing & Next Step (10) proxies: step coverage + close attempts
  pts += (m.stepCoverage.value ? 6 : 0) + (m.stepCoverage.price ? 4 : 0);
  pts += (m.closeAttempts === 0 ? 0 : Math.min(10, 4 + m.closeAttempts * 3)); // 1–3 good range

  // Dead air small penalty inside objective (cap −5 overall elsewhere)
  pts -= Math.min(5, m.deadAirCount);

  // Clamp
  pts = Math.max(0, Math.min(60, Math.round(pts)));
  return pts;
}

//////////////////////
// LLM Rubric (JSON-only)
//////////////////////

export function buildLlmPrompt(input: LlmRubricInput): string {
  // Pass ONLY what’s needed: rep turns + objection spans + policy
  const repTurns = input.transcript.turns.filter(t => t.speaker === 'rep');
  const h: Record<string, unknown> = {
    transcript_meta: { sessionId: input.transcript.sessionId, turns: input.transcript.turns.length },
    rep_turns: repTurns.map(t => ({ id: t.id, ts: [t.startMs, t.endMs], text: t.text })),
    objection_spans: input.objectionSpans,
    policy_snippets: input.policySnippets ?? [],
    instructions: {
      style: "Output STRICT JSON only. No prose. Temperature 0.",
      evidence_rule: "Every deduction must cite rep turn_ids in arrays.",
      scales: {
        discovery: "0-20",
        objection_handling: "0-20 (5 per step; -3 if missing confirm)",
        clarity_empathy: "0-10",
        solution_framing: "0-10",
        pricing_next_step: "0-10",
        compliance: "0-10 (misleading/medical/chemical claims etc.)"
      }
    }
  };
  const skeleton = `
You are a harsh sales QA grader. Output JSON ONLY that matches this TypeScript type:

{
  "discovery": { "score": 0-20, "evidence": number[] },
  "objection_handling": {
    "overall": 0-20,
    "cases": [
      { "label": "price"|"timing"|"spouse"|"pests_not_bad"|"competitor"|"chemicals_kids_pets",
        "steps": {"ack":0|1,"clarify":0|1,"address":0|1,"confirm":0|1},
        "notes": string, "evidence": number[] }
    ]
  },
  "clarity_empathy": { "score": 0-10, "notes": string },
  "solution_framing": { "score": 0-10, "notes": string },
  "pricing_next_step": { "score": 0-10, "notes": string },
  "compliance": { "score": 0-10, "violations": [{"type": string, "quote": string, "turn_id": number}] },
  "top_wins": string[],
  "top_fixes": string[],
  "drills": [{"skill": string, "microplay": string}]
}

Guardrails:
- Grade rep turns only (ignore homeowner content for scoring).
- Cite evidence turn_ids for every deduction.
- Be strict. No vibes. No padding. Temperature 0.
`.trim();

  return skeleton + "\n\nINPUT_JSON=\n" + JSON.stringify(h);
}

// You will call your model here. Keep it abstract so you can swap providers.
export async function runLlmRubric(evalPrompt: string, infer: (prompt: string)=>Promise<string>): Promise<LlmRubricOutput> {
  const raw = await infer(evalPrompt);
  let parsed: any;
  try { parsed = JSON.parse(raw); } catch {
    // defensive: try to extract JSON block
    const m = raw.match(/\{[\s\S]*\}$/);
    parsed = m ? JSON.parse(m[0]) : {};
  }
  return { ...parsed, _raw: raw } as LlmRubricOutput;
}

//////////////////////
// Aggregation + Penalties
//////////////////////

export function aggregate(
  obj60: number,
  llm40: number,
  m: ObjectiveMetrics,
  llm: LlmRubricOutput | null
): ComponentScores {
  // base
  let objective_total = obj60;            // 0..60
  let llm_total = Math.max(0, Math.min(40, Math.round(llm40)));

  // penalties
  let penalties = 0;

  // compliance violations: -10 each (cap -20)
  const vioCount = llm?.compliance?.violations?.length ?? 0;
  penalties += -Math.min(20, vioCount * 10);

  // talk ratio outside 25–75%: linear down to -10
  if (m.talkRatioRep < 0.25) penalties += -Math.min(10, Math.round((0.25 - m.talkRatioRep) / 0.25 * 10));
  if (m.talkRatioRep > 0.75) penalties += -Math.min(10, Math.round((m.talkRatioRep - 0.75) / 0.25 * 10));

  // dead air already counted lightly; keep it here capped
  penalties += -Math.min(5, m.deadAirCount);

  // Low lexical diversity + monotone pace soft-cap 85 unless personalized discovery
  // (simple proxy: questionRate AND discovery coverage must be decent to lift cap)
  const personalizedDiscovery = m.stepCoverage.discovery && m.questionRate >= 0.3;
  let raw = 0.6 * objective_total + 0.4 * llm_total + penalties;
  raw = Math.max(0, Math.min(100, Math.round(raw)));
  if (!personalizedDiscovery && raw > 85) raw = 85;

  const band = raw >= 85 ? 'Ready' : raw >= 70 ? 'Needs polish' : 'Rework';

  return {
    objective: objective_total,
    llm: llm_total,
    penalties,
    final: raw,
    band,
  };
}

//////////////////////
// Orchestrator
//////////////////////

export async function gradeSession(
  transcript: Transcript,
  infer: (prompt: string)=>Promise<string>,     // your LLM caller
  policySnippets: string[] = []
): Promise<GradePacket> {
  const objective = computeObjectiveMetrics(transcript);
  const objectionSpans = detectObjections(transcript);
  const objectionCases = objectionSpans.map(s => scoreObjectionCase(s, transcript));

  // LLM pass (you can skip initially to save cost)
  const prompt = buildLlmPrompt({ transcript, objectionSpans, policySnippets });
  const llm = await runLlmRubric(prompt, infer);

  // Map LLM components to 40pts
  // Discovery (20), Objection (20), Clarity (10), Solution (10), Pricing (10), Compliance (10) totals 80.
  // Normalize to 40.
  const llmRaw80 =
    (llm?.discovery?.score ?? 0) +
    (llm?.objection_handling?.overall ?? 0) +
    (llm?.clarity_empathy?.score ?? 0) +
    (llm?.solution_framing?.score ?? 0) +
    (llm?.pricing_next_step?.score ?? 0) +
    (llm?.compliance?.score ?? 0);
  const llm40 = Math.round((Math.max(0, Math.min(80, llmRaw80)) / 80) * 40);

  const obj60 = objectiveToSixty(objective);
  const components = aggregate(obj60, llm40, objective, llm);

  return {
    sessionId: transcript.sessionId,
    objective,
    objectionSpans,
    objectionCases,
    llm,
    components,
  };
}


