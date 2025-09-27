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
  // Pest Control Power Metrics
  pestControlMetrics: {
    problemDiscoveryRate: number;     // 0-1, did rep uncover specific pest issues?
    safetyFamilyAngle: boolean;       // connected pests to family safety?
    vsDiyPositioning: boolean;        // explained why DIY fails?
    localCredibility: boolean;        // mentioned local pest patterns/neighbors?
    specificPestsIdentified: string[]; // which pests were discussed
  };
  // raw counts helpful for debugging/UX chips
  _repWords: number;
  _homeWords: number;
  _repTurns: number;
  _repQuestions: number;
}

export type ObjectionLabel = 'price' | 'timing' | 'spouse' | 'pests_not_bad' | 'competitor' | 'chemicals_kids_pets' | 'think_about_it' | 'diy_preference' | 'bad_experience';

export interface PestControlObjections {
  falseObjections: Array<{
    type: 'think_about_it' | 'check_spouse';
    turnId: number;
    realMeaning: string;
    properlyHandled: boolean;
    scoreAdjustment: number;
  }>;
  realObjections: Array<{
    type: 'diy_preference' | 'bad_experience';
    turnId: number;
    properlyEducated: boolean;
    scoreAdjustment: number;
  }>;
  buyingSignals: Array<{
    type: 'pricing_question' | 'logistics_question' | 'safety_question';
    turnId: number;
    recognizedAsBuying: boolean;
    scoreAdjustment: number;
  }>;
}

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

export interface DifficultyAnalysis {
  level: 'impossible' | 'hostile' | 'skeptical' | 'neutral' | 'warm' | 'easy';
  multiplier: number;
  indicators: string[];
  justification: string;
}

export interface ComponentScores {
  objective: number;  // 0..60
  llm: number;        // 0..40
  penalties: number;  // negative
  difficulty: DifficultyAnalysis;
  final: number;      // 0..100
  band: 'Ready' | 'Needs polish' | 'Rework';
}

export interface MomentOfDeath {
  detected: boolean;
  turnId: number | null;
  timestamp: number | null;
  deathSignal: string;
  severity: 'critical' | 'high' | 'medium';
  label: string;
  recoveryAttempted: boolean;
  alternativeResponse: string;
}

export interface GradePacket {
  sessionId: string;
  objective: ObjectiveMetrics;
  objectionSpans: ObjectionSpan[];
  objectionCases: ObjectionCaseScore[];
  pestControlObjections: PestControlObjections;
  momentOfDeath: MomentOfDeath;
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

  // Pest Control Power Metrics tracking
  const pestKeywords = ['ants', 'spiders', 'roaches', 'cockroaches', 'fire ants', 'scorpions', 'rodents', 'mice', 'rats', 'termites', 'beetles', 'wasps', 'bees'];
  const safetyFamilyKeywords = ['kids', 'children', 'pets', 'safe', 'family', 'dog', 'cat', 'baby', 'babies', 'toddler'];
  const diyKeywords = ['diy', 'do it myself', 'home depot', 'lowes', 'store bought', 'spray myself', 'buy my own'];
  const localKeywords = ['neighborhood', 'your neighbor', 'this area', 'around here', 'in this region', 'local', 'nearby homes'];
  
  let problemsDiscovered = 0;
  let totalDiscoveryAttempts = 0;
  let safetyFamilyConnected = false;
  let diyEducationProvided = false;
  let localCredibilityShown = false;
  const identifiedPests: string[] = [];

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
    const textLower = t.text.toLowerCase();

    if (t.speaker === 'rep') {
      repTurns++;
      repWords += words;
      repSpeakingMs += dur;
      if (isQuestion(t.text)) repQuestions++;
      
      // Track discovery questions about pests
      if (isQuestion(t.text) && pestKeywords.some(pest => textLower.includes(pest))) {
        totalDiscoveryAttempts++;
      }
      
      // Safety/family angle detection
      if (safetyFamilyKeywords.some(keyword => textLower.includes(keyword))) {
        safetyFamilyConnected = true;
      }
      
      // DIY education detection
      if (diyKeywords.some(keyword => textLower.includes(keyword)) && 
          (textLower.includes('limited') || textLower.includes('not effective') || textLower.includes('temporary'))) {
        diyEducationProvided = true;
      }
      
      // Local credibility detection
      if (localKeywords.some(keyword => textLower.includes(keyword))) {
        localCredibilityShown = true;
      }
      
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
    } else { // homeowner/austin speaking
      homeWords += words;
      
      // Count problems discovered when homeowner mentions specific pests
      pestKeywords.forEach(pest => {
        if (textLower.includes(pest) && !identifiedPests.includes(pest)) {
          identifiedPests.push(pest);
          problemsDiscovered++;
        }
      });
    }
  }

  const totalWords = repWords + homeWords || 1;
  const talkRatioRep = repWords / totalWords;
  const repMinutes = Math.max(0.01, repSpeakingMs / 60000);
  const wpmRep = repWords / repMinutes;
  const fillersPer100 = repWords ? (fillerHits / repWords) * 100 : 0;
  const questionRate = repTurns ? repQuestions / repTurns : 0;
  const problemDiscoveryRate = totalDiscoveryAttempts > 0 ? problemsDiscovered / Math.max(1, totalDiscoveryAttempts) : 0;

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
    pestControlMetrics: {
      problemDiscoveryRate: Number(problemDiscoveryRate.toFixed(2)),
      safetyFamilyAngle: safetyFamilyConnected,
      vsDiyPositioning: diyEducationProvided,
      localCredibility: localCredibilityShown,
      specificPestsIdentified: identifiedPests
    },
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
  // Pest Control Specific Objections
  think_about_it: /\b(think about it|need to think|let me think|i'll think|consider it|sleep on it)\b/i,
  diy_preference: /\b(do it myself|DIY|buy my own|home depot|lowes|handle it myself|spray myself)\b/i,
  bad_experience: /\b(last company|before|had someone|previous|used to have|bad experience)\b/i,
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
// Pest Control Objection Intelligence
//////////////////////

export function analyzePestControlObjections(transcript: Transcript): PestControlObjections {
  const falseObjections: Array<{type: 'think_about_it' | 'check_spouse'; turnId: number; realMeaning: string; properlyHandled: boolean; scoreAdjustment: number;}> = [];
  const realObjections: Array<{type: 'diy_preference' | 'bad_experience'; turnId: number; properlyEducated: boolean; scoreAdjustment: number;}> = [];
  const buyingSignals: Array<{type: 'pricing_question' | 'logistics_question' | 'safety_question'; turnId: number; recognizedAsBuying: boolean; scoreAdjustment: number;}> = [];

  for (let i = 0; i < transcript.turns.length; i++) {
    const turn = transcript.turns[i];
    if (turn.speaker !== 'homeowner') continue;
    
    const text = turn.text.toLowerCase();
    
    // FALSE OBJECTIONS (polite rejections)
    if (text.includes('think about it') || text.includes('need to think')) {
      const nextRepResponse = transcript.turns.slice(i + 1).find(t => t.speaker === 'rep');
      const properlyHandled = nextRepResponse ? 
        (nextRepResponse.text.toLowerCase().includes('specifically') || 
         nextRepResponse.text.toLowerCase().includes('what would you need to think') ||
         nextRepResponse.text.toLowerCase().includes('help you decide')) : false;
      
      falseObjections.push({
        type: 'think_about_it',
        turnId: turn.id,
        realMeaning: 'polite rejection',
        properlyHandled,
        scoreAdjustment: properlyHandled ? 3 : -5
      });
    }
    
    if (text.includes('check with') || text.includes('ask my')) {
      const nextRepResponse = transcript.turns.slice(i + 1).find(t => t.speaker === 'rep');
      const properlyHandled = nextRepResponse ? 
        (nextRepResponse.text.toLowerCase().includes('both of you benefit') || 
         nextRepResponse.text.toLowerCase().includes('what would they want to know')) : false;
      
      falseObjections.push({
        type: 'check_spouse',
        turnId: turn.id,
        realMeaning: 'avoiding decision',
        properlyHandled,
        scoreAdjustment: properlyHandled ? 3 : -3
      });
    }
    
    // REAL OBJECTIONS
    if (text.includes('do it myself') || text.includes('home depot') || text.includes('buy my own')) {
      const nextRepResponse = transcript.turns.slice(i + 1).find(t => t.speaker === 'rep');
      const properlyEducated = nextRepResponse ? 
        (nextRepResponse.text.toLowerCase().includes('limited') || 
         nextRepResponse.text.toLowerCase().includes('temporary') ||
         nextRepResponse.text.toLowerCase().includes('professional grade')) : false;
      
      realObjections.push({
        type: 'diy_preference',
        turnId: turn.id,
        properlyEducated,
        scoreAdjustment: properlyEducated ? 5 : -3
      });
    }
    
    if (text.includes('last company') || text.includes('bad experience') || text.includes('before')) {
      const nextRepResponse = transcript.turns.slice(i + 1).find(t => t.speaker === 'rep');
      const properlyEducated = nextRepResponse ? 
        (nextRepResponse.text.toLowerCase().includes('different') || 
         nextRepResponse.text.toLowerCase().includes('we approach') ||
         nextRepResponse.text.toLowerCase().includes('hear that a lot')) : false;
      
      realObjections.push({
        type: 'bad_experience',
        turnId: turn.id,
        properlyEducated,
        scoreAdjustment: properlyEducated ? 5 : -2
      });
    }
    
    // BUYING SIGNALS (disguised as objections)
    if (text.includes('how much') || text.includes('what does it cost') || text.includes('price')) {
      const nextRepResponse = transcript.turns.slice(i + 1).find(t => t.speaker === 'rep');
      const recognizedAsBuying = nextRepResponse ? 
        (nextRepResponse.text.toLowerCase().includes('great question') || 
         nextRepResponse.text.toLowerCase().includes('investment') ||
         nextRepResponse.text.toLowerCase().includes('value')) : false;
      
      buyingSignals.push({
        type: 'pricing_question',
        turnId: turn.id,
        recognizedAsBuying,
        scoreAdjustment: recognizedAsBuying ? 5 : -2
      });
    }
    
    if (text.includes('how often') || text.includes('when do you') || text.includes('schedule')) {
      buyingSignals.push({
        type: 'logistics_question',
        turnId: turn.id,
        recognizedAsBuying: true,
        scoreAdjustment: 3
      });
    }
    
    if (text.includes('safe for') || text.includes('chemicals') || text.includes('pets') || text.includes('kids')) {
      buyingSignals.push({
        type: 'safety_question',
        turnId: turn.id,
        recognizedAsBuying: true,
        scoreAdjustment: 4
      });
    }
  }
  
  return { falseObjections, realObjections, buyingSignals };
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
  const steps: { ack: 0|1; clarify: 0|1; address: 0|1; confirm: 0|1 } = {
    ack: (ACK_RX.test(repOnly) ? 1 : 0) as 0|1,
    clarify: (CLARIFY_RX.test(repOnly) ? 1 : 0) as 0|1,
    address: (ADDRESS_RX.test(repOnly) ? 1 : 0) as 0|1,
    confirm: (CONFIRM_RX.test(repOnly) ? 1 : 0) as 0|1,
  };
  let score = (Number(steps.ack) + Number(steps.clarify) + Number(steps.address) + Number(steps.confirm)) * 5;
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

  // Objection Handling (20) - placeholder until LLM: use stepCoverage + close attempts as weak signal
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
// Customer Difficulty Analysis
//////////////////////

export function analyzeDifficulty(transcript: Transcript): DifficultyAnalysis {
  const totalDuration = transcript.turns.length > 0 ? 
    (transcript.turns[transcript.turns.length - 1].endMs - transcript.turns[0].startMs) : 0;
  const durationSeconds = totalDuration / 1000;
  
  const homeownerTurns = transcript.turns.filter(t => t.speaker === 'homeowner');
  const homeownerText = homeownerTurns.map(t => t.text.toLowerCase()).join(' ');
  
  const indicators: string[] = [];
  let level: DifficultyAnalysis['level'] = 'neutral';
  let multiplier = 1.0;
  let justification = '';
  
  // IMPOSSIBLE (instant rejection)
  if (durationSeconds < 30) {
    level = 'impossible';
    multiplier = 1.3;
    indicators.push('Conversation under 30 seconds');
    justification = 'Customer likely hung up or refused to engage - unfair to judge rep performance';
  }
  // HOSTILE 
  else if (homeownerText.includes('get off') || homeownerText.includes('not interested') || 
           homeownerText.includes('hell no') || homeownerText.includes('go away') ||
           homeownerText.includes('f*ck') || homeownerText.includes('damn')) {
    level = 'hostile';
    multiplier = 1.2;
    indicators.push('Hostile language detected');
    justification = 'Hostile customer - aggressive behavior makes conversion nearly impossible';
  }
  // SKEPTICAL
  else if (homeownerTurns.length > 0 && homeownerTurns.filter(t => 
    t.text.length < 20 || 
    t.text.toLowerCase().includes('maybe') ||
    t.text.toLowerCase().includes('i guess') ||
    t.text.toLowerCase().includes('sure')
  ).length / homeownerTurns.length > 0.6) {
    level = 'skeptical';
    multiplier = 1.1;
    indicators.push('Short responses', 'Non-committal language');
    justification = 'Skeptical customer with minimal engagement - harder to build rapport';
  }
  // WARM (admits problems)
  else if (homeownerText.includes('ants') || homeownerText.includes('spiders') ||
           homeownerText.includes('roaches') || homeownerText.includes('pests') ||
           homeownerText.includes('problem') || homeownerText.includes('issue')) {
    level = 'warm';
    multiplier = 0.9;
    indicators.push('Admitted pest problems');
    justification = 'Customer has existing pest issues - easier conversion opportunity';
  }
  // EASY (called themselves or very engaged)
  else if (homeownerText.includes('called') || homeownerText.includes('quote') ||
           homeownerTurns.some(t => t.text.length > 100) ||
           homeownerTurns.filter(t => t.text.includes('?')).length > 2) {
    level = 'easy';
    multiplier = 0.8;
    indicators.push('High engagement', 'Asked multiple questions');
    justification = 'Engaged customer asking questions - favorable conversion conditions';
  }
  
  return {
    level,
    multiplier,
    indicators,
    justification
  };
}

//////////////////////
// Aggregation + Penalties
//////////////////////

export function aggregate(
  obj60: number,
  llm40: number,
  m: ObjectiveMetrics,
  llm: LlmRubricOutput | null,
  difficulty: DifficultyAnalysis
): ComponentScores {
  // If the rep never spoke, return a hard 0 to avoid misleading partial points
  if (!m._repTurns || !m._repWords) {
    return { objective: 0, llm: 0, penalties: 0, difficulty, final: 0, band: 'Rework' };
  }
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

  // Apply difficulty multiplier
  const adjustedRaw = Math.min(100, Math.round(raw * difficulty.multiplier));
  const final = Math.max(0, adjustedRaw);
  
  const band = final >= 85 ? 'Ready' : final >= 70 ? 'Needs polish' : 'Rework';

  return {
    objective: objective_total,
    llm: llm_total,
    penalties,
    difficulty,
    final,
    band,
  };
}

//////////////////////
// Moment-of-Death Analysis
//////////////////////

export function analyzeMomentOfDeath(transcript: Transcript): MomentOfDeath {
  const deathSignals = [
    {pattern: /.*I gotta go.*/, severity: 'critical' as const, label: 'Lost patience'},
    {pattern: /.*talk to (wife|husband|spouse).*/, severity: 'high' as const, label: 'Polite exit'},
    {pattern: /.*we're good.*/, severity: 'medium' as const, label: 'Shutting down'},
    {pattern: /.*already have someone.*/, severity: 'high' as const, label: 'Competition'},
    {pattern: /.*not interested.*/, severity: 'critical' as const, label: 'Direct rejection'},
    {pattern: /.*maybe later.*/, severity: 'high' as const, label: 'Delay tactic'},
    {pattern: /.*let me think about it.*/, severity: 'high' as const, label: 'False objection'},
    {pattern: /.*too expensive.*/, severity: 'medium' as const, label: 'Price shock'},
    {pattern: /.*busy right now.*/, severity: 'medium' as const, label: 'Timing objection'},
  ];

  for (let i = 0; i < transcript.turns.length; i++) {
    const turn = transcript.turns[i];
    if (turn.speaker !== 'homeowner') continue;

    for (const signal of deathSignals) {
      if (signal.pattern.test(turn.text)) {
        // Check if rep attempted recovery
        const nextRepTurn = transcript.turns.slice(i + 1).find(t => t.speaker === 'rep');
        const recoveryAttempted = nextRepTurn ? (
          nextRepTurn.text.toLowerCase().includes('understand') ||
          nextRepTurn.text.toLowerCase().includes('what if') ||
          nextRepTurn.text.toLowerCase().includes('specifically') ||
          nextRepTurn.text.toLowerCase().includes('help you')
        ) : false;

        const alternativeResponse = getAlternativeResponse(signal.label, turn.text);

        return {
          detected: true,
          turnId: turn.id,
          timestamp: turn.startMs,
          deathSignal: turn.text,
          severity: signal.severity,
          label: signal.label,
          recoveryAttempted,
          alternativeResponse
        };
      }
    }
  }

  return {
    detected: false,
    turnId: null,
    timestamp: null,
    deathSignal: '',
    severity: 'medium',
    label: '',
    recoveryAttempted: false,
    alternativeResponse: ''
  };
}

function getAlternativeResponse(label: string, customerText: string): string {
  const alternatives: Record<string, string> = {
    'Lost patience': "I understand you're busy. What if I could show you how this saves you time in the long run?",
    'Polite exit': "I get it - what would they want to know about keeping your family safe from pests?",
    'Shutting down': "Before I go, what if I could address your main concern in 30 seconds?",
    'Competition': "That's great they're taking care of you. What made you choose them originally?",
    'Direct rejection': "I appreciate your honesty. What would it take to earn 2 minutes of your time?",
    'Delay tactic': "I understand. What specifically would help you decide if this is right for your family?",
    'False objection': "What specifically would you need to think through? Maybe I can help you decide.",
    'Price shock': "I hear you. What if I could show you how this investment protects your biggest investment - your home?",
    'Timing objection': "I get it - when would be a better time to protect your family from pests?"
  };
  
  return alternatives[label] || "What would help you feel confident about moving forward?";
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
  const pestControlObjections = analyzePestControlObjections(transcript);
  const momentOfDeath = analyzeMomentOfDeath(transcript);

  // LLM pass (you can skip initially to save cost)
  const prompt = buildLlmPrompt({ transcript, objectionSpans, policySnippets });
  const llm = await runLlmRubric(prompt, infer);

  // Map LLM components to 40pts with pest control adjustments
  // Discovery (20), Objection (20), Clarity (10), Solution (10), Pricing (10), Compliance (10) totals 80.
  // Normalize to 40.
  let llmRaw80 =
    (llm?.discovery?.score ?? 0) +
    (llm?.objection_handling?.overall ?? 0) +
    (llm?.clarity_empathy?.score ?? 0) +
    (llm?.solution_framing?.score ?? 0) +
    (llm?.pricing_next_step?.score ?? 0) +
    (llm?.compliance?.score ?? 0);

  // Apply pest control specific score adjustments
  const objectionAdjustments = 
    pestControlObjections.falseObjections.reduce((sum, o) => sum + o.scoreAdjustment, 0) +
    pestControlObjections.realObjections.reduce((sum, o) => sum + o.scoreAdjustment, 0) +
    pestControlObjections.buyingSignals.reduce((sum, o) => sum + o.scoreAdjustment, 0);
  
  // Add pest control power metrics bonus
  const pestMetricsBonus = 
    (objective.pestControlMetrics.problemDiscoveryRate * 15) +  // High impact
    (objective.pestControlMetrics.safetyFamilyAngle ? 10 : 0) +
    (objective.pestControlMetrics.vsDiyPositioning ? 10 : 0) +
    (objective.pestControlMetrics.localCredibility ? 5 : 0);

  llmRaw80 += objectionAdjustments + pestMetricsBonus;

  const llm40 = Math.round((Math.max(0, Math.min(120, llmRaw80)) / 120) * 40); // Increased max to 120 for bonuses

  const obj60 = objectiveToSixty(objective);
  const difficulty = analyzeDifficulty(transcript);
  const components = aggregate(obj60, llm40, objective, llm, difficulty);

  return {
    sessionId: transcript.sessionId,
    objective,
    objectionSpans,
    objectionCases,
    pestControlObjections,
    momentOfDeath,
    llm,
    components,
  };
}


