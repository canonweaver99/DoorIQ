import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Lazy initialize Stripe
function getStripeClient() {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return null
  }
  return new Stripe(stripeKey, {
    apiVersion: '2025-09-30.clover',
  })
}

// Create Supabase Admin client for auth operations
function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration')
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, sessionId } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const supabase = await createServiceSupabaseClient()
    const adminClient = getSupabaseAdminClient()

    // Find the user by email using admin client
    let existingUser = null
    try {
      const { data: userData, error: getUserError } = await adminClient.auth.admin.getUserByEmail(email.toLowerCase())
      if (!getUserError && userData?.user) {
        existingUser = userData.user
        console.log('✅ Found existing user:', existingUser.id)
      }
    } catch (error) {
      console.log('User not found by email, will check Stripe session')
    }

    // If user doesn't exist, check if checkout session is completed and create user
    if (!existingUser && sessionId) {
      console.log('User not found, checking Stripe session:', sessionId)
      
      const stripe = getStripeClient()
      if (stripe) {
        try {
          // Retrieve the checkout session
          const session = await stripe.checkout.sessions.retrieve(sessionId)
          
          // Verify session is completed and email matches
          if (session.status === 'complete' && session.customer_email?.toLowerCase() === email.toLowerCase()) {
            console.log('✅ Checkout session verified, creating user account')
            
            // Get metadata from session
            const metadata = session.metadata || {}
            const userName = metadata.user_name || email.split('@')[0]
            
            // Create auth user using admin client
            const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
              email: email.toLowerCase(),
              email_confirm: false,
              user_metadata: {
                full_name: userName,
                source: 'stripe_checkout',
              },
            })

            if (authError) {
              console.error('❌ Error creating auth user:', authError)
              throw new Error(`Failed to create user: ${authError.message}`)
            } else if (authData?.user) {
              existingUser = authData.user
              console.log('✅ Created new auth user:', existingUser.id)

              // Generate rep ID
              const repId = `REP-${Date.now().toString().slice(-6)}`

              // Create user profile using service client (bypasses RLS)
              const { error: profileError } = await supabase
                .from('users')
                .insert({
                  id: existingUser.id,
                  email: email.toLowerCase(),
                  full_name: userName,
                  rep_id: repId,
                  role: 'rep',
                  virtual_earnings: 0,
                  checkout_session_id: sessionId,
                })

              if (profileError) {
                console.error('❌ Error creating user profile:', profileError)
                // Try to clean up auth user
                await adminClient.auth.admin.deleteUser(existingUser.id)
                throw new Error(`Failed to create user profile: ${profileError.message}`)
              }

              // Create session limits record
              const today = new Date().toISOString().split('T')[0]
              const { error: limitsError } = await supabase
                .from('user_session_limits')
                .insert({
                  user_id: existingUser.id,
                  sessions_this_month: 0,
                  sessions_limit: 75,
                  last_reset_date: today,
                })

              if (limitsError) {
                console.error('⚠️ Error creating session limits:', limitsError)
                // Don't fail - this is not critical
              }
            }
          } else {
            console.log('⚠️ Checkout session not completed or email mismatch')
          }
        } catch (stripeError: any) {
          console.error('Error checking Stripe session:', stripeError)
          // Continue - webhook might still be processing
        }
      }

      // Retry finding user (webhook might have created it)
      if (!existingUser) {
        console.log('Waiting for webhook to complete...')
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
        
        try {
          const { data: retryUserData, error: retryError } = await adminClient.auth.admin.getUserByEmail(email.toLowerCase())
          if (!retryError && retryUserData?.user) {
            existingUser = retryUserData.user
            console.log('✅ Found user after retry:', existingUser.id)
          }
        } catch (retryError) {
          console.log('User still not found after retry')
        }
      }
    }

    if (!existingUser) {
      return NextResponse.json(
        { error: 'No account found with this email. Please wait a moment and try again, or complete checkout first.' },
        { status: 404 }
      )
    }

    // Update the user's password using admin client
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      existingUser.id,
      {
        password,
        email_confirm: true, // Confirm email since they're setting up their account
      }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to set password. Please try again.' },
        { status: 500 }
      )
    }

    // Update user profile with setup info
    await supabase
      .from('users')
      .update({
        account_setup_completed_at: new Date().toISOString(),
        checkout_session_id: sessionId || null,
      })
      .eq('id', existingUser.id)

    console.log('✅ Password set successfully for:', email)

    return NextResponse.json({
      success: true,
      message: 'Password set successfully',
    })
  } catch (error: any) {
    console.error('Error in set-password:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

