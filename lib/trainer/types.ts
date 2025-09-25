export interface TranscriptEntryGradingCriteria {
  rapportBuilding: number
  objectionHandling: number
  clarity: number
  effectiveness: number
}

export interface TranscriptEntryGrading {
  score: number
  criteria: TranscriptEntryGradingCriteria
  feedback: string
}

export interface TranscriptEntry {
  speaker: 'user' | 'austin'
  text: string
  timestamp: Date
  sentiment?: 'positive' | 'neutral' | 'negative'
  confidence?: number
  grading?: TranscriptEntryGrading | null
  id?: string
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
  transcript: TranscriptEntry[]
  sentimentData: {
    finalSentiment: number
    interruptionCount: number
    objectionCount: number
  }
}
