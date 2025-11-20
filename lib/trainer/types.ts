export interface TranscriptEntry {
  id: string
  speaker: 'user' | 'homeowner'
  text: string
  timestamp: Date
}

export type FeedbackType = 'objection_detected' | 'technique_used' | 'coaching_tip' | 'warning'
export type FeedbackSeverity = 'good' | 'neutral' | 'needs_improvement'

export interface FeedbackItem {
  id: string
  timestamp: Date
  type: FeedbackType
  message: string
  severity: FeedbackSeverity
  metadata?: {
    objectionType?: 'price' | 'time' | 'authority' | 'need'
    techniqueName?: string
  }
}

export interface LiveSessionMetrics {
  talkTimeRatio: number // Percentage (0-100) of rep talking vs homeowner
  objectionCount: number
  techniquesUsed: string[]
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