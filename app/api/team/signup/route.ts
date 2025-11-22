import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { STRIPE_CONFIG } from '@/lib/stripe/config'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
})

/**
 * POST /api/team/signup
 * Create Stripe Checkout Session for team plan signup
 * Accepts: organizationName, seatCount, userEmail, userName
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationName, seatCount, userEmail, userName } = body

    // Validation
    if (!organizationName || typeof organizationName !== 'string' || organizationName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      )
    }

    if (!seatCount || typeof seatCount !== 'number' || seatCount < 1 || seatCount > 100) {
      return NextResponse.json(
        { error: 'Seat count must be between 1 and 100' },
        { status: 400 }
      )
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, full_name, stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Use provided email or user's email
    const email = userEmail || userProfile.email || user.email || ''
    const name = userName || userProfile.full_name || ''

    // Get or create Stripe customer
    let customerId = userProfile.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email,
        name: name,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Update user with customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Get the origin for return URL
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create checkout session with quantity-based pricing
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: STRIPE_CONFIG.team.perSeatPriceId,
          quantity: seatCount,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          plan_type: 'team',
          organization_name: organizationName.trim(),
          seat_count: seatCount.toString(),
          supabase_user_id: user.id,
        },
      },
      metadata: {
        plan_type: 'team',
        organization_name: organizationName.trim(),
        seat_count: seatCount.toString(),
        supabase_user_id: user.id,
      },
      success_url: `${origin}/team?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/team/signup?canceled=true`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    })
  } catch (error: any) {
    console.error('Error creating team signup session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

