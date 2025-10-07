import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Get single session from live_sessions table (simple approach)
export async function GET(_req: Request, context: { params: { id?: string } } | { params: Promise<{ id?: string }> }) {
  try {
    const maybePromiseParams: any = (context as any)?.params
    const params = typeof maybePromiseParams?.then === 'function' ? await maybePromiseParams : maybePromiseParams
    
    const id = params?.id
    if (!id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    console.log('🔍 Fetching simple session:', id)
    
    const serviceSupabase = await createServiceSupabaseClient()
    
    const { data, error } = await (serviceSupabase as any)
      .from('live_sessions')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !data) {
      console.error('❌ Simple session not found:', id, error)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    console.log('✅ Simple session found:', data.id)
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('Error fetching simple session:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Update session (for completion and grading)
export async function PATCH(_req: Request, context: { params: { id?: string } } | { params: Promise<{ id?: string }> }) {
  try {
    const maybePromiseParams: any = (context as any)?.params
    const params = typeof maybePromiseParams?.then === 'function' ? await maybePromiseParams : maybePromiseParams
    
    const id = params?.id
    if (!id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    const body = await _req.json()
    console.log('🔧 Updating simple session:', id, 'with:', Object.keys(body))
    
    const serviceSupabase = await createServiceSupabaseClient()
    
    const { data, error } = await (serviceSupabase as any)
      .from('live_sessions')
      .update(body)
      .eq('id', id)
      .select('id, overall_score')
      .single()
    
    if (error) {
      console.error('❌ Error updating simple session:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ Simple session updated:', data.id)
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('Error updating simple session:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
