import { NextResponse } from 'next/server'
import { createServiceSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// WORKING session system using existing live_sessions table
// Based on what we know works from the backend test

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { agent_name, agent_id } = body
    
    console.log('🚀 WORKING: Creating session for agent:', agent_name)
    
    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Auth failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('✅ User authenticated:', user.id)
    
    // Use service role for insert
    const serviceSupabase = await createServiceSupabaseClient()
    
    // Use only the fields we know exist and work
    const insertData = {
      user_id: user.id,
      agent_name: agent_name || 'Unknown Agent',
      started_at: new Date().toISOString()
    }
    
    console.log('📝 Inserting session data:', insertData)
    
    const { data, error } = await (serviceSupabase as any)
      .from('live_sessions')
      .insert(insertData)
      .select('id, user_id, agent_name, started_at')
      .single()
    
    if (error) {
      console.error('❌ Database insert failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ WORKING session created successfully:', data)
    
    return NextResponse.json({ 
      id: data.id,
      status: 'active',
      debug: {
        user_id: data.user_id,
        agent_name: data.agent_name,
        started_at: data.started_at
      }
    })
  } catch (e: any) {
    console.error('❌ WORKING session creation failed:', e)
    return NextResponse.json({ 
      error: e.message,
      stack: e.stack
    }, { status: 500 })
  }
}
