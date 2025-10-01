export interface TranscriptEntry {
  id: string
  speaker: 'user' | 'homeowner'
  text: string
  timestamp: Date
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