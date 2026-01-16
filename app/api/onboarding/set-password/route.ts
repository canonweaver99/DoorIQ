export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
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

    console.log('🔧 Env check - Supabase URL:', supabaseUrl ? '✅' : '❌ MISSING')
    console.log('🔧 Env check - Service Role Key:', serviceRoleKey ? '✅' : '❌ MISSING')
    console.log('🔧 Env check - Stripe Key:', stripeKey ? `✅ (${stripeKey.substring(0, 7)}...)` : '❌ MISSING')

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration error: Missing Supabase config' }, { status: 500 })
    }

    const supabase = await createServiceSupabaseClient()
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // STEP 1: Try to find existing user
    console.log('👤 Step 1: Looking for existing user...')
    let userId: string | null = null
    
    const { data: existingUser, error: findError } = await adminClient.auth.admin.getUserByEmail(email.toLowerCase())
    if (existingUser?.user) {
      userId = existingUser.user.id
      console.log('✅ Found existing user:', userId)
    } else {
      console.log('❌ User not found:', findError?.message || 'No user with this email')
    }

    // STEP 2: If no user and we have sessionId, verify Stripe and create user
    if (!userId && sessionId && stripeKey) {
      console.log('👤 Step 2: No user found, checking Stripe session...')
      
      const stripe = new Stripe(stripeKey, { apiVersion: '2025-09-30.clover' })
      
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        console.log('📋 Stripe session:', {
          status: session.status,
          payment_status: session.payment_status,
          customer_email: session.customer_email,
          metadata_email: session.metadata?.user_email,
          customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id
        })

        // Get the email and name from session
        const sessionEmail = session.customer_email || session.metadata?.user_email || ''
        const userName = session.metadata?.user_name || email.split('@')[0]
        
        // Check if session is valid (complete or has a customer)
        const isValid = session.status === 'complete' || 
                       session.payment_status === 'paid' || 
                       session.payment_status === 'no_payment_required' ||
                       session.customer

        console.log('🔍 Session valid?', isValid)
        console.log('🔍 Session email:', sessionEmail)
        console.log('🔍 Provided email:', email.toLowerCase())

        if (isValid) {
          console.log('✅ Valid session, creating user...')
          
          // Create auth user
          const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email: email.toLowerCase(),
            email_confirm: false,
            user_metadata: { full_name: userName, source: 'checkout' }
          })

          if (createError) {
            console.log('⚠️ Create user error:', createError.message)
            // If already exists, try to find them
            if (createError.message?.includes('already') || createError.message?.includes('exists')) {
              const { data: retry } = await adminClient.auth.admin.getUserByEmail(email.toLowerCase())
              if (retry?.user) {
                userId = retry.user.id
                console.log('✅ Found user on retry:', userId)
              }
            }
          } else if (newUser?.user) {
            userId = newUser.user.id
            console.log('✅ Created new user:', userId)

            // Create profile
            const { error: profileError } = await supabase.from('users').insert({
              id: userId,
              email: email.toLowerCase(),
              full_name: userName,
              rep_id: `REP-${Date.now().toString().slice(-6)}`,
              role: 'rep',
              virtual_earnings: 0,
              checkout_session_id: sessionId,
            })
            
            if (profileError && profileError.code !== '23505') {
              console.log('⚠️ Profile creation error:', profileError.message)
            } else {
              console.log('✅ Profile created')
            }
          }
        }
      } catch (stripeError: any) {
        console.log('❌ Stripe error:', stripeError.message)
      }
    }

    // STEP 3: If still no user, try to find by Stripe customer email
    if (!userId && stripeKey) {
      console.log('👤 Step 3: Checking Stripe for customer...')
      
      const stripe = new Stripe(stripeKey, { apiVersion: '2025-09-30.clover' })
      
      try {
        const customers = await stripe.customers.list({ email: email.toLowerCase(), limit: 1 })
        
        if (customers.data.length > 0) {
          const customer = customers.data[0]
          console.log('✅ Found Stripe customer:', customer.id)
          
          // Create user from customer
          const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email: email.toLowerCase(),
            email_confirm: false,
            user_metadata: { full_name: customer.name || email.split('@')[0], source: 'stripe_customer' }
          })

          if (createError) {
            if (createError.message?.includes('already') || createError.message?.includes('exists')) {
              const { data: retry } = await adminClient.auth.admin.getUserByEmail(email.toLowerCase())
              if (retry?.user) {
                userId = retry.user.id
                console.log('✅ Found user on retry:', userId)
              }
            }
          } else if (newUser?.user) {
            userId = newUser.user.id
            console.log('✅ Created user from Stripe customer:', userId)

            await supabase.from('users').insert({
              id: userId,
              email: email.toLowerCase(),
              full_name: customer.name || email.split('@')[0],
              rep_id: `REP-${Date.now().toString().slice(-6)}`,
              role: 'rep',
              virtual_earnings: 0,
              stripe_customer_id: customer.id,
            })
          }
        } else {
          console.log('❌ No Stripe customer found with email:', email.toLowerCase())
        }
      } catch (stripeError: any) {
        console.log('❌ Stripe customer lookup error:', stripeError.message)
      }
    }

    // Final check
    if (!userId) {
      console.log('❌ FAILED: Could not find or create user')
      return NextResponse.json(
        { error: 'No account found. Please ensure you completed checkout with this email address.' },
        { status: 404 }
      )
    }

    // STEP 4: Set password
    console.log('🔐 Step 4: Setting password for user:', userId)
    
    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    })

    if (updateError) {
      console.log('❌ Password update error:', updateError.message)
      return NextResponse.json({ error: 'Failed to set password: ' + updateError.message }, { status: 500 })
    }

    // Update profile
    await supabase.from('users').update({
      account_setup_completed_at: new Date().toISOString(),
    }).eq('id', userId)

    console.log('✅ SUCCESS: Password set for', email)
    return NextResponse.json({ success: true, message: 'Password set successfully' })

  } catch (error: any) {
    console.error('❌ FATAL ERROR:', error)
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 })
  }
}
