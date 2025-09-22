export type Turn = { speaker: "rep" | "customer"; text: string; ts?: string };

export type ScoreAxis = { max: number; score: number; reasons: string[] };
export type DetScore = {
  rubric_id: string;
  total: number;
  pass: boolean;
  axes: Record<string, ScoreAxis>;
  highlights: { matched: string[]; missing: string[] };
};

export type GradeResponse = {
  total: number;
  axes: { safety: number; value: number; time: number; price: number };
  notes: string[];
} & Record<string, any>;
