export interface GradeInfo {
  letter: 'F' | 'D' | 'C' | 'B' | 'A'
  color: string
  bgColor: string
  borderColor: string
}

export interface KeyIssue {
  text: string
  severity: 'warning' | 'error'
}

export interface VoiceMetrics {
  confidence: number
  energy: number
  clarity: number
  averageScore: number
}

export interface ConversationMetrics {
  talkRatio: number
  pace: number // WPM
  warning?: string
  averageScore: number
}

export interface ClosingMetrics {
  success: number // percentage
  attempts: string // "0/1" format
  status: 'MISSED' | 'SUCCESS'
  averageScore: number
}

export interface OverallMetrics {
  score: number // out of 100
  grade: GradeInfo
  percentile: string
  averageScore: number
}

export interface SessionPerformance {
  id: string
  overallScore: number
  grade: GradeInfo
  agentName: string
  createdAt: string
  durationSeconds?: number | null
  keyIssues: KeyIssue[]
  voice: VoiceMetrics
  conversation: ConversationMetrics
  closing: ClosingMetrics
  overall: OverallMetrics
}

export interface DashboardData {
  userName: string
  currentDateTime: string
  session: SessionPerformance | null
  loading: boolean
  error: string | null
}

