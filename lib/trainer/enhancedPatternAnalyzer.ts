/**
 * Enhanced Pattern Analyzer for DoorIQ Live Sessions
 * Adapted for incremental analysis with concise feedback generation
 */

import { TranscriptEntry } from './types'

// Internal speaker mapping: user → rep, homeowner → agent
type InternalSpeaker = 'rep' | 'agent'
type ObjectionType = 'price' | 'timing' | 'trust' | 'need' | 'authority' | 'comparison' | 'skepticism'
type HandlingQuality = 'poor' | 'adequate' | 'good' | 'excellent'
type MicroCommitmentLevel = 'minimal' | 'moderate' | 'strong' | 'buying'
type CloseAttemptType = 'soft' | 'hard' | 'assumptive' | 'urgency'

interface InternalTranscriptEntry {
  speaker: InternalSpeaker
  text: string
  timestamp: Date
  index: number
}

// Convert TranscriptEntry to internal format
function toInternalEntry(entry: TranscriptEntry, index: number): InternalTranscriptEntry {
  return {
    speaker: entry.speaker === 'user' ? 'rep' : 'agent',
    text: entry.text,
    timestamp: entry.timestamp,
    index
  }
}

// Objection patterns with severity
const OBJECTION_PATTERNS: Record<ObjectionType, {
  patterns: RegExp[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  suggestedApproach: string
}> = {
  price: {
    patterns: [
      /too expensive/i,
      /can't afford/i,
      /budget/i,
      /cost too much/i,
      /price/i,
      /money/i,
      /cheaper/i,
      /financial/i
    ],
    severity: 'high',
    suggestedApproach: 'Pivot to value, ROI, and payment options'
  },
  timing: {
    patterns: [
      /not (a good|the right) time/i,
      /maybe later/i,
      /think about it/i,
      /not right now/i,
      /busy/i,
      /come back/i,
      /another time/i,
      /let me think/i
    ],
    severity: 'medium',
    suggestedApproach: 'Create urgency and highlight immediate benefits'
  },
  trust: {
    patterns: [
      /don't trust/i,
      /scam/i,
      /legitimate/i,
      /never heard of/i,
      /references/i,
      /proof/i,
      /how do I know/i,
      /sketchy/i,
      /door to door/i
    ],
    severity: 'critical',
    suggestedApproach: 'Build credibility with social proof and guarantees'
  },
  need: {
    patterns: [
      /don't need/i,
      /not interested/i,
      /don't want/i,
      /no problems/i,
      /doing fine/i,
      /already have/i,
      /handle it myself/i
    ],
    severity: 'medium',
    suggestedApproach: 'Discover hidden pain points and educate on risks'
  },
  authority: {
    patterns: [
      /speak to my (spouse|husband|wife|partner)/i,
      /not my decision/i,
      /need to ask/i,
      /can't decide/i,
      /talk it over/i,
      /need approval/i
    ],
    severity: 'medium',
    suggestedApproach: 'Get commitment for follow-up or include decision maker'
  },
  comparison: {
    patterns: [
      /shop around/i,
      /get other quotes/i,
      /compare prices/i,
      /what makes you different/i,
      /why should I choose/i,
      /competitors/i
    ],
    severity: 'low',
    suggestedApproach: 'Highlight unique value propositions and create urgency'
  },
  skepticism: {
    patterns: [
      /does it really work/i,
      /guarantee/i,
      /what if it doesn't/i,
      /seen this before/i,
      /tired of/i,
      /promises/i
    ],
    severity: 'medium',
    suggestedApproach: 'Share success stories and offer guarantees'
  }
}

// Positive response indicators
const POSITIVE_INDICATORS = [
  /I see/i,
  /that makes sense/i,
  /good point/i,
  /tell me more/i,
  /interesting/i,
  /didn't know that/i,
  /oh really/i,
  /what.*include/i,
  /how.*work/i,
  /when.*start/i,
  /okay/i,
  /fair enough/i,
  /I understand/i,
  /that's true/i,
  /you're right/i
]

// Negative indicators
const NEGATIVE_INDICATORS = [
  /still not/i,
  /don't think so/i,
  /no thanks/i,
  /not convinced/i,
  /still skeptical/i,
  /I'll pass/i,
  /goodbye/i,
  /not today/i,
  /leave/i,
  /go away/i
]

// Micro-commitment patterns
const MICRO_COMMITMENTS: Record<MicroCommitmentLevel, RegExp[]> = {
  minimal: [
    /uh huh/i,
    /okay/i,
    /I see/i,
    /sure/i,
    /right/i,
    /yes/i,
    /yeah/i,
    /mhm/i
  ],
  moderate: [
    /that's interesting/i,
    /tell me more/i,
    /how does that work/i,
    /what.*include/i,
    /explain/i,
    /good to know/i,
    /didn't realize/i
  ],
  strong: [
    /I like that/i,
    /that would help/i,
    /we need that/i,
    /sounds good/i,
    /that's important/i,
    /definitely need/i,
    /been looking for/i
  ],
  buying: [
    /when can you start/i,
    /what's next/i,
    /how do I sign up/i,
    /where do I sign/i,
    /let's do it/i,
    /I'm ready/i,
    /count me in/i,
    /what's the process/i
  ]
}

// Close attempt patterns
const CLOSE_PATTERNS: Record<CloseAttemptType, RegExp[]> = {
  soft: [
    /would you like to/i,
    /shall we/i,
    /can we schedule/i,
    /does.*sound good/i,
    /how.*feel about/i,
    /what do you think/i
  ],
  hard: [
    /let's get you started/i,
    /I'll set you up/i,
    /here's what we'll do/i,
    /I'm going to/i,
    /we're going to/i
  ],
  assumptive: [
    /when we start/i,
    /your first treatment/i,
    /once you're enrolled/i,
    /after we begin/i,
    /during your service/i
  ],
  urgency: [
    /today only/i,
    /limited time/i,
    /special pricing/i,
    /this week/i,
    /expires/i,
    /last chance/i,
    /while I'm here/i
  ]
}

/**
 * Detect objection type and severity
 */
export function detectObjection(text: string): { 
  type: ObjectionType
  severity: 'low' | 'medium' | 'high' | 'critical'
} | null {
  for (const [type, config] of Object.entries(OBJECTION_PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(text)) {
        return { 
          type: type as ObjectionType, 
          severity: config.severity 
        }
      }
    }
  }
  return null
}

/**
 * Detect micro-commitment level
 */
export function detectMicroCommitment(text: string): MicroCommitmentLevel | null {
  // Check in reverse order (buying → minimal) to catch strongest signals first
  const levels: MicroCommitmentLevel[] = ['buying', 'strong', 'moderate', 'minimal']
  
  for (const level of levels) {
    for (const pattern of MICRO_COMMITMENTS[level]) {
      if (pattern.test(text)) {
        return level
      }
    }
  }
  return null
}

/**
 * Detect close attempt type
 */
export function detectCloseAttempt(text: string): CloseAttemptType | null {
  for (const [type, patterns] of Object.entries(CLOSE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return type as CloseAttemptType
      }
    }
  }
  return null
}

/**
 * Assess if an objection was handled based on follow-up window
 * Returns handling quality and whether it was handled
 */
export function assessObjectionHandling(
  objectionIndex: number,
  transcript: TranscriptEntry[]
): {
  wasHandled: boolean
  quality: HandlingQuality | null
  responseText?: string
} {
  // Look at next 5 exchanges after objection
  const followupWindow = transcript.slice(
    objectionIndex + 1,
    Math.min(objectionIndex + 6, transcript.length)
  )

  let positiveCount = 0
  let negativeCount = 0
  let responseText = ''

  // Get rep's immediate response
  const repResponse = followupWindow.find(e => e.speaker === 'user')
  if (repResponse) {
    responseText = repResponse.text
  }

  // Check customer responses for indicators
  followupWindow
    .filter(e => e.speaker === 'homeowner')
    .forEach(entry => {
      // Check positive indicators
      POSITIVE_INDICATORS.forEach(pattern => {
        if (pattern.test(entry.text)) {
          positiveCount++
        }
      })

      // Check negative indicators
      NEGATIVE_INDICATORS.forEach(pattern => {
        if (pattern.test(entry.text)) {
          negativeCount++
        }
      })
    })

  // Determine if handled and quality
  const wasHandled = positiveCount > negativeCount
  
  let quality: HandlingQuality | null = null
  if (wasHandled) {
    if (positiveCount >= 3) quality = 'excellent'
    else if (positiveCount >= 2) quality = 'good'
    else quality = 'adequate'
  } else if (negativeCount > 0) {
    quality = 'poor'
  }

  return {
    wasHandled,
    quality,
    responseText
  }
}

/**
 * Determine if close attempt was successful
 */
export function assessCloseSuccess(
  closeIndex: number,
  transcript: TranscriptEntry[]
): boolean {
  const nextEntries = transcript.slice(
    closeIndex + 1,
    Math.min(closeIndex + 4, transcript.length)
  )

  // Look for buying signals in customer responses
  const customerResponses = nextEntries.filter(e => e.speaker === 'homeowner')

  for (const response of customerResponses) {
    // Check for buying commitments
    if (MICRO_COMMITMENTS.buying.some(pattern => pattern.test(response.text))) {
      return true
    }
    
    // Check for strong positive commitments
    if (MICRO_COMMITMENTS.strong.some(pattern => pattern.test(response.text))) {
      return true
    }

    // Check for explicit rejection
    if (NEGATIVE_INDICATORS.some(pattern => pattern.test(response.text))) {
      return false
    }
  }

  return false
}

/**
 * Determine close timing appropriateness
 */
export function assessCloseTiming(
  closeIndex: number,
  transcript: TranscriptEntry[],
  unhandledObjections: number[]
): 'too_early' | 'appropriate' | 'too_late' | 'none' {
  if (transcript.length === 0) return 'none'

  const transcriptLength = transcript.length
  const closePosition = closeIndex / transcriptLength

  // Check if there were unhandled objections before the close
  const unhandledBeforeClose = unhandledObjections.filter(idx => idx < closeIndex)
  if (unhandledBeforeClose.length > 0) return 'too_early'
  
  if (closePosition < 0.3) return 'too_early'
  if (closePosition > 0.8) return 'too_late'

  return 'appropriate'
}

/**
 * Generate concise 1-line feedback message
 */
export function generateConciseFeedback(
  type: 'objection' | 'objection_handling' | 'micro_commitment' | 'close_attempt' | 'close_timing',
  data: any
): string {
  switch (type) {
    case 'objection': {
      const { objectionType, severity } = data
      const typeMap: Record<ObjectionType, string> = {
        price: 'Price',
        timing: 'Timing',
        trust: 'Trust',
        need: 'Need',
        authority: 'Authority',
        comparison: 'Comparison',
        skepticism: 'Skepticism'
      }
      const severityMap: Record<string, string> = {
        critical: 'Critical',
        high: 'High',
        medium: 'Medium',
        low: 'Low'
      }
      return `${typeMap[objectionType]} objection (${severityMap[severity]})`
    }

    case 'objection_handling': {
      const { quality, wasHandled } = data
      if (!wasHandled) {
        return 'Objection needs addressing'
      }
      const qualityMap: Record<HandlingQuality, string> = {
        excellent: 'Objection handled excellently',
        good: 'Objection handled well',
        adequate: 'Objection handled adequately',
        poor: 'Objection handling needs work'
      }
      return quality ? qualityMap[quality] : 'Objection handled'
    }

    case 'micro_commitment': {
      const { level } = data
      const levelMap: Record<MicroCommitmentLevel, string> = {
        buying: 'Buying signal detected',
        strong: 'Strong interest shown',
        moderate: 'Interest building',
        minimal: 'Minimal engagement'
      }
      return levelMap[level]
    }

    case 'close_attempt': {
      const { closeType, wasSuccessful } = data
      if (wasSuccessful) {
        return 'Close attempt successful'
      }
      const typeMap: Record<CloseAttemptType, string> = {
        soft: 'Soft close attempted',
        hard: 'Hard close attempted',
        assumptive: 'Assumptive close used',
        urgency: 'Urgency close used'
      }
      return typeMap[closeType] || 'Close attempted'
    }

    case 'close_timing': {
      const { timing } = data
      const timingMap: Record<string, string> = {
        too_early: 'Close too early - build value first',
        too_late: 'Close timing late - act sooner',
        appropriate: 'Good close timing',
        none: 'No close attempt yet'
      }
      return timingMap[timing] || 'Close timing assessed'
    }

    default:
      return 'Feedback generated'
  }
}

/**
 * Get suggested approach for objection type
 */
export function getObjectionApproach(type: ObjectionType): string {
  return OBJECTION_PATTERNS[type].suggestedApproach
}

