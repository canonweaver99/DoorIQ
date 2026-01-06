import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Lazy initialize Stripe to avoid build-time errors
function getStripeClient() {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return null
  }
  return new Stripe(stripeKey, {
    apiVersion: '2025-09-30.clover',
  })
}

/**
 * POST /api/checkout/create-session
 * Create Stripe Checkout Session for guest checkout (no auth required)
 * Accepts: companyName, yourName, workEmail, phone, numberOfReps, plan, billingPeriod
 */
export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient()
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment processing unavailable. Please contact support.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const {
      companyName,
      yourName,
      workEmail,
      phone,
      numberOfReps,
      plan, // 'starter' | 'team' | 'enterprise'
      billingPeriod, // 'monthly' | 'annual'
    } = body

    // Validation
    if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    if (!yourName || typeof yourName !== 'string' || yourName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Your name is required' },
        { status: 400 }
      )
    }

    if (!workEmail || typeof workEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail)) {
      return NextResponse.json(
        { error: 'Valid work email is required' },
        { status: 400 }
      )
    }

    const repCount = parseInt(numberOfReps) || 0
    if (repCount < 1 || repCount > 500) {
      return NextResponse.json(
        { error: 'Number of reps must be between 1 and 500' },
        { status: 400 }
      )
    }

    // Validate plan and rep count match
    const planLimits = {
      starter: { min: 1, max: 20 },
      team: { min: 21, max: 100 },
      enterprise: { min: 101, max: 500 },
    }

    const planLimit = planLimits[plan as keyof typeof planLimits]
    if (!planLimit) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      )
    }

    if (repCount < planLimit.min || repCount > planLimit.max) {
      return NextResponse.json(
        { error: `Number of reps must be between ${planLimit.min} and ${planLimit.max} for ${plan} plan` },
        { status: 400 }
      )
    }

    // Calculate pricing
    const basePrices = {
      starter: 49,
      team: 39,
      enterprise: 29,
    }

    const pricePerRep = basePrices[plan as keyof typeof basePrices]
    // No volume discount needed - Enterprise pricing already reflects 101+ reps at $29/rep

    // Get origin for success/cancel URLs
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Import STRIPE_CONFIG to get price IDs
    const { STRIPE_CONFIG } = await import('@/lib/stripe/config')
    
    // Get price ID - using tiered monthly pricing for all plans
    // Stripe tiered pricing will handle the different rates based on quantity
    const planConfig = STRIPE_CONFIG[plan as keyof typeof STRIPE_CONFIG]
    if (!planConfig) {
      return NextResponse.json(
        { error: `Price ID not configured for ${plan} plan. Please update STRIPE_CONFIG.` },
        { status: 400 }
      )
    }

    // Use the tiered monthly price ID
    const priceId = planConfig.priceId || planConfig.perSeatPriceId
    
    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID not found for ${plan} plan. Please configure in STRIPE_CONFIG.` },
        { status: 400 }
      )
    }

    // Create or retrieve Stripe customer
    let customerId: string
    try {
      // Try to find existing customer by email
      const customers = await stripe.customers.list({
        email: workEmail,
        limit: 1,
      })
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: workEmail,
          name: yourName,
          phone: phone || undefined,
          metadata: {
            company_name: companyName,
            source: 'checkout_page',
          },
        })
        customerId = customer.id
      }
    } catch (error) {
      console.error('Error creating/retrieving customer:', error)
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      )
    }

    // Create annual discount coupon if needed (20% off)
    let annualDiscountId: string | undefined
    if (billingPeriod === 'annual') {
      try {
        // Try to find existing annual discount coupon (20% off)
        const coupons = await stripe.coupons.list({ limit: 100 })
        const existingCoupon = coupons.data.find(
          c => c.percent_off === 20 && c.name === 'Annual Billing - 20% Off'
        )
        
        if (existingCoupon) {
          annualDiscountId = existingCoupon.id
        } else {
          // Create new coupon for annual billing (20% off)
          const coupon = await stripe.coupons.create({
            name: 'Annual Billing - 20% Off',
            percent_off: 20,
            duration: 'forever',
            metadata: {
              type: 'annual_billing',
              description: '20% discount for annual billing',
            },
          })
          annualDiscountId = coupon.id
        }
      } catch (error) {
        console.error('Error creating annual discount coupon:', error)
        // Continue without discount if coupon creation fails
      }
    }

    // Build discounts array (only annual discount, no volume discount needed)
    const discounts: Array<{ coupon: string }> = []
    if (annualDiscountId) {
      discounts.push({ coupon: annualDiscountId })
    }

    // Create checkout session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: repCount,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          plan_type: plan,
          billing_period: billingPeriod,
          organization_name: companyName.trim(),
          seat_count: repCount.toString(),
          user_name: yourName.trim(),
          user_email: workEmail.trim(),
          source: 'checkout_page',
        },
      },
      metadata: {
        plan_type: plan,
        billing_period: billingPeriod,
        organization_name: companyName.trim(),
        seat_count: repCount.toString(),
        user_name: yourName.trim(),
        user_email: workEmail.trim(),
        source: 'checkout_page',
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?plan=${plan}&billing=${billingPeriod}&canceled=true`,
      allow_promotion_codes: true,
      customer_email: workEmail,
    }

    // Add discounts if any
    if (discounts.length > 0) {
      sessionConfig.discounts = discounts
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

