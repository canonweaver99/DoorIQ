export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  console.log('🔐 SET-PASSWORD: Starting...')
  
  try {
    const { email, password, sessionId } = await request.json()
    console.log('📧 Email:', email)
    console.log('🔗 Session ID:', sessionId ? sessionId.substring(0, 20) + '...' : 'none')

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const stripeKey = process.env.STRIPE_SECRET_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing Supabase configuration')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get user name from Stripe session if available
    let userName = email.split('@')[0]
    if (sessionId && stripeKey) {
      try {
        const stripe = new Stripe(stripeKey, { apiVersion: '2025-09-30.clover' })
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        if (session.metadata?.user_name) {
          userName = session.metadata.user_name
        }
        console.log('📋 User name from Stripe:', userName)
      } catch (e) {
        console.log('⚠️ Could not get name from Stripe session')
      }
    }

    // SIMPLE APPROACH: Try to sign up the user with password
    console.log('👤 Attempting signUp for:', email.toLowerCase())
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: password,
      options: {
        data: {
          full_name: userName,
          source: 'checkout',
        },
      },
    })

    console.log('📋 SignUp result:', signUpError ? `Error: ${signUpError.message}` : `Success: ${signUpData?.user?.id}`)

    let userId: string | null = null

    if (signUpError) {
      // User might already exist - try to get them and update password
      if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already exists')) {
        console.log('⚠️ User already exists, updating password...')
        
        // Get user by email using admin API
        const { data: userData } = await supabase.auth.admin.listUsers()
        const existingUser = userData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
        
        if (existingUser) {
          userId = existingUser.id
          console.log('✅ Found existing user:', userId)
          
          // Update password
          const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
            password: password,
            email_confirm: true,
          })
          
          if (updateError) {
            console.error('❌ Failed to update password:', updateError.message)
            return NextResponse.json({ error: 'Failed to update password: ' + updateError.message }, { status: 500 })
          }
          console.log('✅ Password updated for existing user')
        } else {
          console.error('❌ Could not find existing user')
          return NextResponse.json({ error: 'User exists but could not be found' }, { status: 500 })
        }
      } else {
        console.error('❌ SignUp failed:', signUpError.message)
        return NextResponse.json({ error: 'Failed to create account: ' + signUpError.message }, { status: 500 })
      }
    } else if (signUpData?.user) {
      userId = signUpData.user.id
      console.log('✅ Created new user:', userId)
    }

    if (!userId) {
      return NextResponse.json({ error: 'Failed to create or find user' }, { status: 500 })
    }

    // Create user profile in database if it doesn't exist
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: email.toLowerCase(),
        full_name: userName,
        rep_id: `REP-${Date.now().toString().slice(-6)}`,
        role: 'rep',
        virtual_earnings: 0,
        checkout_session_id: sessionId || null,
        account_setup_completed_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      })

    if (profileError) {
      console.log('⚠️ Profile upsert error (may be ok if exists):', profileError.message)
    } else {
      console.log('✅ Profile created/updated')
    }

    console.log('✅ SUCCESS: Account ready for', email)
    return NextResponse.json({ success: true, message: 'Account created successfully' })

  } catch (error: any) {
    console.error('❌ FATAL ERROR:', error)
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 })
  }
}
