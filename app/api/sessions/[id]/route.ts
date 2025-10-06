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
    console.log('🔍 [SESSIONS API] GET request for session:', id)
    
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    // Decode and sanitize the session id to avoid any URL encoding or stray chars
    const originalId = id
    try {
      id = decodeURIComponent(id)
    } catch {}
    id = id.replace(/[^a-f0-9-]/gi, '')
    
    console.log('🔍 [SESSIONS API] Sanitized ID:', id, 'Original:', originalId)

    // Prefer service role if available (bypass RLS); otherwise fall back to cookie-auth client
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceSupabaseClient()
      : await createServerSupabaseClient()
    
    console.log('🔍 [SESSIONS API] Querying database for session...')
    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      console.error('🛑 [SESSIONS API] Fetch error or not found for id', id, error)
      
      // Try to check if session exists at all
      const { data: checkData, error: checkError } = await (supabase as any)
        .from('live_sessions')
        .select('id, created_at')
        .eq('id', id)
      
      console.log('🔍 [SESSIONS API] Session existence check:', { 
        found: checkData?.length || 0, 
        checkError 
      })
      
      return NextResponse.json({ error: 'Session not found', details: error?.message || null }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (e: any) {
    console.error('🛑 [SESSIONS API] FATAL:', e)
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


