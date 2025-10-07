import { NextResponse } from 'next/server'
import { createServiceSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Debug endpoint to test training sessions database access
export async function GET(req: Request) {
  try {
    console.log('🔍 DEBUG: Testing training sessions database access')
    
    // Test authentication
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('👤 Auth status:', authError ? 'FAILED' : 'SUCCESS')
    console.log('👤 User ID:', user?.id)
    
    // Test service role connection
    const serviceSupabase = await createServiceSupabaseClient()
    
    // Test if training_sessions table exists
    const { data: tableTest, error: tableError } = await (serviceSupabase as any)
      .from('training_sessions')
      .select('count')
      .limit(1)
    
    console.log('🗄️ Table access:', tableError ? 'FAILED' : 'SUCCESS')
    if (tableError) console.error('Table error:', tableError)
    
    // Test if we can query training sessions
    const { data: sessions, error: queryError } = await (serviceSupabase as any)
      .from('training_sessions')
      .select('id, user_id, agent_name, status, created_at')
      .order('id', { ascending: false })
      .limit(5)
    
    console.log('📊 Query status:', queryError ? 'FAILED' : 'SUCCESS')
    console.log('📊 Recent sessions:', sessions?.length || 0)
    if (queryError) console.error('Query error:', queryError)
    
    return NextResponse.json({
      auth: authError ? 'FAILED' : 'SUCCESS',
      user_id: user?.id,
      table_access: tableError ? 'FAILED' : 'SUCCESS',
      table_error: tableError?.message,
      query_status: queryError ? 'FAILED' : 'SUCCESS',
      query_error: queryError?.message,
      recent_sessions: sessions || [],
      session_count: sessions?.length || 0
    })
  } catch (e: any) {
    console.error('🛑 DEBUG: Fatal error:', e)
    return NextResponse.json({ 
      error: 'FATAL ERROR',
      message: e.message,
      stack: e.stack
    }, { status: 500 })
  }
}
