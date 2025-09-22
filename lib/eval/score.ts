import { Turn, DetScore } from "./types";

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ");
}

function containsAny(text: string, patterns: string[]) {
  return patterns.some(p =>
    p.startsWith("/") && p.endsWith("/")
      ? new RegExp(p.slice(1, -1), "i").test(text)
      : text.includes(p)
  );
}

export function scoreTranscript(
  turns: Turn[],
  rubric: any,
  who: "rep" | "customer" = "rep"
): DetScore {
  const text = normalize(
    turns.filter(t => t.speaker === who).map(t => t.text).join(" ")
  );

  const axes: any = {};
  const matchedGlobal: string[] = [];
  const missingGlobal: string[] = [];

  Object.entries<any>(rubric.axes).forEach(([axis, cfg]) => {
    const max = cfg.max as number;
    let score = 0;
    const reasons: string[] = [];

    const req = (cfg.required_phrases || []).map((s: string) => s.toLowerCase());
    const reqHit = req.filter((p: string) => containsAny(text, [p]));
    const reqMiss = req.filter((p: string) => !containsAny(text, [p]));

    if (reqMiss.length === 0) {
      score += Math.min(3, max);
      reasons.push(`Covered essentials: ${req.join(", ")}`);
      matchedGlobal.push(...req);
    } else {
      reasons.push(`Missing essentials: ${reqMiss.join(", ")}`);
      missingGlobal.push(...reqMiss);
    }

    const opt = (cfg.optional_patterns || []).map((s: string) => s);
    let bonus = 0;
    opt.forEach((p: string) => {
      if (containsAny(text, [p])) {
        bonus += 1;
        matchedGlobal.push(p);
      }
    });
    score = Math.min(max, score + bonus);
    reasons.push(`Bonus from optional: +${bonus} (cap ${max})`);

    axes[axis] = { max, score, reasons };
  });

  const total = Object.values<any>(axes).reduce((a, b) => a + b.score, 0);
  const pass = total >= (rubric.pass_threshold as number);

  return {
    rubric_id: rubric.id,
    total,
    pass,
    axes,
    highlights: {
      matched: [...new Set(matchedGlobal)],
      missing: [...new Set(missingGlobal)],
    },
  };
}
