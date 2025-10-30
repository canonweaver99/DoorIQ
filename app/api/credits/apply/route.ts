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

    const { sessionId, credits } = await request.json()
    
    if (!sessionId || !credits) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const stripe = getStripeClient()
    if (!stripe) {
      return NextResponse.json({ error: 'Payment processing unavailable' }, { status: 503 })
    }

    // Verify the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    if (session.metadata?.supabase_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (session.metadata?.purchase_type !== 'credits') {
      return NextResponse.json({ error: 'Invalid purchase type' }, { status: 400 })
    }

    // Apply credits to user account
    const { data, error } = await supabase.rpc('purchase_extra_credits', {
      p_user_id: user.id,
      p_credits: parseInt(credits)
    })

    if (error) {
      console.error('Error applying credits:', error)
      return NextResponse.json({ error: 'Failed to apply credits' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      creditsApplied: data,
      message: `Successfully added ${credits} credits to your account`
    })
  } catch (error: any) {
    console.error('Credit application error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to apply credits' },
      { status: 500 }
    )
  }
}

