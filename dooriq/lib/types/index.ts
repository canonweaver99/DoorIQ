export interface TranscriptEntry {
  id: string
  speaker: 'user' | 'homeowner'
  text: string
  timestamp: Date
}

export interface Agent {
  id: string
  name: string
  persona: string | null
  eleven_agent_id: string
  is_active: boolean
}

export interface TrainingSession {
  id: string
  user_id: string
  agent_name: string | null
  transcript: TranscriptEntry[] | null
  duration_seconds: number | null
  overall_score: number | null
  rapport_score: number | null
  objection_handling_score: number | null
  safety_score: number | null
  close_effectiveness_score: number | null
  end_reason: string | null
  created_at: string
  updated_at: string
}

export interface LiveSession {
  id: string
  user_id: string
  agent_name: string | null
  agent_id: string | null
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  overall_score: number | null
  rapport_score: number | null
  discovery_score: number | null
  objection_handling_score: number | null
  close_score: number | null
  sale_closed: boolean | null
  virtual_earnings: number | null
  full_transcript: TranscriptEntry[] | null
  analytics: {
    scores?: {
      overall?: number
      rapport?: number
      discovery?: number
      objection_handling?: number
      closing?: number
    }
    feedback?: {
      strengths?: string[]
      improvements?: string[]
      specificTips?: string[]
    }
    coaching_plan?: Record<string, any>
  } | null
  grading_status?: 'pending' | 'in-progress' | 'completed'
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  full_name: string
  rep_id: string
  team_id: string | null
  role: 'rep' | 'manager' | 'admin'
  virtual_earnings: number
  created_at: string
  updated_at: string
}

export interface SessionGrades {
  overall: number | null
  tone: number | null
  objectionHandling: number | null
  closing: number | null
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F'
}

export interface AudioState {
  isRecording: boolean
  isPlaying: boolean
  isConnected: boolean
  error: string | null
}

