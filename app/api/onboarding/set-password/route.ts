export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Helper function to call Supabase Admin API directly
async function supabaseAdminFetch(supabaseUrl: string, serviceRoleKey: string, endpoint: string, options: RequestInit = {}) {
  const url = `${supabaseUrl}/auth/v1/admin${endpoint}`
  console.log('📡 Calling:', options.method || 'GET', url)
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
    
    // Get user name from Stripe session if available
    let userName = email.split('@')[0]
    if (sessionId && stripeKey) {
      try {
        const stripe = new Stripe(stripeKey, { apiVersion: '2025-09-30.clover' })
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        if (session.metadata?.user_name) {
          userName = session.metadata.user_name
        }
        console.log('📋 Got user name from Stripe:', userName)
      } catch (e) {
        console.log('⚠️ Could not get name from Stripe session')
      }
    }
    
    // STEP 1: Try to find existing user
    console.log('👤 Step 1: Looking for existing user...')
    let userId: string | null = null
    let userExists = false
    
    try {
      const listResponse = await supabaseAdminFetch(supabaseUrl, serviceRoleKey, `/users?email=${encodeURIComponent(email.toLowerCase())}`)
      const listText = await listResponse.text()
      console.log('📋 Users lookup response:', listResponse.status, listText.substring(0, 200))
      
      if (listResponse.ok) {
        const usersData = JSON.parse(listText)
        if (usersData?.users?.length > 0) {
          userId = usersData.users[0].id
          userExists = true
          console.log('✅ Found existing user:', userId)
        }
      }
    } catch (lookupError: any) {
      console.log('❌ User lookup error:', lookupError.message)
    }

    // STEP 2: If user exists, update their password
    if (userId && userExists) {
      console.log('🔐 Step 2a: Updating existing user password...')
      
      const updateResponse = await supabaseAdminFetch(supabaseUrl, serviceRoleKey, `/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          password: password,
          email_confirm: true,
        })
      })
      
      const updateText = await updateResponse.text()
      console.log('📋 Password update response:', updateResponse.status, updateText.substring(0, 200))

      if (!updateResponse.ok) {
        console.log('❌ Password update failed, trying to delete and recreate...')
        
        // Try deleting and recreating the user with the password
        await supabaseAdminFetch(supabaseUrl, serviceRoleKey, `/users/${userId}`, { method: 'DELETE' })
        
        // Create new user with password
        const createWithPwResponse = await supabaseAdminFetch(supabaseUrl, serviceRoleKey, '/users', {
          method: 'POST',
          body: JSON.stringify({
            email: email.toLowerCase(),
            password: password,
            email_confirm: true,
            user_metadata: { full_name: userName, source: 'checkout_recreate' }
          })
        })
        
        const createPwText = await createWithPwResponse.text()
        console.log('📋 Recreate with password response:', createWithPwResponse.status, createPwText.substring(0, 200))
        
        if (createWithPwResponse.ok) {
          const newUser = JSON.parse(createPwText)
          userId = newUser.id
          console.log('✅ Recreated user with password:', userId)
          
          // Update profile with new user ID
          await supabase.from('users').upsert({
            id: userId,
            email: email.toLowerCase(),
            full_name: userName,
            rep_id: `REP-${Date.now().toString().slice(-6)}`,
            role: 'rep',
            virtual_earnings: 0,
            account_setup_completed_at: new Date().toISOString(),
          } as any)
        } else {
          return NextResponse.json({ error: 'Failed to set password: ' + createPwText }, { status: 500 })
        }
      } else {
        console.log('✅ Password updated successfully')
      }
    } 
    // STEP 2b: If no user exists, create one with password
    else {
      console.log('🔐 Step 2b: Creating new user with password...')
      
      // Verify they have a valid Stripe session or customer
      let isValidCheckout = false
      if (stripeKey) {
        const stripe = new Stripe(stripeKey, { apiVersion: '2025-09-30.clover' })
        
        // Check session
        if (sessionId) {
          try {
            const session = await stripe.checkout.sessions.retrieve(sessionId)
            isValidCheckout = session.status === 'complete' || 
                             session.payment_status === 'paid' || 
                             session.payment_status === 'no_payment_required' ||
                             !!session.customer
            console.log('📋 Stripe session valid:', isValidCheckout)
          } catch (e) {
            console.log('⚠️ Could not verify session')
          }
        }
        
        // Check customer
        if (!isValidCheckout) {
          try {
            const customers = await stripe.customers.list({ email: email.toLowerCase(), limit: 1 })
            isValidCheckout = customers.data.length > 0
            console.log('📋 Stripe customer exists:', isValidCheckout)
          } catch (e) {
            console.log('⚠️ Could not check customer')
          }
        }
      }
      
      if (!isValidCheckout) {
        console.log('❌ No valid checkout found for this email')
        return NextResponse.json(
          { error: 'No checkout found. Please complete checkout first.' },
          { status: 404 }
        )
      }
      
      // Create user WITH password directly
      const createResponse = await supabaseAdminFetch(supabaseUrl, serviceRoleKey, '/users', {
        method: 'POST',
        body: JSON.stringify({
          email: email.toLowerCase(),
          password: password,
          email_confirm: true,
          user_metadata: { full_name: userName, source: 'checkout' }
        })
      })

      const createText = await createResponse.text()
      console.log('📋 Create user response:', createResponse.status, createText.substring(0, 200))

      if (createResponse.ok) {
        const newUser = JSON.parse(createText)
        userId = newUser.id
        console.log('✅ Created new user with password:', userId)

        // Create profile
        const { error: profileError } = await supabase.from('users').insert({
          id: userId,
          email: email.toLowerCase(),
          full_name: userName,
          rep_id: `REP-${Date.now().toString().slice(-6)}`,
          role: 'rep',
          virtual_earnings: 0,
          checkout_session_id: sessionId,
          account_setup_completed_at: new Date().toISOString(),
        } as any)
        
        if (profileError && profileError.code !== '23505') {
          console.log('⚠️ Profile creation error:', profileError.message)
        }
      } else {
        // User might already exist - try to find and update
        if (createText.includes('already') || createText.includes('exists')) {
          console.log('⚠️ User already exists, retrying lookup...')
          const retryResponse = await supabaseAdminFetch(supabaseUrl, serviceRoleKey, `/users?email=${encodeURIComponent(email.toLowerCase())}`)
          if (retryResponse.ok) {
            const retryData = await retryResponse.json()
            if (retryData?.users?.length > 0) {
              userId = retryData.users[0].id
              
              // Update password
              const updateResponse = await supabaseAdminFetch(supabaseUrl, serviceRoleKey, `/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify({ password: password, email_confirm: true })
              })
              
              if (updateResponse.ok) {
                console.log('✅ Updated existing user password')
              } else {
                const updateErr = await updateResponse.text()
                console.log('❌ Failed to update password:', updateErr)
                return NextResponse.json({ error: 'Failed to set password' }, { status: 500 })
              }
            }
          }
        } else {
          return NextResponse.json({ error: 'Failed to create account: ' + createText }, { status: 500 })
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Failed to create or find user' }, { status: 500 })
    }

    // Update profile completion
    await (supabase.from('users') as any).update({
      account_setup_completed_at: new Date().toISOString(),
    }).eq('id', userId)

    console.log('✅ SUCCESS: Account ready for', email)
    return NextResponse.json({ success: true, message: 'Password set successfully' })

  } catch (error: any) {
    console.error('❌ FATAL ERROR:', error)
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 })
  }
}
