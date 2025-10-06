import { NextResponse } from 'next/server'
import { createServiceSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('🛑 [SESSIONS/USER API] Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🟢 [SESSIONS/USER API] Fetching sessions for user:', user.id)

    // Use service role client if available to bypass RLS
    const serviceSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceSupabaseClient()
      : supabase

    const { data, error } = await (serviceSupabase as any)
      .from('live_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })

    if (error) {
      console.error('🛑 [SESSIONS/USER API] Query error:', error)
      return NextResponse.json({ error: 'Failed to fetch sessions', details: error.message }, { status: 500 })
    }

    console.log('🟢 [SESSIONS/USER API] Found', data?.length || 0, 'sessions')
    
    return NextResponse.json({ sessions: data || [] })
  } catch (e: any) {
    console.error('🛑 [SESSIONS/USER API] FATAL:', e)
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
