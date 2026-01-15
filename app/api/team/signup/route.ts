
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { STRIPE_CONFIG } from '@/lib/stripe/config'

// Lazy initialize Stripe to avoid build-time errors
function getStripeClient() {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return null
  }
  return new Stripe(stripeKey, {
    apiVersion: '2024-11-20.acacia',
  })
}

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
    const { organizationName, seatCount, planType = 'team', billingPeriod = 'monthly', userEmail, userName, redirect } = body

    // Validation
    if (!organizationName || typeof organizationName !== 'string' || organizationName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      )
    }

    // Validate seat count based on plan type
    // Individual plan: exactly 1 seat
    // Team plan: 2-100 seats
    if (planType === 'starter') {
      if (!seatCount || typeof seatCount !== 'number' || seatCount !== 1) {
        return NextResponse.json(
          { error: 'Individual plan requires exactly 1 seat' },
          { status: 400 }
        )
      }
    } else {
      if (!seatCount || typeof seatCount !== 'number' || seatCount < 2 || seatCount > 100) {
        return NextResponse.json(
          { error: 'Team plan requires 2-100 seats' },
          { status: 400 }
        )
      }
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
    const stripe = getStripeClient()
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

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

    // Determine price ID based on plan type
    const priceId = planType === 'starter' 
      ? STRIPE_CONFIG.starter.perSeatPriceId 
      : STRIPE_CONFIG.team.perSeatPriceId

    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID not found for ${planType} plan. Please configure in STRIPE_CONFIG.` },
        { status: 400 }
      )
    }

    // Verify the price is active in Stripe
    const stripe = getStripeClient()
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    try {
      const price = await stripe.prices.retrieve(priceId)
      if (!price.active) {
        return NextResponse.json(
          { error: 'The price specified is inactive. This field only accepts active prices.' },
          { status: 400 }
        )
      }
    } catch (error: any) {
      console.error('Error verifying price:', error)
      // If price doesn't exist or other error, return helpful message
      if (error.code === 'resource_missing') {
        return NextResponse.json(
          { error: `Price ID ${priceId} not found in Stripe. Please verify STRIPE_CONFIG.` },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to verify price configuration. Please contact support.' },
        { status: 500 }
      )
    }

    // Calculate annual discount (2 months free = 16.67% discount)
    // For annual billing, we'll apply a discount coupon
    const isAnnual = billingPeriod === 'annual'
    const discountPercent = isAnnual ? 16.67 : 0 // 2 months free out of 12 = 16.67%

    // Create discount coupon for annual billing if needed
    let discountId: string | undefined
    if (isAnnual && discountPercent > 0) {
      try {
        // Try to find existing annual discount coupon
        const coupons = await stripe.coupons.list({ limit: 100 })
        const existingCoupon = coupons.data.find(
          c => c.percent_off === discountPercent && c.name === 'Annual Billing - 2 Months Free'
        )
        
        if (existingCoupon) {
          discountId = existingCoupon.id
        } else {
          // Create new coupon for annual billing
          const coupon = await stripe.coupons.create({
            name: 'Annual Billing - 2 Months Free',
            percent_off: discountPercent,
            duration: 'forever', // Can be reused
            metadata: {
              type: 'annual_billing',
              description: '2 months free with annual billing',
            },
          })
          discountId = coupon.id
        }
      } catch (error) {
        console.error('Error creating discount coupon:', error)
        // Continue without discount if coupon creation fails
      }
    }

    // Create checkout session with quantity-based pricing
    // Only apply 7-day free trial for individual plans (1 seat)
    // Plans with 2+ seats require immediate payment
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: seatCount,
        },
      ],
      subscription_data: {
        ...(seatCount === 1 ? { trial_period_days: 7 } : {}),
        metadata: {
          plan_type: planType,
          billing_period: billingPeriod,
          organization_name: organizationName.trim(),
          seat_count: seatCount.toString(),
          supabase_user_id: user.id,
        },
      },
      metadata: {
        plan_type: planType,
        billing_period: billingPeriod,
        organization_name: organizationName.trim(),
        seat_count: seatCount.toString(),
        supabase_user_id: user.id,
        redirect: redirect || '',
      },
      success_url: `${origin}/onboarding?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(user.email || '')}`,
      cancel_url: `${origin}/team/signup?plan=${planType}&canceled=true${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''}`,
      allow_promotion_codes: true,
    }

    // Add discount if annual billing
    if (discountId) {
      sessionConfig.discounts = [{ coupon: discountId }]
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

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

