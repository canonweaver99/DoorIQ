import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: Request, context: { params: { id?: string } } | { params: Promise<{ id?: string }> }) {
  try {
    // Support both Promise and non-Promise params
    const maybePromiseParams: any = (context as any)?.params
    const params = typeof maybePromiseParams?.then === 'function' ? await maybePromiseParams : maybePromiseParams

    const id = params?.id
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    console.log('Fetching session:', id)

    const supabase = await createServiceSupabaseClient()
    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      console.error('Session not found:', id, error)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    console.log('Session found:', data.id)
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
