import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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
      discountCode, // Optional discount code
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
      starter: { min: 1, max: 1 }, // Individual plan: 1 seat only
      team: { min: 2, max: 100 }, // Team plan: 2-100 reps
      enterprise: { min: 101, max: 500 }, // Enterprise plan: 101+ reps
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
    // Individual plan (starter): $49 flat for 1 seat
    // Team plan: $39 per rep/month for 2-100 reps
    // Enterprise plan: $29 per rep/month for 101+ reps
    const basePrices = {
      starter: 49, // Flat rate for 1 seat
      team: 39, // Per rep
      enterprise: 29, // Per rep
    }

    const pricePerRep = basePrices[plan as keyof typeof basePrices]

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

    // Verify the price is active in Stripe
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

    // Validate and apply discount code if provided
    let discountCouponId: string | undefined
    let isFullDiscount = false // Track if this is a 100% discount
    if (discountCode) {
      try {
        const supabase = await createServerSupabaseClient()
        
        // Validate discount code
        const { data: discountData, error: discountError } = await supabase
          .from('discount_codes')
          .select('*')
          .eq('code', discountCode.trim().toUpperCase())
          .eq('is_active', true)
          .single()

        if (!discountError && discountData) {
          // Check if code has expired
          if (!discountData.expires_at || new Date(discountData.expires_at) > new Date()) {
            // Check if code has reached max uses
            if (!discountData.max_uses || discountData.uses_count < discountData.max_uses) {
              // Check if this is a 100% discount
              if (discountData.discount_type === 'percentage' && Number(discountData.discount_value) >= 100) {
                isFullDiscount = true
              }

              // Create Stripe coupon from discount code
              const couponName = `Discount: ${discountData.code}`
              const couponConfig: Stripe.CouponCreateParams = {
                name: couponName,
                duration: 'once', // Single use per checkout
                metadata: {
                  discount_code_id: discountData.id,
                  discount_code: discountData.code,
                },
              }

              if (discountData.discount_type === 'percentage') {
                couponConfig.percent_off = Number(discountData.discount_value)
              } else {
                // For fixed amount, we need to calculate the amount off
                // Note: Stripe coupons work on the total, so we'll apply it
                couponConfig.amount_off = Math.round(Number(discountData.discount_value) * 100) // Convert to cents
                couponConfig.currency = 'usd'
              }

              const coupon = await stripe.coupons.create(couponConfig)
              discountCouponId = coupon.id

              // Increment uses_count (we'll verify it was used in webhook)
              await supabase
                .from('discount_codes')
                .update({ uses_count: discountData.uses_count + 1 })
                .eq('id', discountData.id)
            }
          }
        }
      } catch (error) {
        console.error('Error applying discount code:', error)
        // Continue without discount code if there's an error
      }
    }

    // Build discounts array (annual discount + discount code if applicable)
    const discounts: Array<{ coupon: string }> = []
    if (annualDiscountId) {
      discounts.push({ coupon: annualDiscountId })
    }
    if (discountCouponId) {
      discounts.push({ coupon: discountCouponId })
    }

    // Create checkout session
    // Only apply 7-day free trial for individual plans (1 rep)
    // Plans with 2+ reps require immediate payment
    // IMPORTANT: Don't set trial_period_days if a 100% discount is applied
    // Stripe doesn't allow trial periods with 100% discounts
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
        // Only set trial period if:
        // 1. It's a 1-rep plan (individual)
        // 2. AND there's no 100% discount applied
        ...(repCount === 1 && !isFullDiscount ? { trial_period_days: 7 } : {}),
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
      success_url: `${origin}/onboarding?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(workEmail)}`,
      cancel_url: `${origin}/checkout?plan=${plan}&billing=${billingPeriod}&canceled=true`,
      // Don't include customer_email when customer is already set
    }

    // Add discounts if any, otherwise allow promotion codes
    // Stripe doesn't allow both allow_promotion_codes and discounts at the same time
    if (discounts.length > 0) {
      sessionConfig.discounts = discounts
    } else {
      sessionConfig.allow_promotion_codes = true
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

