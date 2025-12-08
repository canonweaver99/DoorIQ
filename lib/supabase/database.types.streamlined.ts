// Streamlined database types after migration 024
// This shows what the live_sessions table will look like after cleanup

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface StreamlinedDatabase {
  public: {
    Tables: {
      live_sessions: {
        Row: {
          // Core identification & timing
          id: string
          created_at: string
          started_at: string
          ended_at: string | null
          duration_seconds: number | null
          user_id: string
          
          // Agent info
          agent_id: string | null
          agent_name: string | null
          
          // Main scores (4 categories as requested)
          overall_score: number | null
          rapport_score: number | null
          objection_handling_score: number | null
          close_effectiveness_score: number | null
          needs_discovery_score: number | null
          
          // Additional scores
          introduction_score: number | null
          listening_score: number | null
          
          // Results
          virtual_earnings: number | null
          sale_closed: boolean | null
          return_appointment: boolean | null
          
          // Feedback
          what_worked: string[] | null
          what_failed: string[] | null
          
          // Core data
          full_transcript: Json | null
          analytics: {
            line_ratings?: Array<{
              line_number: number
              effectiveness: 'excellent' | 'good' | 'average' | 'poor'
              score: number
              alternative_lines?: string[]
              improvement_notes?: string
              category?: string
            }>
            feedback?: {
              strengths: string[]
              improvements: string[]
              specific_tips: string[]
            }
            grading_version?: string
            graded_at?: string
          } | null
          audio_url: string | null
        }
      }
    }
  }
}
