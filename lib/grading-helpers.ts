/**
 * Helper functions to populate all live_sessions columns from grading data
 * Used by /app/api/grade/session/route.ts
 */

import { GradePacket, Transcript as GTranscript } from './grader'

type TranscriptEntry = { speaker: string; text: string; timestamp?: string | number }

/**
 * Analyze homeowner response pattern (short, engaged, hostile, etc.)
 */
export function analyzeResponsePattern(transcript: GTranscript): string {
  const homeownerTurns = transcript.turns.filter(t => t.speaker === 'homeowner')
  if (homeownerTurns.length === 0) return 'no_response'
  
  const avgLength = homeownerTurns.reduce((sum, t) => sum + t.text.length, 0) / homeownerTurns.length
  const questionCount = homeownerTurns.filter(t => t.text.includes('?')).length
  const questionRate = questionCount / homeownerTurns.length
  
  if (avgLength < 15) return 'short_dismissive'
  if (questionRate > 0.5) return 'engaged_curious'
  if (avgLength > 100) return 'detailed_responsive'
  return 'moderate_responsive'
}

/**
 * Determine rep's energy level based on WPM and language patterns
 */
export function determineEnergyLevel(wpmRep: number, transcript: GTranscript): 'low' | 'moderate' | 'high' | 'too aggressive' | null {
  const repTurns = transcript.turns.filter(t => t.speaker === 'rep')
  if (repTurns.length === 0) return null
  
  const exclamationCount = repTurns.filter(t => t.text.includes('!')).length
  const exclamationRate = exclamationCount / repTurns.length
  const allCapsCount = repTurns.filter(t => /[A-Z]{3,}/.test(t.text)).length
  
  // Too aggressive: high WPM + lots of exclamations
  if (wpmRep > 180 && exclamationRate > 0.4) return 'too aggressive'
  if (allCapsCount > 2) return 'too aggressive'
  
  // High energy: fast speaking + some enthusiasm
  if (wpmRep > 160 && exclamationRate > 0.2) return 'high'
  if (wpmRep > 170) return 'high'
  
  // Low energy: slow speaking + no enthusiasm
  if (wpmRep < 120 && exclamationRate < 0.05) return 'low'
  if (wpmRep < 100) return 'low'
  
  // Moderate: everything else
  return 'moderate'
}

/**
 * Detect the primary closing technique used
 */
export function detectClosingTechnique(transcript: GTranscript): string | null {
  const repTurns = transcript.turns.filter(t => t.speaker === 'rep')
  const repText = repTurns.map(t => t.text.toLowerCase()).join(' ')
  
  // Assumptive close: acts like sale already happened
  if (/which (works better|would you prefer)|two appointments|when would you|let'?s get (you started|this scheduled)/i.test(repText)) {
    return 'assumptive'
  }
  
  // Trial close: tests readiness
  if (/(how does that sound|does that work|make sense|what do you think)/i.test(repText)) {
    return 'trial'
  }
  
  // Direct close: asks for the sale directly
  if (/(can i book|want to get started|ready to move forward|should i schedule)/i.test(repText)) {
    return 'direct'
  }
  
  // Alternative close: offers choices
  if (/(would you prefer|option a or b|morning or afternoon)/i.test(repText)) {
    return 'alternative'
  }
  
  // Urgency close: creates time pressure
  if (/(today only|limited availability|book now|this week only)/i.test(repText)) {
    return 'urgency'
  }
  
  return null
}

/**
 * Detect when value was first communicated (in seconds)
 */
export function detectTimeToValue(transcript: GTranscript): number | null {
  const valueKeywords = /(protect|safety|safe|warranty|guarantee|prevent|peace of mind|family|kids|pets)/i
  
  for (const turn of transcript.turns) {
    if (turn.speaker === 'rep' && valueKeywords.test(turn.text)) {
      return Math.round(turn.startMs / 1000)
    }
  }
  
  return null
}

/**
 * Count how many times rep deflected pricing questions without providing value
 */
export function countPricingDeflections(transcript: GTranscript): number {
  let deflections = 0
  
  for (let i = 0; i < transcript.turns.length - 1; i++) {
    const turn = transcript.turns[i]
    const nextTurn = transcript.turns[i + 1]
    
    // Homeowner asks about price
    if (turn.speaker === 'homeowner' && /(how much|cost|price|pricing|\$)/i.test(turn.text)) {
      // Rep deflects without value framing
      if (nextTurn.speaker === 'rep' && 
          !/(value|investment|protect|save|worth)/i.test(nextTurn.text) &&
          /(let me|first|depends|varies|i'll need to)/i.test(nextTurn.text)) {
        deflections++
      }
    }
  }
  
  return deflections
}

/**
 * Detect pressure tactics or aggressive sales techniques
 */
export function detectPressureTactics(transcript: GTranscript): boolean {
  const repTurns = transcript.turns.filter(t => t.speaker === 'rep')
  const repText = repTurns.map(t => t.text.toLowerCase()).join(' ')
  
  const pressurePatterns = [
    /you need to (decide|act) (now|today)/i,
    /this offer won't last/i,
    /i need an answer (now|today)/i,
    /what's stopping you/i,
    /you're making a mistake/i,
    /everyone else (is doing|has already)/i,
  ]
  
  return pressurePatterns.some(pattern => pattern.test(repText))
}

/**
 * Detect rude or dismissive language
 */
export function detectRudeness(transcript: GTranscript): boolean {
  const repTurns = transcript.turns.filter(t => t.speaker === 'rep')
  
  const rudePatterns = [
    /that's (dumb|stupid|ridiculous)/i,
    /you don't (understand|get it)/i,
    /whatever/i,
    /i don't care/i,
    /that doesn't make sense/i,
    /you're wrong/i,
  ]
  
  return repTurns.some(t => rudePatterns.some(pattern => pattern.test(t.text)))
}

/**
 * Detect final outcome of the conversation
 */
export function detectOutcome(transcript: GTranscript, packet: GradePacket): 'SUCCESS' | 'FAILURE' | 'PARTIAL' {
  const homeownerTurns = transcript.turns.filter(t => t.speaker === 'homeowner')
  const finalHomeownerTurns = homeownerTurns.slice(-3) // Last 3 homeowner responses
  const finalText = finalHomeownerTurns.map(t => t.text.toLowerCase()).join(' ')
  
  // SUCCESS: Clear positive signals
  const successPatterns = [
    /yes|yeah|sure|okay|sounds good|let'?s do it|book it|schedule|sign me up/i,
    /when can you come/i,
    /what'?s the next step/i,
  ]
  if (successPatterns.some(p => p.test(finalText))) {
    return 'SUCCESS'
  }
  
  // FAILURE: Clear rejection
  const failurePatterns = [
    /no|not interested|i'll pass|not right now|i'm good/i,
    /i gotta go|talk to (my )?(wife|husband|spouse)/i,
    /maybe later|think about it|let me think/i,
  ]
  if (failurePatterns.some(p => p.test(finalText))) {
    return 'FAILURE'
  }
  
  // PARTIAL: Interest shown but not closed
  const partialPatterns = [
    /interesting|tell me more|i'll consider/i,
    /send me (info|information)/i,
    /call me back/i,
  ]
  if (partialPatterns.some(p => p.test(finalText))) {
    return 'PARTIAL'
  }
  
  // Fallback: use score to infer
  if (packet.components.final >= 85) return 'SUCCESS'
  if (packet.components.final < 60) return 'FAILURE'
  return 'PARTIAL'
}

/**
 * Detect if sale was closed
 */
export function detectSaleClosed(transcript: GTranscript): boolean {
  const homeownerTurns = transcript.turns.filter(t => t.speaker === 'homeowner')
  const finalHomeownerTurns = homeownerTurns.slice(-2)
  const finalText = finalHomeownerTurns.map(t => t.text.toLowerCase()).join(' ')
  
  const closedPatterns = [
    /yes|yeah|sure|okay, let'?s do it/i,
    /book it|schedule me|sign me up|when can you/i,
    /i'll take it|sounds good, (let'?s|when)/i,
  ]
  
  return closedPatterns.some(p => p.test(finalText))
}

/**
 * Convert numeric score to letter grade
 */
export function scoreToGrade(score: number): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F' {
  if (score >= 97) return 'A+'
  if (score >= 93) return 'A'
  if (score >= 87) return 'B+'
  if (score >= 83) return 'B'
  if (score >= 77) return 'C+'
  if (score >= 73) return 'C'
  if (score >= 70) return 'D'
  return 'F'
}

/**
 * Generate a concise conversation summary
 */
export function generateSummary(transcript: GTranscript, packet: GradePacket): string {
  const duration = Math.round((transcript.turns.at(-1)?.endMs ?? 0) - (transcript.turns[0]?.startMs ?? 0)) / 1000
  const outcome = detectOutcome(transcript, packet)
  const objections = packet.objectionSpans.length
  const closeAttempts = packet.objective.closeAttempts
  
  const parts: string[] = []
  
  // Duration
  parts.push(`${duration}s conversation`)
  
  // Outcome
  if (outcome === 'SUCCESS') parts.push('successfully closed')
  else if (outcome === 'FAILURE') parts.push('not closed')
  else parts.push('partial interest')
  
  // Key metrics
  if (objections > 0) parts.push(`${objections} objection${objections > 1 ? 's' : ''} handled`)
  if (closeAttempts > 0) parts.push(`${closeAttempts} close attempt${closeAttempts > 1 ? 's' : ''}`)
  
  // Difficulty
  const difficulty = packet.components.difficulty.level
  if (difficulty !== 'neutral') parts.push(`${difficulty} customer`)
  
  // Score
  parts.push(`${packet.components.final}/100 score`)
  
  return parts.join(', ')
}

/**
 * Build complete database update payload from grading packet
 */
export function buildCompleteUpdatePayload(
  transcript: GTranscript,
  packet: GradePacket,
  sessionAnalytics: any,
  lineRatings: any[]
): Record<string, any> {
  const clamp = (n: any, min: number, max: number) => {
    const num = Number.isFinite(n) ? Number(n) : 0
    return Math.max(min, Math.min(max, Math.round(num)))
  }

  return {
    // === Core Scores (4 columns) ===
    overall_score: clamp(packet.components.final, 0, 100),
    rapport_score: clamp((packet.llm?.clarity_empathy?.score ?? 0) * 10, 0, 100),
    objection_handling_score: clamp(packet.llm?.objection_handling?.overall ?? 0, 0, 100),
    safety_score: (() => {
      const repTurns = transcript.turns.filter(t => t.speaker === 'rep')
      const safetyRegex = /(safe|safety|non[-\s]?toxic|eco|chemical|harm|exposure)/i
      const detailedRegex = /(pets?|children|kids|family)/i
      const anyMention = repTurns.some(t => safetyRegex.test(t.text || ''))
      if (!anyMention) return 0
      const detailed = repTurns.some(t => detailedRegex.test(t.text || ''))
      return detailed ? 85 : 60
    })(),

    // === Conversation Metrics (15 columns) ===
    total_turns: transcript.turns.length,
    conversation_duration_seconds: Math.round(((transcript.turns.at(-1)?.endMs ?? 0) - (transcript.turns[0]?.startMs ?? 0)) / 1000),
    questions_asked_by_homeowner: transcript.turns.filter(t => t.speaker === 'homeowner' && t.text.includes('?')).length,
    objections_raised: packet.objectionSpans.length,
    objections_resolved: packet.objectionCases.filter(c => c.score >= 15).length,
    homeowner_response_pattern: analyzeResponsePattern(transcript),
    homeowner_first_words: transcript.turns.find(t => t.speaker === 'homeowner')?.text?.substring(0, 200) ?? null,
    homeowner_final_words: [...transcript.turns].reverse().find(t => t.speaker === 'homeowner')?.text?.substring(0, 200) ?? null,
    homeowner_key_questions: transcript.turns
      .filter(t => t.speaker === 'homeowner' && t.text.includes('?'))
      .map(t => t.text)
      .slice(0, 10), // Limit to top 10
    sales_rep_energy_level: determineEnergyLevel(packet.objective.wpmRep, transcript),
    close_attempted: packet.objective.closeAttempts > 0,
    closing_technique: detectClosingTechnique(transcript),
    sentiment_progression: null, // TODO: Future enhancement
    time_to_value_seconds: detectTimeToValue(transcript),
    interruptions_count: packet.objective.interrupts,
    filler_words_count: Math.round((packet.objective.fillersPer100 * packet.objective._repWords) / 100),

    // === Score Breakdown (10 columns) ===
    opening_introduction_score: clamp((packet.objective.stepCoverage.opener ? 85 : 40), 0, 100),
    opening_introduction_reason: packet.objective.stepCoverage.opener 
      ? 'Strong opening with greeting detected' 
      : 'Weak or missing opening introduction',
    rapport_building_score: clamp((packet.llm?.clarity_empathy?.score ?? 0) * 10, 0, 100),
    rapport_building_reason: packet.llm?.clarity_empathy?.notes ?? 'N/A',
    needs_discovery_score: clamp((packet.llm?.discovery?.score ?? 0) * 5, 0, 100),
    needs_discovery_reason: `Discovery: ${packet.objective.stepCoverage.discovery ? 'Yes' : 'No'}. Question rate: ${(packet.objective.questionRate * 100).toFixed(0)}%. Rep asked ${packet.objective._repQuestions} questions.`,
    value_communication_score: clamp((packet.llm?.solution_framing?.score ?? 0) * 10, 0, 100),
    value_communication_reason: packet.llm?.solution_framing?.notes ?? 'N/A',
    closing_score: (() => {
      const attempts = packet.objective.closeAttempts || 0
      const assumptive = transcript.turns.some(t => 
        t.speaker === 'rep' && /which works better|two appointments|when would you prefer|let'?s get started/i.test(t.text || '')
      )
      if (attempts === 0) return 40
      let base = assumptive ? 70 : 40
      base += Math.min(20, Math.max(0, attempts - 1) * 10)
      return clamp(base, 0, 100)
    })(),
    closing_reason: packet.llm?.pricing_next_step?.notes ?? `${packet.objective.closeAttempts} close attempt(s) detected`,
    introduction_score: clamp((packet.objective.stepCoverage.opener ? 85 : 40), 0, 100),
    listening_score: clamp(Math.round(packet.objective.questionRate * 100), 0, 100),
    close_effectiveness_score: (() => {
      const durationMs = (transcript.turns.at(-1)?.endMs ?? 0) - (transcript.turns[0]?.startMs ?? 0)
      const attempts = packet.objective.closeAttempts || 0
      const assumptive = transcript.turns.some(t => 
        t.speaker === 'rep' && /which works better|two appointments|when would you prefer|let'?s get started/i.test(t.text || '')
      )
      if (attempts === 0) return durationMs < 20000 ? 0 : 40
      let base = assumptive ? 70 : 40
      base += Math.min(20, Math.max(0, attempts - 1) * 10)
      return clamp(base, 0, 100)
    })(),

    // === Deductions (6 columns) ===
    deductions_interruption_count: packet.objective.interrupts,
    deductions_pricing_deflections: countPricingDeflections(transcript),
    deductions_pressure_tactics: detectPressureTactics(transcript),
    deductions_made_up_info: (packet.llm?.compliance?.violations ?? []).some(v => 
      v.type.includes('misleading') || v.type.includes('false_claim')
    ),
    deductions_rude_or_dismissive: detectRudeness(transcript),
    deductions_total: Math.abs(packet.components.penalties),

    // === Outcome & Results (4 columns) ===
    outcome: detectOutcome(transcript, packet),
    sale_closed: detectSaleClosed(transcript),
    pass: packet.components.final >= 70,
    grade_letter: scoreToGrade(packet.components.final),

    // === Feedback Arrays (3 columns) ===
    // Handle both old string[] format and new rich object format
    what_worked: Array.isArray(packet.llm?.top_wins)
      ? packet.llm.top_wins.map((w: any) => 
          typeof w === 'string' ? w : `"${w.moment}" - ${w.why_it_worked} (${w.technique_used})`
        )
      : [],
    what_failed: Array.isArray(packet.llm?.top_fixes)
      ? packet.llm.top_fixes.map((f: any) =>
          typeof f === 'string' ? f : `"${f.moment}" - ${f.why_it_failed}. Try: ${f.better_approach}`
        )
      : [],
    key_learnings: (packet.llm?.drills ?? []).map(d => 
      d.why_needed 
        ? `${d.skill}: ${d.microplay} (${d.why_needed})`
        : `${d.skill}: ${d.microplay}`
    ),
    conversation_summary: generateSummary(transcript, packet),

    // === Analytics JSON (detailed breakdown) ===
    analytics: {
      ...(sessionAnalytics || {}),
      aiGrader: 'openai+rule',
      objective: packet.objective,
      objection_cases: packet.objectionCases,
      pest_control_objections: packet.pestControlObjections,
      moment_of_death: packet.momentOfDeath,
      difficulty_analysis: packet.components.difficulty,
      line_ratings: lineRatings,
      graded_at: new Date().toISOString(),
    },
  }
}

