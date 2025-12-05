export interface TranscriptEntry {
  id: string
  speaker: 'user' | 'homeowner'
  text: string
  timestamp: Date
}

export type FeedbackType = 
  | 'objection_detected' 
  | 'technique_used' 
  | 'coaching_tip' 
  | 'warning' 
  | 'voice_coaching'
  | 'objection_handling'
  | 'closing_behavior'
  | 'momentum_shift'
  | 'question_quality'
  | 'price_handling'
  | 'filler_word'

export type FeedbackSeverity = 'good' | 'neutral' | 'needs_improvement'

export interface FeedbackItem {
  id: string
  timestamp: Date
  type: FeedbackType
  message: string
  severity: FeedbackSeverity
  metadata?: {
    objectionType?: 'price' | 'timing' | 'trust' | 'need' | 'authority' | 'comparison' | 'skepticism' | 'time' | 'renter_ownership' | 'existing_service' | 'no_problem' | 'contract_fear' | 'door_policy' | 'brush_off' | 'bad_experience' | 'just_moved' // 'time' kept for backward compatibility
    techniqueName?: string
    closingType?: 'trial_close' | 'direct_close' | 'assumptive' | 'soft' | 'hard' | 'urgency'
    momentumType?: 'building_rapport' | 'interest_growing' | 'losing_engagement' | 'strong_recovery'
    questionType?: 'discovery' | 'qualifying' | 'closed'
    priceHandlingType?: 'too_early' | 'great_framing' | 'breakdown_used' | 'skipped'
    handlingQuality?: 'poor' | 'adequate' | 'good' | 'excellent'
    commitmentLevel?: 'minimal' | 'moderate' | 'strong' | 'buying'
    closeTiming?: 'too_early' | 'appropriate' | 'too_late' | 'none'
    resolutionSignals?: string[]
    isResolved?: boolean
    isReObjection?: boolean
    previousObjectionIndex?: number
    fillerWord?: string
  }
}

export interface VoiceMetrics {
  currentPitch: number // Hz
  averagePitch: number // Hz
  volume: number // dB
  speechRate: number // WPM
  pitchVariation: number // percentage
}

export interface LiveSessionMetrics {
  talkTimeRatio: number // Percentage (0-100) of rep talking vs homeowner
  wordsPerMinute: number // WPM calculated from transcript
  objectionCount: number
  techniquesUsed: string[]
  voiceMetrics?: VoiceMetrics
}

export interface SessionMetrics {
  duration: number
  sentimentScore: number
  interruptionCount: number
  objectionCount: number
  keyMomentFlags: {
    priceDiscussed: boolean
    safetyAddressed: boolean
    closeAttempted: boolean
  }
}

export interface SessionAnalytics {
  overallScore: number
  rapportScore: number
  objectionHandlingScore: number
  safetyScore: number
  closeEffectivenessScore: number
  timeToPrice: number | null
  timeToSafety: number | null
  timeToClose: number | null
  sentimentData: {
    finalSentiment: number
    interruptionCount: number
    objectionCount: number
  }
}

export interface VoiceAnalysisData {
  sessionId: string
  timestamp: Date
  avgPitch: number
  minPitch: number
  maxPitch: number
  pitchVariation: number // percentage
  avgVolume: number
  volumeConsistency: number // coefficient of variation
  avgWPM: number
  totalFillerWords: number
  fillerWordsPerMinute: number
  longPausesCount: number
  monotonePeriods: number
  pitchTimeline: { time: number; value: number }[]
  volumeTimeline: { time: number; value: number }[]
  wpmTimeline: { time: number; value: number }[]
  issues: {
    tooFast: boolean
    tooSlow: boolean
    monotone: boolean
    lowEnergy: boolean
    excessiveFillers: boolean
    poorEndings: boolean
  }
}