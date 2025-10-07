import { NextResponse } from 'next/server'
import { createServiceSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ULTRA-SIMPLE session system using existing live_sessions table
// This bypasses all the training_sessions complexity

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { agent_name, agent_id } = body
    
    // Get user
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Use the existing live_sessions table but with a simple approach
    const serviceSupabase = await createServiceSupabaseClient()
    
    // Only use fields that definitely exist in live_sessions
    const { data, error } = await (serviceSupabase as any)
      .from('live_sessions')
      .insert({
        user_id: user.id,
        agent_name: agent_name,
        started_at: new Date().toISOString()
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('Error creating simple session:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Return the UUID as a simple string - we'll use it directly
    const sessionId = data.id
    console.log('✅ Simple session created:', sessionId)
    
    return NextResponse.json({ 
      id: sessionId,
      status: 'active'
    })
  } catch (e: any) {
    console.error('Fatal error creating simple session:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const serviceSupabase = await createServiceSupabaseClient()
    
    const { data, error } = await (serviceSupabase as any)
      .from('live_sessions')
      .select('id, agent_name, started_at, ended_at, duration_seconds, overall_score, rapport_score, discovery_score, objection_handling_score, closing_score, virtual_earnings')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('Error fetching simple sessions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ sessions: data || [] })
  } catch (e: any) {
    console.error('Fatal error fetching simple sessions:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
