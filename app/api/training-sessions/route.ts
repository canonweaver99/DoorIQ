import { NextResponse } from 'next/server'
import { createServiceSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Create new training session
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { agent_name, agent_id } = body
    
    if (!agent_name) {
      return NextResponse.json({ error: 'agent_name is required' }, { status: 400 })
    }
    
    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Use service role to create session
    const serviceSupabase = await createServiceSupabaseClient()
    
    const { data, error } = await (serviceSupabase as any)
      .from('training_sessions')
      .insert({
        user_id: user.id,
        agent_name,
        agent_id,
        status: 'active',
        started_at: new Date().toISOString()
      })
      .select('id, status, started_at')
      .single()
    
    if (error) {
      console.error('Error creating training session:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ Training session created:', data.id, 'for user:', user.id)
    console.log('📊 Session data:', JSON.stringify(data, null, 2))
    
    return NextResponse.json({ 
      id: data.id, 
      status: data.status,
      started_at: data.started_at
    })
  } catch (e: any) {
    console.error('Fatal error creating training session:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Get user's training sessions
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const status = url.searchParams.get('status') // optional filter
    
    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Use service role for query
    const serviceSupabase = await createServiceSupabaseClient()
    
    let query = (serviceSupabase as any)
      .from('training_sessions')
      .select('id, agent_name, started_at, ended_at, duration_seconds, status, overall_score, virtual_earnings')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(limit)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching training sessions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ sessions: data || [] })
  } catch (e: any) {
    console.error('Fatal error fetching training sessions:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
