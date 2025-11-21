import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Stripe client setup
function getStripeClient() {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return null
    }
    const stripe = require('stripe')(stripeKey)
    return stripe
  } catch (error) {
    console.error('Error initializing Stripe:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Stripe customer ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const customerId = userData.stripe_customer_id

    if (!customerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please complete a purchase first.' },
        { status: 400 }
      )
    }

    const stripe = getStripeClient()
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment processing unavailable. Please contact support.' },
        { status: 503 }
      )
    }

    // Get the origin for the return URL
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/billing`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error('Error creating portal session:', error)
    
    // Handle Stripe-specific errors
    if (error.type === 'StripeInvalidRequestError') {
      if (error.message?.includes('billing portal')) {
        return NextResponse.json(
          { 
            error: 'Billing portal is not configured. Please contact support or configure it in Stripe Dashboard.',
            details: error.message
          },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
}

