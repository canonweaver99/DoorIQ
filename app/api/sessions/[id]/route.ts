import { NextResponse } from 'next/server'
import { createServiceSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: Request, context: { params: { id?: string } } | { params: Promise<{ id?: string }> }) {
  try {
    // Support both Promise and non-Promise params (Next.js variations)
    const maybePromiseParams: any = (context as any)?.params
    const params = typeof maybePromiseParams?.then === 'function' ? await maybePromiseParams : maybePromiseParams

    let id = params?.id || ''
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    // Decode and sanitize the session id to avoid any URL encoding or stray chars
    try {
      id = decodeURIComponent(id)
    } catch {}
    id = id.replace(/[^a-f0-9-]/gi, '')

    // Prefer service role if available (bypass RLS); otherwise fall back to cookie-auth client
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceSupabaseClient()
      : await createServerSupabaseClient()
    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      console.error('🛑 [SESSIONS API] Fetch error or not found for id', id, error)
      return NextResponse.json({ error: 'Session not found', details: error?.message || null }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (e: any) {
    console.error('🛑 [SESSIONS API] FATAL:', e)
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


