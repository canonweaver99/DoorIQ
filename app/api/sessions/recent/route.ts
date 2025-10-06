import { NextResponse } from 'next/server'
import { createServiceSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const user_id = url.searchParams.get('user_id')
    const limit = parseInt(url.searchParams.get('limit') || '10')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    // Use service role client
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceSupabaseClient()
      : await createServerSupabaseClient()

    // Try direct query first (RPC function might not exist)
    console.log('🔍 [SESSIONS/RECENT API] Fetching sessions for user:', user_id)
    
    const { data: sessions, error: queryError } = await (supabase as any)
      .from('live_sessions')
      .select('id, started_at, ended_at, agent_name, duration_seconds')
      .eq('user_id', user_id)
      .order('started_at', { ascending: false })
      .limit(limit)
    
    if (queryError) {
      console.error('🛑 [SESSIONS/RECENT API] Query error:', queryError)
      
      // Try RPC as fallback
      const { data: rpcData, error: rpcError } = await (supabase as any).rpc('get_user_sessions', {
        p_user_id: user_id,
        p_limit: limit
      }).catch((e: any) => ({ data: null, error: e }))
      
      if (!rpcError && rpcData) {
        console.log('🟢 [SESSIONS/RECENT API] Found', rpcData?.length || 0, 'sessions via RPC')
        return NextResponse.json({ sessions: rpcData })
      }
      
      return NextResponse.json({ error: 'Failed to fetch sessions', details: queryError.message }, { status: 500 })
    }
    
    console.log('🟢 [SESSIONS/RECENT API] Found', sessions?.length || 0, 'sessions')
    console.log('🟢 [SESSIONS/RECENT API] Session IDs:', sessions?.map((s: any) => s.id))
    
    return NextResponse.json({ sessions: sessions || [] })
  } catch (e: any) {
    console.error('🛑 [SESSIONS/RECENT API] FATAL:', e)
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
