/**
 * Enhanced Pattern Analyzer for DoorIQ Live Sessions
 * Adapted for incremental analysis with concise feedback generation
 */

import { TranscriptEntry } from './types'

// Internal speaker mapping: user → rep, homeowner → agent
type InternalSpeaker = 'rep' | 'agent'
type ObjectionType = 
  | 'price' 
  | 'timing' 
  | 'trust' 
  | 'need' 
  | 'authority' 
  | 'comparison' 
  | 'skepticism'
  | 'renter_ownership'
  | 'existing_service'
  | 'no_problem'
  | 'contract_fear'
  | 'door_policy'
  | 'brush_off'
  | 'bad_experience'
  | 'just_moved'

type ObjectionSubCategory = 
  | 'price_affordability' 
  | 'price_value_perception'
  | 'timing_busy'
  | 'timing_not_ready'
  | 'trust_legitimacy'
  | 'trust_references'
  | null
type HandlingQuality = 'poor' | 'adequate' | 'good' | 'excellent'
type MicroCommitmentLevel = 'minimal' | 'moderate' | 'strong' | 'buying'
type CloseAttemptType = 'soft' | 'hard' | 'assumptive' | 'urgency'
type ObjectionTiming = 'early' | 'mid' | 'late'
type BuyingTemperatureTrend = 'warming_up' | 'cooling_off' | 'stable'

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

// Context-aware pattern matching helper
function detectWithContext(
  text: string,
  pattern: RegExp,
  contextWindow: TranscriptEntry[],
  contextIndex: number
): boolean {
  const matches = pattern.test(text)
  if (!matches) return false

  // Get previous 2-3 entries for context
  const contextStart = Math.max(0, contextIndex - 3)
  const contextEntries = contextWindow.slice(contextStart, contextIndex)
  const contextText = contextEntries.map(e => e.text).join(' ').toLowerCase()
  const currentText = text.toLowerCase()

  // Check for 'later' - only match if preceded by call/contact context or followed by negative sentiment
  if (pattern.source.includes('later') && !pattern.source.includes('maybe')) {
    const callContext = /(call me|come back|reach out|contact|follow up|get back)/i.test(contextText)
    const negativeSentiment = /(don't|won't|can't|not interested|no thanks)/i.test(currentText)
    if (!callContext && !negativeSentiment) return false
  }

  // Check for 'budget' - only match if in price objection context
  if (pattern.source.includes('budget')) {
    const priceContext = /(afford|cost|price|money|expensive|cheap|pay|dollar)/i.test(contextText + ' ' + currentText)
    if (!priceContext) return false
  }

  // Check for authority objection patterns - exclude casual mentions of family
  if (pattern.source.includes('spouse|husband|wife|partner')) {
    // Exclude casual rapport-building statements
    const isCasualRapport = /(yeah|yes|yep|uh huh|mm|hmm|okay|sure|alright|well|so|and|or|,|\.|!)/i.test(currentText) &&
      !/(need|have|must|should|can't|won't|can't decide|not my decision|speak to|ask|check|discuss|approval|permission)/i.test(currentText)
    
    // Exclude statements that are just listing family members
    const isJustListing = /^(yeah|yes|yep|uh huh|mm|hmm|okay|sure|alright|well|so|and|or|,|\.|!)/i.test(currentText.trim()) &&
      /(wife|husband|spouse|partner|kids|children|dog|pet|family)/i.test(currentText) &&
      !/(need|have|must|should|can't|won't|can't decide|not my decision|speak to|ask|check|discuss|approval|permission)/i.test(currentText)
    
    // Check if previous context was a discovery question (likely rapport building)
    const prevWasQuestion = contextIndex > 0 && contextWindow[contextIndex - 1]?.text?.trim().endsWith('?')
    const isDiscoveryQuestion = prevWasQuestion && /(tell me|how|what|who|where|when|do you|have you|are you)/i.test(contextWindow[contextIndex - 1]?.text || '')
    
    if (isCasualRapport || (isJustListing && isDiscoveryQuestion)) {
      return false
    }
    
    // Only match if it contains explicit objection language
    const hasObjectionLanguage = /(need|have|must|should|can't|won't|can't decide|not my decision|speak to|ask|check|discuss|approval|permission|talk it over)/i.test(currentText)
    if (!hasObjectionLanguage) return false
  }

  return true
}

// Objection patterns with severity
const OBJECTION_PATTERNS: Record<ObjectionType, {
  patterns: RegExp[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  suggestedApproach: string
  requiresContext?: boolean // Flag for patterns that need context checking
}> = {
  price: {
    patterns: [
      /too expensive/i,
      /can't afford/i,
      /cost too much/i,
      /price/i,
      /money/i,
      /cheaper/i,
      /financial/i
    ],
    severity: 'high',
    suggestedApproach: 'Pivot to value, ROI, and payment options',
    requiresContext: false
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
    suggestedApproach: 'Create urgency and highlight immediate benefits',
    requiresContext: false
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
    suggestedApproach: 'Build credibility with social proof and guarantees',
    requiresContext: false
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
    suggestedApproach: 'Discover hidden pain points and educate on risks',
    requiresContext: false
  },
  authority: {
    patterns: [
      /speak to my (spouse|husband|wife|partner)/i,
      /not my decision/i,
      /need to ask (my|the) (spouse|husband|wife|partner)/i,
      /can't decide/i,
      /talk it over (with|to)/i,
      /need approval/i,
      /have to (ask|check with|discuss with) (my|the) (spouse|husband|wife|partner)/i,
      /(spouse|husband|wife|partner) (needs|has) to (decide|approve|agree)/i
    ],
    severity: 'medium',
    suggestedApproach: 'Get commitment for follow-up or include decision maker',
    requiresContext: true
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
    suggestedApproach: 'Highlight unique value propositions and create urgency',
    requiresContext: false
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
    suggestedApproach: 'Share success stories and offer guarantees',
    requiresContext: false
  },
  renter_ownership: {
    patterns: [
      /renting/i,
      /don't own/i,
      /landlord/i,
      /tenant/i,
      /not my house/i,
      /apartment/i,
      /rental/i,
      /don't own the/i
    ],
    severity: 'medium',
    suggestedApproach: 'Offer to contact landlord or provide tenant-friendly solutions',
    requiresContext: false
  },
  existing_service: {
    patterns: [
      /already have someone/i,
      /under contract/i,
      /current provider/i,
      /already use/i,
      /have a guy/i,
      /already have a/i,
      /current company/i,
      /already signed/i
    ],
    severity: 'medium',
    suggestedApproach: 'Discover contract end date and highlight switching benefits',
    requiresContext: false
  },
  no_problem: {
    patterns: [
      /no bugs/i,
      /haven't seen any/i,
      /don't have pests/i,
      /not a problem/i,
      /no issues/i,
      /no problems/i,
      /haven't noticed/i,
      /don't see any/i
    ],
    severity: 'high',
    suggestedApproach: 'Educate on hidden infestations and preventive value',
    requiresContext: false
  },
  contract_fear: {
    patterns: [
      /is this a contract/i,
      /locked in/i,
      /cancel anytime/i,
      /commitment/i,
      /how long/i,
      /contract term/i,
      /long term/i,
      /obligation/i
    ],
    severity: 'medium',
    suggestedApproach: 'Clarify flexible terms and cancellation policy',
    requiresContext: false
  },
  door_policy: {
    patterns: [
      /don't buy at the door/i,
      /no soliciting/i,
      /don't do business this way/i,
      /never buy from/i,
      /no door to door/i,
      /don't buy door to door/i,
      /no solicitation/i
    ],
    severity: 'critical',
    suggestedApproach: 'Respect policy, offer alternative contact method',
    requiresContext: false
  },
  brush_off: {
    patterns: [
      /I'll call you/i,
      /leave a card/i,
      /give me your number/i,
      /reach out later/i,
      /call you later/i,
      /contact you later/i,
      /get back to you/i,
      /follow up later/i
    ],
    severity: 'high',
    suggestedApproach: 'Create urgency and get commitment for follow-up',
    requiresContext: false
  },
  bad_experience: {
    patterns: [
      /tried that before/i,
      /didn't work/i,
      /waste of money/i,
      /last company/i,
      /burned before/i,
      /previous company/i,
      /didn't help/i,
      /wasn't worth it/i
    ],
    severity: 'high',
    suggestedApproach: 'Acknowledge concern, differentiate your service',
    requiresContext: false
  },
  just_moved: {
    patterns: [
      /just moved/i,
      /new to the area/i,
      /just bought/i,
      /settling in/i,
      /recently moved/i,
      /new homeowner/i,
      /just purchased/i
    ],
    severity: 'low',
    suggestedApproach: 'Welcome them, offer new homeowner special',
    requiresContext: false
  }
}

// Positive response indicators - expanded for better resolution detection
const POSITIVE_INDICATORS = [
  // Explicit acceptance
  /I see/i,
  /that makes sense/i,
  /I understand/i,
  /I get it/i,
  /that's true/i,
  /you're right/i,
  /fair enough/i,
  /I hear you/i,
  /I can see why/i,
  /that's understandable/i,
  /that's reasonable/i,
  /makes sense/i,
  
  // Engagement and interest
  /good point/i,
  /tell me more/i,
  /interesting/i,
  /didn't know that/i,
  /oh really/i,
  /that's interesting/i,
  /I didn't realize/i,
  /I hadn't thought of that/i,
  /that's helpful/i,
  /good to know/i,
  
  // Buying signals - questions about next steps
  /what.*include/i,
  /how.*work/i,
  /when.*start/i,
  /what.*next/i,
  /how.*sign up/i,
  /where.*sign/i,
  /what.*process/i,
  /how.*get started/i,
  /what.*cost/i,
  /how much/i,
  /what.*price/i,
  
  // Agreement and acceptance
  /okay/i,
  /sure/i,
  /yes/i,
  /yeah/i,
  /alright/i,
  /sounds good/i,
  /that works/i,
  /that's fine/i,
  /I'm okay with/i,
  /I can do that/i,
  /let's do it/i,
  /count me in/i,
  /I'm ready/i,
  
  // Positive sentiment after objection
  /I guess.*could/i,
  /maybe.*work/i,
  /I suppose/i,
  /that might/i,
  /could be/i,
  /I'll consider/i,
  /I'll think about it/i,
  
  // Acknowledgment of solution
  /that solves/i,
  /that addresses/i,
  /that helps/i,
  /that would work/i,
  /that's better/i,
  /I like that/i,
  /that sounds/i
]

// Negative indicators - expanded for better resolution detection
const NEGATIVE_INDICATORS = [
  // Persistent objections
  /still not/i,
  /still don't/i,
  /still can't/i,
  /still won't/i,
  /still skeptical/i,
  /still not convinced/i,
  /still not sure/i,
  /still have concerns/i,
  /still worried/i,
  
  // Rejection
  /don't think so/i,
  /no thanks/i,
  /not interested/i,
  /not convinced/i,
  /I'll pass/i,
  /not for me/i,
  /not what I want/i,
  /don't want it/i,
  /not going to/i,
  /won't work/i,
  /can't do it/i,
  
  // Dismissal
  /goodbye/i,
  /not today/i,
  /leave/i,
  /go away/i,
  /get lost/i,
  /no way/i,
  /absolutely not/i,
  /definitely not/i,
  
  // Repeating same objection
  /but.*still.*(expensive|cost|price|money)/i,
  /but.*still.*(can't afford|too much)/i,
  /but.*still.*(not ready|later|think)/i,
  /but.*still.*(don't trust|sketchy|scam)/i,
  
  // Negative sentiment
  /I doubt/i,
  /I'm skeptical/i,
  /seems like/i,
  /sounds like/i,
  /probably not/i,
  /unlikely/i,
  /doubtful/i,
  
  // Closing conversation
  /I have to go/i,
  /need to go/i,
  /gotta go/i,
  /have to leave/i,
  /busy right now/i,
  /not a good time/i
]

// Technique patterns
export const TECHNIQUE_PATTERNS = {
  tieDowns: [
    /\bright\?/i,
    /wouldn't you agree/i,
    /makes sense/i,
    /don't you think/i,
    /fair enough/i,
    /right\b/i,
    /doesn't it/i,
    /wouldn't it/i
  ],
  futurePacing: [
    /\bimagine\b/i,
    /picture this/i,
    /\bthink about\b/i,
    /wouldn't it be nice/i,
    /what if you could/i,
    /picture yourself/i,
    /envision/i
  ],
  painDiscovery: [
    /have you noticed/i,
    /what kind of bugs/i,
    /how often do you see/i,
    /what's been your experience/i,
    /what problems/i,
    /what issues/i,
    /what challenges/i
  ],
  takeaway: [
    /might not be for you/i,
    /not for everyone/i,
    /\bonly if\b/i,
    /no pressure/i,
    /totally understand if/i,
    /might not work/i,
    /not right for/i
  ],
  alternativeClose: [
    /morning or afternoon/i,
    /this week or next/i,
    /would you prefer/i,
    /which works better/i,
    /today or tomorrow/i,
    /this or that/i,
    /option a or b/i
  ],
  priceReframe: [
    /less than a dollar/i,
    /cost of a coffee/i,
    /pennies a day/i,
    /\bcompared to\b/i,
    /cheaper than/i,
    /only.*per day/i,
    /just.*per/i,
    /that's only/i
  ],
  thirdPartyStory: [
    /had a customer/i,
    /talked to someone/i,
    /neighbor down the street/i,
    /just last week/i,
    /funny story/i,
    /customer of mine/i,
    /someone I know/i,
    /neighbor of yours/i
  ],
  patternInterrupt: [
    /before you say no/i,
    /I know what you're thinking/i,
    /hear me out/i,
    /quick question/i,
    /before you decide/i,
    /hold on/i,
    /wait a second/i
  ]
}

// Micro-commitment patterns (with context-aware detection)
const MICRO_COMMITMENTS: Record<MicroCommitmentLevel, RegExp[]> = {
  minimal: [
    /uh huh/i,
    /I see/i,
    /right/i,
    /mhm/i
    // 'okay', 'sure', 'yes', 'yeah' removed - will be handled with context
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
 * Detect objection sub-category for more granular labeling
 */
function detectObjectionSubCategory(
  type: ObjectionType,
  text: string
): ObjectionSubCategory {
  const lowerText = text.toLowerCase()
  
  switch (type) {
    case 'price':
      // Affordability: direct statements about not being able to pay
      if (/can't afford|can't pay|out of.*price|beyond.*budget|too much money|don't have.*money/i.test(lowerText)) {
        return 'price_affordability'
      }
      // Value perception: questioning if it's worth it
      if (/worth it|value|expensive|too much|overpriced|rip off/i.test(lowerText)) {
        return 'price_value_perception'
      }
      return 'price_affordability' // Default
      
    case 'timing':
      // Busy: specific time constraints
      if (/busy|schedule|appointment|time|right now|today|this week/i.test(lowerText)) {
        return 'timing_busy'
      }
      // Not ready: need more time to decide
      if (/not ready|think about|decide|consider|need time|think it over/i.test(lowerText)) {
        return 'timing_not_ready'
      }
      return 'timing_not_ready' // Default
      
    case 'trust':
      // Legitimacy: questioning if company is real/legitimate
      if (/legitimate|real|scam|sketchy|door to door|never heard/i.test(lowerText)) {
        return 'trust_legitimacy'
      }
      // References: asking for proof/references
      if (/references|proof|guarantee|how do i know|who else|customers/i.test(lowerText)) {
        return 'trust_references'
      }
      return 'trust_legitimacy' // Default
      
    default:
      return null
  }
}

/**
 * Calculate confidence score for objection detection (0-1)
 */
function calculateObjectionConfidence(
  type: ObjectionType,
  text: string,
  contextWindow?: TranscriptEntry[],
  contextIndex?: number
): number {
  const config = OBJECTION_PATTERNS[type]
  if (!config) return 0.5
  
  let confidence = 0.5 // Base confidence
  
  // Check how many patterns match
  const matchingPatterns = config.patterns.filter(pattern => {
    if (config.requiresContext && contextWindow && contextIndex !== undefined) {
      return detectWithContext(text, pattern, contextWindow, contextIndex)
    }
    return pattern.test(text)
  }).length
  
  // More patterns = higher confidence
  if (matchingPatterns > 1) confidence += 0.2
  if (matchingPatterns > 2) confidence += 0.1
  
  // Check for explicit objection language
  const explicitLanguage = /(can't|won't|don't|not|never|no way|impossible)/i.test(text)
  if (explicitLanguage) confidence += 0.1
  
  // Check context - if previous entry was rep explaining something, higher confidence
  if (contextWindow && contextIndex !== undefined && contextIndex > 0) {
    const prevEntry = contextWindow[contextIndex - 1]
    if (prevEntry && prevEntry.speaker === 'user') {
      // Rep just explained something, homeowner objecting = higher confidence
      if (/explain|tell|show|here's|this is|we/i.test(prevEntry.text)) {
        confidence += 0.1
      }
    }
  }
  
  return Math.min(1.0, confidence)
}

/**
 * Detect objection type and severity with context awareness
 * Enhanced with sub-categories and confidence scores
 */
export function detectObjection(
  text: string,
  contextWindow?: TranscriptEntry[],
  contextIndex?: number
): { 
  type: ObjectionType
  severity: 'low' | 'medium' | 'high' | 'critical'
  timing?: ObjectionTiming
  isStacked?: boolean
  subCategory?: ObjectionSubCategory
  confidence?: number
} | null {
  const lowerText = text.toLowerCase()
  
  // Pre-filter: Exclude casual rapport-building statements that mention family
  // These are common false positives for authority objections
  const isCasualRapport = 
    // Simple affirmative responses with family mentions
    (/^(yeah|yes|yep|uh huh|mm|hmm|okay|sure|alright|well|so|and|or)/i.test(text.trim()) &&
     /(wife|husband|spouse|partner|kids|children|dog|pet|family)/i.test(lowerText) &&
     !/(need|have|must|should|can't|won't|can't decide|not my decision|speak to|ask|check|discuss|approval|permission|talk it over)/i.test(lowerText)) ||
    // Just listing family members in response to discovery questions
    (contextWindow && contextIndex !== undefined && contextIndex > 0 &&
     contextWindow[contextIndex - 1]?.text?.trim().endsWith('?') &&
     /(tell me|how|what|who|where|when|do you|have you|are you)/i.test(contextWindow[contextIndex - 1]?.text || '') &&
     /(wife|husband|spouse|partner|kids|children|dog|pet|family)/i.test(lowerText) &&
     !/(need|have|must|should|can't|won't|can't decide|not my decision|speak to|ask|check|discuss|approval|permission|talk it over)/i.test(lowerText))
  
  if (isCasualRapport) {
    return null
  }
  
  for (const [type, config] of Object.entries(OBJECTION_PATTERNS)) {
    for (const pattern of config.patterns) {
      let matches = false
      
      if (config.requiresContext && contextWindow && contextIndex !== undefined) {
        matches = detectWithContext(text, pattern, contextWindow, contextIndex)
      } else {
        matches = pattern.test(text)
      }
      
      if (matches) {
        const objectionType = type as ObjectionType
        const subCategory = detectObjectionSubCategory(objectionType, text)
        const confidence = calculateObjectionConfidence(objectionType, text, contextWindow, contextIndex)
        
        return { 
          type: objectionType, 
          severity: config.severity,
          subCategory,
          confidence
        }
      }
    }
  }
  return null
}

/**
 * Detect technique type
 */
export function detectTechnique(text: string): string | null {
  for (const [technique, patterns] of Object.entries(TECHNIQUE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        // Format display name
        const displayName = technique
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim()
          .replace(/Tie Downs/i, 'Tie-Down')
          .replace(/Future Pacing/i, 'Future Pacing')
          .replace(/Pain Discovery/i, 'Pain Discovery')
          .replace(/Takeaway/i, 'Takeaway')
          .replace(/Alternative Close/i, 'Alternative Close')
          .replace(/Price Reframe/i, 'Price Reframe')
          .replace(/Third Party Story/i, 'Third-Party Story')
          .replace(/Pattern Interrupt/i, 'Pattern Interrupt')
        return displayName
      }
    }
  }
  return null
}

/**
 * Detect micro-commitment level with context awareness
 */
export function detectMicroCommitment(
  text: string,
  contextWindow?: TranscriptEntry[],
  contextIndex?: number
): MicroCommitmentLevel | null {
  // Check in reverse order (buying → minimal) to catch strongest signals first
  const levels: MicroCommitmentLevel[] = ['buying', 'strong', 'moderate', 'minimal']
  
  // Get previous entry to check if this is a response to a question
  const isResponseToQuestion = contextWindow && contextIndex !== undefined && contextIndex > 0
    ? contextWindow[contextIndex - 1]?.text?.trim().endsWith('?')
    : false
  
  for (const level of levels) {
    for (const pattern of MICRO_COMMITMENTS[level]) {
      if (pattern.test(text)) {
        return level
      }
    }
  }
  
  // Context-aware detection for 'okay', 'sure', 'yes', 'yeah'
  const lowerText = text.toLowerCase().trim()
  const engagementWords = /(tell me more|sounds good|I'm interested|that's interesting|go ahead|continue)/i.test(text)
  
  if ((lowerText === 'okay' || lowerText === 'sure') && engagementWords) {
    return 'moderate'
  }
  
  if ((lowerText === 'yes' || lowerText === 'yeah') && isResponseToQuestion && !engagementWords) {
    // Only count as minimal if it's a response to a question but no engagement words
    return 'minimal'
  }
  
  if ((lowerText === 'yes' || lowerText === 'yeah') && isResponseToQuestion && engagementWords) {
    return 'moderate'
  }
  
  return null
}

/**
 * Calculate objection timing based on session start
 */
export function calculateObjectionTiming(
  objectionTimestamp: Date,
  sessionStartTime: Date
): ObjectionTiming {
  const secondsSinceStart = (objectionTimestamp.getTime() - sessionStartTime.getTime()) / 1000
  
  if (secondsSinceStart < 30) return 'early'
  if (secondsSinceStart < 120) return 'mid'
  return 'late'
}

/**
 * Track objection sequences
 */
export interface ObjectionSequence {
  sequence: ObjectionType[]
  timings: ObjectionTiming[]
  timestamps: Date[]
}

let objectionSequenceTracker: ObjectionSequence = {
  sequence: [],
  timings: [],
  timestamps: []
}

export function trackObjection(
  objectionType: ObjectionType,
  timing: ObjectionTiming,
  timestamp: Date
): ObjectionSequence {
  objectionSequenceTracker.sequence.push(objectionType)
  objectionSequenceTracker.timings.push(timing)
  objectionSequenceTracker.timestamps.push(timestamp)
  
  return { ...objectionSequenceTracker }
}

export function getObjectionSequence(): ObjectionSequence {
  return { ...objectionSequenceTracker }
}

export function resetObjectionSequence(): void {
  objectionSequenceTracker = {
    sequence: [],
    timings: [],
    timestamps: []
  }
}

/**
 * Detect objection stacking (3+ objections within 30 seconds)
 */
export function detectObjectionStacking(
  recentObjections: Array<{ timestamp: Date; type: ObjectionType }>
): boolean {
  if (recentObjections.length < 3) return false
  
  // Check if last 3 objections occurred within 30 seconds
  const lastThree = recentObjections.slice(-3)
  const firstTimestamp = lastThree[0].timestamp.getTime()
  const lastTimestamp = lastThree[2].timestamp.getTime()
  const timeSpan = (lastTimestamp - firstTimestamp) / 1000
  
  return timeSpan <= 30
}

/**
 * Buying temperature scoring system
 */
export interface BuyingTemperature {
  score: number // Weighted score
  trend: BuyingTemperatureTrend
  history: Array<{ timestamp: Date; level: MicroCommitmentLevel; score: number }>
}

const COMMITMENT_SCORES: Record<MicroCommitmentLevel, number> = {
  minimal: 1,
  moderate: 2,
  strong: 3,
  buying: 5
}

export function calculateBuyingTemperature(
  commitmentHistory: Array<{ timestamp: Date; level: MicroCommitmentLevel }>,
  currentTime: Date
): BuyingTemperature {
  if (commitmentHistory.length === 0) {
    return {
      score: 0,
      trend: 'stable',
      history: []
    }
  }
  
  // Weight recent commitments higher (exponential decay)
  const weightedScores = commitmentHistory.map((entry, index) => {
    const age = (currentTime.getTime() - entry.timestamp.getTime()) / 1000 / 60 // minutes
    const weight = Math.exp(-age / 10) // Decay over 10 minutes
    return {
      timestamp: entry.timestamp,
      level: entry.level,
      score: COMMITMENT_SCORES[entry.level] * weight
    }
  })
  
  // Calculate total weighted score
  const totalScore = weightedScores.reduce((sum, entry) => sum + entry.score, 0)
  
  // Determine trend (compare recent vs older scores)
  let trend: BuyingTemperatureTrend = 'stable'
  if (weightedScores.length >= 3) {
    const recent = weightedScores.slice(-3).reduce((sum, e) => sum + e.score, 0) / 3
    const older = weightedScores.slice(0, -3).length > 0
      ? weightedScores.slice(0, -3).reduce((sum, e) => sum + e.score, 0) / weightedScores.slice(0, -3).length
      : recent
    
    if (recent > older * 1.2) trend = 'warming_up'
    else if (recent < older * 0.8) trend = 'cooling_off'
  }
  
  return {
    score: totalScore,
    trend,
    history: weightedScores
  }
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
 * Enhanced with technique pattern detection and multiple resolution signals
 */
export function assessObjectionHandling(
  objectionIndex: number,
  transcript: TranscriptEntry[],
  objectionType?: ObjectionType
): {
  wasHandled: boolean
  quality: HandlingQuality | null
  responseText?: string
  techniqueUsed?: string
  resolutionSignals?: string[]
  isResolved?: boolean
} {
  // Look at next 8 exchanges after objection (expanded window for better detection)
  const followupWindow = transcript.slice(
    objectionIndex + 1,
    Math.min(objectionIndex + 9, transcript.length)
  )

  let positiveCount = 0
  let negativeCount = 0
  let responseText = ''
  let techniqueUsed: string | undefined
  const resolutionSignals: string[] = []

  // Get rep's immediate response (within 4 exchanges)
  const repResponses = followupWindow.filter(e => e.speaker === 'user').slice(0, 4)
  if (repResponses.length > 0) {
    responseText = repResponses[0].text
    
    // Check if rep used a technique to handle the objection
    for (const response of repResponses) {
      const technique = detectTechnique(response.text)
      if (technique) {
        techniqueUsed = technique
        resolutionSignals.push(`Technique used: ${technique}`)
        break
      }
    }
    
    // Check if rep addressed the objection directly
    const objectionKeywords: Record<string, string[]> = {
      price: ['price', 'cost', 'afford', 'money', 'expensive', 'cheap', 'budget', 'payment'],
      timing: ['time', 'when', 'schedule', 'ready', 'later', 'now', 'timing'],
      trust: ['trust', 'legitimate', 'proof', 'guarantee', 'references', 'company'],
      need: ['need', 'want', 'interested', 'necessary', 'important', 'problem']
    }
    
    if (objectionType && objectionKeywords[objectionType]) {
      const keywords = objectionKeywords[objectionType]
      const repText = repResponses.map(r => r.text.toLowerCase()).join(' ')
      const addressedDirectly = keywords.some(keyword => repText.includes(keyword))
      if (addressedDirectly) {
        resolutionSignals.push('Objection directly addressed')
      }
    }
  }

  // Check customer responses for indicators
  const homeownerResponses = followupWindow.filter(e => e.speaker === 'homeowner')
  
  homeownerResponses.forEach(entry => {
    // Check positive indicators
    POSITIVE_INDICATORS.forEach(pattern => {
      if (pattern.test(entry.text)) {
        positiveCount++
        // Categorize positive signals
        if (/I see|I understand|that makes sense|I get it/i.test(entry.text)) {
          resolutionSignals.push('Explicit acceptance')
        }
        if (/what.*include|how.*work|when.*start|what.*next/i.test(entry.text)) {
          resolutionSignals.push('Buying signal - asking about next steps')
        }
        if (/sounds good|that works|I'm ready|let's do it/i.test(entry.text)) {
          resolutionSignals.push('Strong agreement')
        }
      }
    })

    // Check negative indicators
    NEGATIVE_INDICATORS.forEach(pattern => {
      if (pattern.test(entry.text)) {
        negativeCount++
      }
    })
    
    // Check for micro-commitments (buying signals)
    const commitment = detectMicroCommitment(entry.text, followupWindow, homeownerResponses.indexOf(entry))
    if (commitment && (commitment === 'strong' || commitment === 'buying')) {
      resolutionSignals.push(`Strong buying signal: ${commitment}`)
      positiveCount += 2 // Weight buying signals higher
    }
  })

  // Check if homeowner repeats the same objection (indicates NOT resolved)
  if (objectionType && homeownerResponses.length > 0) {
    const objectionPatterns = OBJECTION_PATTERNS[objectionType]?.patterns || []
    const homeownerText = homeownerResponses.map(r => r.text).join(' ').toLowerCase()
    const reObjection = objectionPatterns.some(pattern => pattern.test(homeownerText))
    if (reObjection) {
      negativeCount += 2 // Re-objection is strong negative signal
      resolutionSignals.push('Same objection repeated - not resolved')
    }
  }

  // Determine if handled and quality
  // Multiple signals = better resolution
  const hasMultipleSignals = resolutionSignals.length >= 2
  const hasExplicitAcceptance = resolutionSignals.some(s => s.includes('Explicit acceptance') || s.includes('Strong agreement'))
  const hasBuyingSignal = resolutionSignals.some(s => s.includes('Buying signal') || s.includes('buying signal'))
  
  // Resolution is more confident if we have multiple positive signals
  const wasHandled = techniqueUsed || hasExplicitAcceptance || (positiveCount > negativeCount && positiveCount >= 2)
  const isResolved = wasHandled && !negativeCount && (hasExplicitAcceptance || hasBuyingSignal || hasMultipleSignals)
  
  let quality: HandlingQuality | null = null
  if (wasHandled) {
    if (isResolved && (techniqueUsed || hasBuyingSignal || positiveCount >= 4)) {
      quality = 'excellent'
    } else if (techniqueUsed || positiveCount >= 3 || hasExplicitAcceptance) {
      quality = 'good'
    } else if (positiveCount >= 2) {
      quality = 'adequate'
    } else {
      quality = 'adequate'
    }
  } else if (negativeCount > 0) {
    quality = 'poor'
  }

  return {
    wasHandled,
    quality,
    responseText,
    techniqueUsed,
    resolutionSignals: resolutionSignals.length > 0 ? resolutionSignals : undefined,
    isResolved
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
      const { objectionType, severity, subCategory, confidence } = data
      const typeMap: Record<ObjectionType, string> = {
        price: 'Price',
        timing: 'Timing',
        trust: 'Trust',
        need: 'Need',
        authority: 'Authority',
        comparison: 'Comparison',
        skepticism: 'Skepticism',
        renter_ownership: 'Renter/Ownership',
        existing_service: 'Existing Service',
        no_problem: 'No Problem Perceived',
        contract_fear: 'Contract Fear',
        door_policy: 'Door Policy',
        brush_off: 'Brush-Off',
        bad_experience: 'Bad Past Experience',
        just_moved: 'Just Moved'
      }
      const severityMap: Record<string, string> = {
        critical: 'Critical',
        high: 'High',
        medium: 'Medium',
        low: 'Low'
      }
      const subCategoryMap: Record<string, string> = {
        price_affordability: 'Affordability',
        price_value_perception: 'Value Perception',
        timing_busy: 'Busy Schedule',
        timing_not_ready: 'Not Ready to Decide',
        trust_legitimacy: 'Legitimacy Concern',
        trust_references: 'Needs References'
      }
      
      let message = `${typeMap[objectionType]} objection`
      if (subCategory && subCategoryMap[subCategory]) {
        message += ` - ${subCategoryMap[subCategory]}`
      }
      if (confidence !== undefined && confidence < 0.7) {
        message += ' [Low confidence]'
      }
      return message
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

