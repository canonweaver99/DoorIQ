import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
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

    // Find the user by email
    let { data: usersData } = await (supabase as any).auth.admin.listUsers()
    let existingUser = usersData?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    )

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
            
            // Create auth user
            const { data: authData, error: authError } = await (supabase as any).auth.admin.createUser({
              email: email.toLowerCase(),
              email_confirm: false,
              user_metadata: {
                full_name: userName,
                source: 'stripe_checkout',
              },
            })

            if (authError) {
              console.error('❌ Error creating auth user:', authError)
              // Continue to try finding user again (might have been created by webhook)
            } else if (authData?.user) {
              existingUser = authData.user
              console.log('✅ Created new auth user:', existingUser.id)

              // Generate rep ID
              const repId = `REP-${Date.now().toString().slice(-6)}`

              // Create user profile
              await supabase
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

              // Create session limits record
              const today = new Date().toISOString().split('T')[0]
              await supabase
                .from('user_session_limits')
                .insert({
                  user_id: existingUser.id,
                  sessions_this_month: 0,
                  sessions_limit: 75,
                  last_reset_date: today,
                })
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
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
        const { data: retryUsersData } = await (supabase as any).auth.admin.listUsers()
        existingUser = retryUsersData?.users?.find(
          (u: any) => u.email?.toLowerCase() === email.toLowerCase()
        )
      }
    }

    if (!existingUser) {
      return NextResponse.json(
        { error: 'No account found with this email. Please wait a moment and try again, or complete checkout first.' },
        { status: 404 }
      )
    }

    // Update the user's password
    const { error: updateError } = await (supabase as any).auth.admin.updateUserById(
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

