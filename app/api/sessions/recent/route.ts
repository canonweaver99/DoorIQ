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

    // Prefer service role if available (bypass RLS); otherwise fall back to cookie-auth client
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceSupabaseClient()
      : await createServerSupabaseClient()

    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .select('id, started_at, ended_at')
      .eq('user_id', user_id)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('🛑 [SESSIONS/RECENT API] Query error:', error)
      return NextResponse.json({ error: 'Failed to fetch sessions', details: error.message }, { status: 500 })
    }

    console.log('🟢 [SESSIONS/RECENT API] Found', data?.length || 0, 'sessions for user', user_id)
    
    return NextResponse.json({ sessions: data || [] })
  } catch (e: any) {
    console.error('🛑 [SESSIONS/RECENT API] FATAL:', e)
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
