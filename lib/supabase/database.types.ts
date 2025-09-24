export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          rep_id: string
          team_id: string | null
          role: 'rep' | 'manager' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          rep_id: string
          team_id?: string | null
          role?: 'rep' | 'manager' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          rep_id?: string
          team_id?: string | null
          role?: 'rep' | 'manager' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      training_sessions: {
        Row: {
          id: string
          user_id: string
          started_at: string
          ended_at: string | null
          duration_seconds: number | null
          scenario_type: string
          overall_score: number | null
          rapport_score: number | null
          objection_handling_score: number | null
          safety_score: number | null
          close_effectiveness_score: number | null
          transcript: Json | null
          audio_url: string | null
          analytics: Json | null
          sentiment_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          scenario_type?: string
          overall_score?: number | null
          rapport_score?: number | null
          objection_handling_score?: number | null
          safety_score?: number | null
          close_effectiveness_score?: number | null
          transcript?: Json | null
          audio_url?: string | null
          analytics?: Json | null
          sentiment_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          scenario_type?: string
          overall_score?: number | null
          rapport_score?: number | null
          objection_handling_score?: number | null
          safety_score?: number | null
          close_effectiveness_score?: number | null
          transcript?: Json | null
          audio_url?: string | null
          analytics?: Json | null
          sentiment_data?: Json | null
          created_at?: string
        }
      }
      session_events: {
        Row: {
          id: string
          session_id: string
          event_type: string
          timestamp: string
          data: Json | null
        }
        Insert: {
          id?: string
          session_id: string
          event_type: string
          timestamp?: string
          data?: Json | null
        }
        Update: {
          id?: string
          session_id?: string
          event_type?: string
          timestamp?: string
          data?: Json | null
        }
      }
      achievements: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          points: number
          criteria: Json | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          points?: number
          criteria?: Json | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          points?: number
          criteria?: Json | null
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          earned_at?: string
        }
      }
      daily_challenges: {
        Row: {
          id: string
          date: string
          title: string
          description: string | null
          criteria: Json | null
          points: number
        }
        Insert: {
          id?: string
          date?: string
          title: string
          description?: string | null
          criteria?: Json | null
          points?: number
        }
        Update: {
          id?: string
          date?: string
          title?: string
          description?: string | null
          criteria?: Json | null
          points?: number
        }
      }
      user_challenge_progress: {
        Row: {
          id: string
          user_id: string
          challenge_id: string
          completed: boolean
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
        }
      }
      coaching_tips: {
        Row: {
          id: string
          category: string
          tip: string
          order_index: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          category: string
          tip: string
          order_index?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          category?: string
          tip?: string
          order_index?: number
          is_active?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
