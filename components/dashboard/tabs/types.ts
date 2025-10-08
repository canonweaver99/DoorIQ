export interface Session {
  id: number
  date: string
  time: string
  homeowner: string
  duration: string
  score: number
  feedback: string
}

export interface Insight {
  id: number
  text: string
  action: string
  type: 'success' | 'suggestion' | 'insight' | 'warning'
}

export interface LeaderboardEntry {
  id: number
  name: string
  score: number
  avatar: string
  isCurrentUser?: boolean
}

export interface PerformanceData {
  date: string
  overall: number
  rapport: number
  discovery: number
  objections: number
  closing: number
}

