import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: Request, context: { params: { id?: string } } | { params: Promise<{ id?: string }> }) {
  try {
    const maybePromiseParams: any = (context as any)?.params
    const params = typeof maybePromiseParams?.then === 'function' ? await maybePromiseParams : maybePromiseParams
    const id = params?.id
    
    console.log('🔍 BASIC GET:', id)
    
    const supabase = await createServiceSupabaseClient()
    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('❌ BASIC GET failed:', error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    
    console.log('✅ BASIC GET success:', data.id)
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(_req: Request, context: { params: { id?: string } } | { params: Promise<{ id?: string }> }) {
  try {
    const maybePromiseParams: any = (context as any)?.params
    const params = typeof maybePromiseParams?.then === 'function' ? await maybePromiseParams : maybePromiseParams
    const id = params?.id
    const body = await _req.json()
    
    console.log('🔧 BASIC PATCH:', id, Object.keys(body))
    
    const supabase = await createServiceSupabaseClient()
    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .update(body)
      .eq('id', id)
      .select('id')
      .single()
    
    if (error) {
      console.error('❌ BASIC PATCH failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ BASIC PATCH success')
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
