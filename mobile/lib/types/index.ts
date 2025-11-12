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

