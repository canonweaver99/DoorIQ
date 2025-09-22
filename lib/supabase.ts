import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

// Client for browser/public use
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server client with service role (use only in server-side code)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database types (we'll generate these from your Supabase schema)
export interface Database {
  public: {
    Tables: {
      attempts: {
        Row: {
          id: string
          created_at: string
          user_id: string
          persona: any // JSON
          state: string
          turn_count: number
          completed_at?: string
          evaluation?: any // JSON
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          persona: any
          state: string
          turn_count?: number
          completed_at?: string
          evaluation?: any
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          persona?: any
          state?: string
          turn_count?: number
          completed_at?: string
          evaluation?: any
        }
      }
      turns: {
        Row: {
          id: string
          created_at: string
          attempt_id: string
          turn_number: number
          user_message: string
          ai_response: string
          user_audio_url?: string
          ai_audio_url?: string
        }
        Insert: {
          id?: string
          created_at?: string
          attempt_id: string
          turn_number: number
          user_message: string
          ai_response: string
          user_audio_url?: string
          ai_audio_url?: string
        }
        Update: {
          id?: string
          created_at?: string
          attempt_id?: string
          turn_number?: number
          user_message?: string
          ai_response?: string
          user_audio_url?: string
          ai_audio_url?: string
        }
      }
      scenarios: {
        Row: {
          id: string
          created_at: string
          name: string
          industry: string
          persona_template: any // JSON
          success_criteria: any // JSON
          active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          industry: string
          persona_template: any
          success_criteria: any
          active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          industry?: string
          persona_template?: any
          success_criteria?: any
          active?: boolean
        }
      }
      audio_recordings: {
        Row: {
          id: string
          created_at: string
          attempt_id: string
          turn_number: number
          audio_url: string
          transcription?: string
          duration_seconds?: number
          role: 'user' | 'ai'
        }
        Insert: {
          id?: string
          created_at?: string
          attempt_id: string
          turn_number: number
          audio_url: string
          transcription?: string
          duration_seconds?: number
          role: 'user' | 'ai'
        }
        Update: {
          id?: string
          created_at?: string
          attempt_id?: string
          turn_number?: number
          audio_url?: string
          transcription?: string
          duration_seconds?: number
          role?: 'user' | 'ai'
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
  }
}
