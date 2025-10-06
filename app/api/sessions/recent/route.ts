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

    // Use raw SQL to avoid UUID corruption in Supabase SDK
    const { data, error } = await (supabase as any).rpc('get_user_sessions', {
      p_user_id: user_id,
      p_limit: limit
    })

    if (error) {
      console.error('🛑 [SESSIONS/RECENT API] RPC error:', error)
      // Fallback to direct query if RPC doesn't exist
      const { data: fallbackData, error: fallbackError } = await (supabase as any)
        .from('live_sessions')
        .select('id, started_at, ended_at')
        .eq('user_id', user_id)
        .order('started_at', { ascending: false })
        .limit(limit)
      
      if (fallbackError) {
        console.error('🛑 [SESSIONS/RECENT API] Fallback error:', fallbackError)
        return NextResponse.json({ error: 'Failed to fetch sessions', details: fallbackError.message }, { status: 500 })
      }
      
      console.log('🟢 [SESSIONS/RECENT API] Found', fallbackData?.length || 0, 'sessions (fallback)')
      return NextResponse.json({ sessions: fallbackData || [] })
    }

    console.log('🟢 [SESSIONS/RECENT API] Found', data?.length || 0, 'sessions for user', user_id)
    
    return NextResponse.json({ sessions: data || [] })
  } catch (e: any) {
    console.error('🛑 [SESSIONS/RECENT API] FATAL:', e)
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
