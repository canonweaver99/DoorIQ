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
          virtual_earnings: number
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
          virtual_earnings?: number
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
          virtual_earnings?: number
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
      live_sessions: {
        Row: {
          id: string
          created_at: string
          started_at: string
          ended_at: string | null
          duration_seconds: number | null
          user_id: string
          agent_id: string | null
          agent_name: string | null
          agent_persona: string | null
          conversation_id: string | null
          audio_url: string | null
          total_turns: number | null
          conversation_duration_seconds: number | null
          questions_asked_by_homeowner: number | null
          objections_raised: number | null
          objections_resolved: number | null
          homeowner_response_pattern: string | null
          homeowner_first_words: string | null
          homeowner_final_words: string | null
          homeowner_key_questions: string[] | null
          sales_rep_energy_level: 'low' | 'moderate' | 'high' | 'too aggressive' | null
          close_attempted: boolean | null
          closing_technique: string | null
          rapport_score: number | null
          sentiment_progression: string | null
          time_to_value_seconds: number | null
          interruptions_count: number | null
          filler_words_count: number | null
          conversation_summary: string | null
          what_worked: string[] | null
          what_failed: string[] | null
          key_learnings: string[] | null
          opening_introduction_score: number | null
          opening_introduction_reason: string | null
          rapport_building_score: number | null
          rapport_building_reason: string | null
          needs_discovery_score: number | null
          needs_discovery_reason: string | null
          value_communication_score: number | null
          value_communication_reason: string | null
          objection_handling_score: number | null
          objection_handling_reason: string | null
          closing_score: number | null
          closing_reason: string | null
          deductions_interruption_count: number | null
          deductions_pricing_deflections: number | null
          deductions_pressure_tactics: boolean | null
          deductions_made_up_info: boolean | null
          deductions_rude_or_dismissive: boolean | null
          deductions_total: number | null
          overall_score: number | null
          grade_letter: 'A+'|'A'|'B+'|'B'|'C+'|'C'|'D'|'F' | null
          pass: boolean | null
          outcome: 'SUCCESS'|'FAILURE'|'PARTIAL' | null
          sale_closed: boolean | null
          sale_amount: number | null
          service_type: string | null
          service_frequency: string | null
          total_contract_value: number | null
          commission_amount: number | null
          revenue_category: string | null
          safety_score: number | null
          close_effectiveness_score: number | null
          introduction_score: number | null
          listening_score: number | null
          virtual_earnings: number | null
          full_transcript: Json | null
          analytics: Json | null
          device_info: Json | null
          conversation_metadata: Json | null
          user_feedback_rating: number | null
          user_feedback_improvement_area: string | null
          user_feedback_text: string | null
          user_feedback_submitted_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          user_id: string
          agent_id?: string | null
          agent_name?: string | null
          agent_persona?: string | null
          conversation_id?: string | null
          audio_url?: string | null
          total_turns?: number | null
          conversation_duration_seconds?: number | null
          questions_asked_by_homeowner?: number | null
          objections_raised?: number | null
          objections_resolved?: number | null
          homeowner_response_pattern?: string | null
          homeowner_first_words?: string | null
          homeowner_final_words?: string | null
          homeowner_key_questions?: string[] | null
          sales_rep_energy_level?: 'low' | 'moderate' | 'high' | 'too aggressive' | null
          close_attempted?: boolean | null
          closing_technique?: string | null
          rapport_score?: number | null
          sentiment_progression?: string | null
          time_to_value_seconds?: number | null
          interruptions_count?: number | null
          filler_words_count?: number | null
          conversation_summary?: string | null
          what_worked?: string[] | null
          what_failed?: string[] | null
          key_learnings?: string[] | null
          opening_introduction_score?: number | null
          opening_introduction_reason?: string | null
          rapport_building_score?: number | null
          rapport_building_reason?: string | null
          needs_discovery_score?: number | null
          needs_discovery_reason?: string | null
          value_communication_score?: number | null
          value_communication_reason?: string | null
          objection_handling_score?: number | null
          objection_handling_reason?: string | null
          closing_score?: number | null
          closing_reason?: string | null
          deductions_interruption_count?: number | null
          deductions_pricing_deflections?: number | null
          deductions_pressure_tactics?: boolean | null
          deductions_made_up_info?: boolean | null
          deductions_rude_or_dismissive?: boolean | null
          deductions_total?: number | null
          overall_score?: number | null
          grade_letter?: 'A+'|'A'|'B+'|'B'|'C+'|'C'|'D'|'F' | null
          pass?: boolean | null
          outcome?: 'SUCCESS'|'FAILURE'|'PARTIAL' | null
          sale_closed?: boolean | null
          sale_amount?: number | null
          service_type?: string | null
          service_frequency?: string | null
          total_contract_value?: number | null
          commission_amount?: number | null
          revenue_category?: string | null
          safety_score?: number | null
          close_effectiveness_score?: number | null
          introduction_score?: number | null
          listening_score?: number | null
          virtual_earnings?: number | null
          full_transcript?: Json | null
          analytics?: Json | null
          device_info?: Json | null
          conversation_metadata?: Json | null
          user_feedback_rating?: number | null
          user_feedback_improvement_area?: string | null
          user_feedback_text?: string | null
          user_feedback_submitted_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          user_id?: string
          agent_id?: string | null
          agent_name?: string | null
          agent_persona?: string | null
          conversation_id?: string | null
          audio_url?: string | null
          total_turns?: number | null
          conversation_duration_seconds?: number | null
          questions_asked_by_homeowner?: number | null
          objections_raised?: number | null
          objections_resolved?: number | null
          homeowner_response_pattern?: string | null
          homeowner_first_words?: string | null
          homeowner_final_words?: string | null
          homeowner_key_questions?: string[] | null
          sales_rep_energy_level?: 'low' | 'moderate' | 'high' | 'too aggressive' | null
          close_attempted?: boolean | null
          closing_technique?: string | null
          rapport_score?: number | null
          sentiment_progression?: string | null
          time_to_value_seconds?: number | null
          interruptions_count?: number | null
          filler_words_count?: number | null
          conversation_summary?: string | null
          what_worked?: string[] | null
          what_failed?: string[] | null
          key_learnings?: string[] | null
          opening_introduction_score?: number | null
          opening_introduction_reason?: string | null
          rapport_building_score?: number | null
          rapport_building_reason?: string | null
          needs_discovery_score?: number | null
          needs_discovery_reason?: string | null
          value_communication_score?: number | null
          value_communication_reason?: string | null
          objection_handling_score?: number | null
          objection_handling_reason?: string | null
          closing_score?: number | null
          closing_reason?: string | null
          deductions_interruption_count?: number | null
          deductions_pricing_deflections?: number | null
          deductions_pressure_tactics?: boolean | null
          deductions_made_up_info?: boolean | null
          deductions_rude_or_dismissive?: boolean | null
          deductions_total?: number | null
          overall_score?: number | null
          grade_letter?: 'A+'|'A'|'B+'|'B'|'C+'|'C'|'D'|'F' | null
          pass?: boolean | null
          outcome?: 'SUCCESS'|'FAILURE'|'PARTIAL' | null
          sale_closed?: boolean | null
          sale_amount?: number | null
          service_type?: string | null
          service_frequency?: string | null
          total_contract_value?: number | null
          commission_amount?: number | null
          revenue_category?: string | null
          safety_score?: number | null
          close_effectiveness_score?: number | null
          introduction_score?: number | null
          listening_score?: number | null
          virtual_earnings?: number | null
          full_transcript?: Json | null
          analytics?: Json | null
          device_info?: Json | null
          conversation_metadata?: Json | null
          user_feedback_rating?: number | null
          user_feedback_improvement_area?: string | null
          user_feedback_text?: string | null
          user_feedback_submitted_at?: string | null
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
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          session_id: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          session_id: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          session_id?: string
          message?: string
          is_read?: boolean
          created_at?: string
        }
      }
      manager_rep_assignments: {
        Row: {
          id: string
          manager_id: string
          rep_id: string
          assigned_at: string
        }
        Insert: {
          id?: string
          manager_id: string
          rep_id: string
          assigned_at?: string
        }
        Update: {
          id?: string
          manager_id?: string
          rep_id?: string
          assigned_at?: string
        }
      }
      agents: {
        Row: {
          id: string
          name: string
          persona: string | null
          eleven_agent_id: string
          eleven_voice_id: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          persona?: string | null
          eleven_agent_id: string
          eleven_voice_id?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          persona?: string | null
          eleven_agent_id?: string
          eleven_voice_id?: string | null
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
