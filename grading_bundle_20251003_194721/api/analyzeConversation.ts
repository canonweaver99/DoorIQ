import OpenAI from 'openai'
import { assertEnv } from '@/lib/utils'

export type AICategoryScore = { points: number; reasoning: string; max: number }

export type AIPromptOutput = {
  conversation_summary: string
  grading: {
    opening_introduction: AICategoryScore
    rapport_building: AICategoryScore
    needs_discovery: AICategoryScore
    value_communication: AICategoryScore
    objection_handling: AICategoryScore
    closing: AICategoryScore
    deductions: Array<{ reason: string; points: number }>
    total: number
  }
  what_worked: string[]
  what_failed: string[]
  key_learnings: string[]
  homeowner_response_pattern: string
  sales_rep_energy_level: 'low' | 'moderate' | 'high' | 'too aggressive'
  sentiment_progression: string
}

export async function analyzeWithOpenAI(params: {
  transcript: string
  homeownerName: string
  homeownerProfile: string
}) {
  const { transcript, homeownerName, homeownerProfile } = params
  const apiKey = assertEnv('OPENAI_API_KEY')
  const client = new OpenAI({ apiKey })

  const prompt = `You are an expert sales coach analyzing a door-to-door pest control sales conversation.\n\nCONVERSATION TRANSCRIPT:\n${transcript}\n\nHOMEOWNER AGENT: ${homeownerName}\nHOMEOWNER PROFILE: ${homeownerProfile}\n\nAnalyze this conversation and provide:\n\n1. CONVERSATION SUMMARY (2-3 sentences)\n\n2. GRADING (0-100 scale for each category):\n   - Opening & Introduction (0-15): Score + 1 sentence reasoning\n   - Rapport Building (0-20): Score + 1 sentence reasoning\n   - Needs Discovery (0-15): Score + 1 sentence reasoning\n   - Value Communication (0-15): Score + 1 sentence reasoning\n   - Objection Handling (0-20): Score + 1 sentence reasoning\n   - Closing (0-15): Score + 1 sentence reasoning\n\nAlso include Deductions as list of {reason, pointsNegative}.\n\n3. WHAT WORKED (3-5 bullet points of specific successes)\n\n4. WHAT FAILED (3-5 bullet points of specific mistakes)\n\n5. KEY LEARNINGS (3-5 actionable improvements)\n\n6. HOMEOWNER RESPONSE PATTERN (how they responded throughout)\n\n7. SALES REP ENERGY LEVEL (low/moderate/high/too aggressive)\n\n8. SENTIMENT PROGRESSION (e.g., "hostile→neutral→interested")\n\nProvide response in JSON with this shape:\n{\n  "conversation_summary": string,\n  "grading": {\n    "opening_introduction": {"points": number, "reasoning": string, "max": 15},\n    "rapport_building": {"points": number, "reasoning": string, "max": 20},\n    "needs_discovery": {"points": number, "reasoning": string, "max": 15},\n    "value_communication": {"points": number, "reasoning": string, "max": 15},\n    "objection_handling": {"points": number, "reasoning": string, "max": 20},\n    "closing": {"points": number, "reasoning": string, "max": 15},\n    "deductions": [{"reason": string, "points": number}],\n    "total": number\n  },\n  "what_worked": string[],\n  "what_failed": string[],\n  "key_learnings": string[],\n  "homeowner_response_pattern": string,\n  "sales_rep_energy_level": "low"|"moderate"|"high"|"too aggressive",\n  "sentiment_progression": string\n}`

  const r = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Return strict JSON only. No prose.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
  })

  const json = r.choices?.[0]?.message?.content || '{}'
  return json
}


