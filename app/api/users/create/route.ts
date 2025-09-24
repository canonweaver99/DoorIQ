import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { id, email, full_name, rep_id } = await request.json()

    if (!id || !email || !full_name || !rep_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceRole) {
      return NextResponse.json({ error: 'Supabase env vars not set' }, { status: 500 })
    }

    const admin = createClient(url, serviceRole)

    const { error } = await admin
      .from('users')
      .insert({ id, email, full_name, rep_id } as any)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unexpected error' }, { status: 500 })
  }
}


