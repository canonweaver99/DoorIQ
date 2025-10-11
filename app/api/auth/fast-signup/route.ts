import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { email, password, full_name } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
    }

    const supabase = await createServiceSupabaseClient()

    // Create user with email confirmed so sign-in works immediately
    const { data, error } = await (supabase as any).auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (error) {
      // If the user already exists, treat as success so client can sign in
      const alreadyExists = (error.message || '').toLowerCase().includes('already registered')
      if (!alreadyExists) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true, userId: data?.user?.id || null })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Signup failed' }, { status: 500 })
  }
}


