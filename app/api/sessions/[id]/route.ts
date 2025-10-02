import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: Request, context: { params: Promise<{ id?: string }> }) {
  try {
    const params = await context.params
    const id = params?.id
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const supabase = await createServiceSupabaseClient()
    const { data, error } = await (supabase as any)
      .from('live_sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


