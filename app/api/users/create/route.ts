import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { id, email, full_name } = await request.json()

    console.log('🔐 Creating user profile:', { id, email, full_name })

    if (!id || !email || !full_name) {
      console.error('❌ Missing required fields:', { id: !!id, email: !!email, full_name: !!full_name })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceRole) {
      console.error('❌ Supabase environment variables not configured')
      return NextResponse.json({ error: 'Supabase env vars not set' }, { status: 500 })
    }

    const admin = createClient(url, serviceRole)

    // Generate a rep ID
    const repId = `REP-${Date.now().toString().slice(-6)}`
    
    const { error } = await admin
      .from('users')
      .insert({ 
        id, 
        email, 
        full_name,
        rep_id: repId,
        role: 'rep',
        virtual_earnings: 0
      } as any)

    if (error) {
      console.error('❌ Failed to insert user:', error)
      
      // If user already exists, that's okay - they might be signing in with OAuth
      if (error.code === '23505') {
        console.log('✅ User already exists, skipping insert')
        return NextResponse.json({ ok: true, message: 'User already exists' })
      }
      
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Grant 5 free credits to new free users
    const { error: creditsError } = await admin
      .from('user_session_limits')
      .insert({
        user_id: id,
        sessions_this_month: 0,
        sessions_limit: 5,
        last_reset_date: new Date().toISOString().split('T')[0]
      })

    if (creditsError) {
      console.error('⚠️ Failed to create credits record:', creditsError)
      // Don't fail the request if credits creation fails - user was created successfully
    } else {
      console.log('✅ Granted 5 free credits to new user')
    }

    console.log('✅ User profile created successfully')
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('❌ Unexpected error creating user:', error)
    return NextResponse.json({ error: error.message ?? 'Unexpected error' }, { status: 500 })
  }
}


