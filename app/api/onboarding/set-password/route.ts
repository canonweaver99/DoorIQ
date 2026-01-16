export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Helper function to call Supabase Admin API directly
async function supabaseAdminFetch(supabaseUrl: string, serviceRoleKey: string, endpoint: string, options: RequestInit = {}) {
  const url = `${supabaseUrl}/auth/v1/admin${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  return response
}

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
    
    // STEP 1: Try to find existing user via direct API call
    console.log('👤 Step 1: Looking for existing user...')
    let userId: string | null = null
    
    try {
      const listResponse = await supabaseAdminFetch(supabaseUrl, serviceRoleKey, `/users?email=${encodeURIComponent(email.toLowerCase())}`)
      
      if (listResponse.ok) {
        const usersData = await listResponse.json()
        console.log('📋 Users lookup result:', usersData?.users?.length || 0, 'users found')
        if (usersData?.users?.length > 0) {
          userId = usersData.users[0].id
          console.log('✅ Found existing user:', userId)
        }
      } else {
        const errorText = await listResponse.text()
        console.log('❌ Users lookup failed:', listResponse.status, errorText)
      }
    } catch (lookupError: any) {
      console.log('❌ User lookup error:', lookupError.message)
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

        const userName = session.metadata?.user_name || email.split('@')[0]
        
        const isValid = session.status === 'complete' || 
                       session.payment_status === 'paid' || 
                       session.payment_status === 'no_payment_required' ||
                       session.customer

        console.log('🔍 Session valid?', isValid)

        if (isValid) {
          console.log('✅ Valid session, creating user via API...')
          
          // Create user via direct API call
          const createResponse = await supabaseAdminFetch(supabaseUrl, serviceRoleKey, '/users', {
            method: 'POST',
            body: JSON.stringify({
              email: email.toLowerCase(),
              email_confirm: false,
              user_metadata: { full_name: userName, source: 'checkout' }
            })
          })

          if (createResponse.ok) {
            const newUserData = await createResponse.json()
            userId = newUserData.id
            console.log('✅ Created new user:', userId)

            // Create profile in database
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
          } else {
            const errorText = await createResponse.text()
            console.log('⚠️ Create user response:', createResponse.status, errorText)
            
            // If already exists, try to find them again
            if (errorText.includes('already') || errorText.includes('exists') || createResponse.status === 422) {
              const retryResponse = await supabaseAdminFetch(supabaseUrl, serviceRoleKey, `/users?email=${encodeURIComponent(email.toLowerCase())}`)
              if (retryResponse.ok) {
                const retryData = await retryResponse.json()
                if (retryData?.users?.length > 0) {
                  userId = retryData.users[0].id
                  console.log('✅ Found user on retry:', userId)
                }
              }
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
          
          // Create user via direct API call
          const createResponse = await supabaseAdminFetch(supabaseUrl, serviceRoleKey, '/users', {
            method: 'POST',
            body: JSON.stringify({
              email: email.toLowerCase(),
              email_confirm: false,
              user_metadata: { full_name: customer.name || email.split('@')[0], source: 'stripe_customer' }
            })
          })

          if (createResponse.ok) {
            const newUserData = await createResponse.json()
            userId = newUserData.id
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
          } else {
            const errorText = await createResponse.text()
            if (errorText.includes('already') || errorText.includes('exists') || createResponse.status === 422) {
              const retryResponse = await supabaseAdminFetch(supabaseUrl, serviceRoleKey, `/users?email=${encodeURIComponent(email.toLowerCase())}`)
              if (retryResponse.ok) {
                const retryData = await retryResponse.json()
                if (retryData?.users?.length > 0) {
                  userId = retryData.users[0].id
                  console.log('✅ Found user on retry:', userId)
                }
              }
            }
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

    // STEP 4: Set password via direct API call
    console.log('🔐 Step 4: Setting password for user:', userId)
    
    const updateResponse = await supabaseAdminFetch(supabaseUrl, serviceRoleKey, `/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        password: password,
        email_confirm: true,
      })
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.log('❌ Password update error:', updateResponse.status, errorText)
      return NextResponse.json({ error: 'Failed to set password: ' + errorText }, { status: 500 })
    }

    console.log('✅ Password updated successfully')

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
