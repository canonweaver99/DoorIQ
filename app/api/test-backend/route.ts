import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Test all backend components
export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {}
  }
  
  try {
    // Test 1: Environment Variables
    console.log('🧪 Testing environment variables...')
    results.tests.env = {
      openai_key: process.env.OPENAI_API_KEY ? 'SET' : 'MISSING',
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      supabase_anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      supabase_service: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'
    }
    
    // Test 2: Supabase Connection
    console.log('🧪 Testing Supabase connection...')
    try {
      const supabase = await createServiceSupabaseClient()
      const { data, error } = await (supabase as any)
        .from('live_sessions')
        .select('count')
        .limit(1)
      
      results.tests.supabase = {
        connection: error ? 'FAILED' : 'SUCCESS',
        error: error?.message || null
      }
    } catch (e: any) {
      results.tests.supabase = {
        connection: 'FAILED',
        error: e.message
      }
    }
    
    // Test 3: Recent Sessions
    console.log('🧪 Testing recent sessions query...')
    try {
      const supabase = await createServiceSupabaseClient()
      const { data: sessions, error } = await (supabase as any)
        .from('live_sessions')
        .select('id, user_id, agent_name, started_at, overall_score, full_transcript')
        .order('started_at', { ascending: false })
        .limit(5)
      
      results.tests.recent_sessions = {
        status: error ? 'FAILED' : 'SUCCESS',
        error: error?.message || null,
        count: sessions?.length || 0,
        sessions: sessions?.map((s: any) => ({
          id: s.id,
          user_id: s.user_id,
          agent_name: s.agent_name,
          started_at: s.started_at,
          has_transcript: Array.isArray(s.full_transcript) && s.full_transcript.length > 0,
          transcript_lines: Array.isArray(s.full_transcript) ? s.full_transcript.length : 0,
          overall_score: s.overall_score
        })) || []
      }
    } catch (e: any) {
      results.tests.recent_sessions = {
        status: 'FAILED',
        error: e.message
      }
    }
    
    // Test 4: OpenAI Connection (if key exists)
    if (process.env.OPENAI_API_KEY) {
      console.log('🧪 Testing OpenAI connection...')
      try {
        const OpenAI = require('openai')
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Say "OpenAI test successful"' }],
          max_tokens: 10
        })
        
        results.tests.openai = {
          connection: 'SUCCESS',
          response: response.choices[0]?.message?.content || 'No response'
        }
      } catch (e: any) {
        results.tests.openai = {
          connection: 'FAILED',
          error: e.message
        }
      }
    } else {
      results.tests.openai = {
        connection: 'SKIPPED',
        error: 'OPENAI_API_KEY not set'
      }
    }
    
    console.log('🧪 Backend test results:', JSON.stringify(results, null, 2))
    
    return NextResponse.json(results)
  } catch (e: any) {
    console.error('🛑 Fatal error in backend test:', e)
    return NextResponse.json({ 
      error: 'FATAL ERROR',
      message: e.message,
      tests: results.tests
    }, { status: 500 })
  }
}
