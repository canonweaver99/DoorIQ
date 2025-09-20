export type SimState = "OPENING" | "DISCOVERY" | "VALUE" | "OBJECTION" | "CTA" | "SCHEDULING" | "TERMINAL";
export type SimResult = "rejected" | "advanced" | "closed";

export interface Persona {
  company: string;
  vertical: string;
  size: number;
  role: string;
  pain: string[];
  budget?: string;
  urgency: "low" | "medium" | "high";
  objections: string[];
  hiddenGoal: string;        // success gate
  successCriteria: {         // explicit, machine-checkable
    requiresROIQuant?: boolean;
    requiresScheduling?: boolean;
    requiresBudgetCheck?: boolean;
  };
}

export interface EvalReport {
  score: number;             // 0-100
  result: SimResult;
  rubric_breakdown: { 
    discovery: number; 
    value: number; 
    objection: number; 
    cta: number; 
  };
  feedback_bullets: string[];
  missed_opportunities: string[];
}

export interface Turn {
  id?: string;
  attemptId: string;
  role: "rep" | "prospect" | "system";
  text: string;
  meta?: any;
  ts: Date;
}

export interface Attempt {
  id?: string;
  userId: string;
  scenarioId?: string;
  persona: Persona;
  state: SimState;
  startedAt: Date;
  endedAt?: Date;
  result?: SimResult;
  score?: number;
  rubricSnapshot?: any;
  turnCount: number;
}

export interface Scenario {
  id?: string;
  title: string;
  vertical: string;
  difficulty: "easy" | "med" | "hard" | "boss";
  goal: "discovery" | "book_meeting" | "close_deal";
  seedBrief: any;
  initialObjection: string;
  successCriteria: any;
  tags: string[];
}

export interface Rubric {
  id?: string;
  name: string;
  weights: { 
    discovery: number; 
    value: number; 
    objection: number; 
    cta: number; 
  };
  hardRules: any;
}

export interface KnowledgeChunk {
  id?: string;
  title: string;
  content: string;
  embedding: number[];
  sourceURL?: string;
  productArea: string;
  updatedAt: Date;
}

