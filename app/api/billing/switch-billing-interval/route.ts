
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is manager/admin
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!userData || (userData.role !== 'manager' && userData.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only managers can change billing interval' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { billingInterval } = body

    if (!billingInterval || !['monthly', 'annual'].includes(billingInterval)) {
      return NextResponse.json(
        { error: 'Invalid billing interval. Must be "monthly" or "annual"' },
        { status: 400 }
      )
    }

    // Get organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', userData.organization_id)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    if (org.billing_interval === billingInterval) {
      return NextResponse.json(
        { error: `Already on ${billingInterval} billing` },
        { status: 400 }
      )
    }

    if (!org.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    if (!org.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 400 }
      )
    }

    // Get current subscription from Stripe
    const stripe = getStripeClient()
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }
    const subscription = await stripe.subscriptions.retrieve(
      org.stripe_subscription_id,
      { expand: ['items.data.price'] }
    )

    if (!subscription || subscription.status !== 'active' && subscription.status !== 'trialing') {
      return NextResponse.json(
        { error: 'Subscription is not active' },
        { status: 400 }
      )
    }

    const subscriptionItem = subscription.items.data[0]
    if (!subscriptionItem) {
      return NextResponse.json(
        { error: 'No subscription items found' },
        { status: 400 }
      )
    }

    const currentPrice = subscriptionItem.price
    const currentQuantity = subscriptionItem.quantity || org.seat_limit || 1
    const productId = typeof currentPrice.product === 'string' ? currentPrice.product : currentPrice.product?.id

    if (!productId) {
      return NextResponse.json(
        { error: 'Could not determine product ID from current subscription' },
        { status: 400 }
      )
    }

    // If switching to annual, find the annual price ID for the same product
    if (billingInterval === 'annual') {
      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

      // Find annual price ID for the same product
      let annualPriceId: string | null = null
      try {
        const prices = await stripe.prices.list({
          product: productId,
          active: true,
          limit: 100,
        })

        // Find annual price (interval === 'year')
        const annualPrice = prices.data.find(
          (p) => p.recurring?.interval === 'year' && p.type === 'recurring'
        )

        if (annualPrice) {
          annualPriceId = annualPrice.id
          console.log(`Found annual price ID: ${annualPriceId} for product ${productId}`)
        } else {
          // If no annual price exists, fall back to monthly price with discount
          console.warn(`No annual price found for product ${productId}, using monthly price with discount`)
          annualPriceId = currentPrice.id
        }
      } catch (error) {
        console.error('Error finding annual price:', error)
        return NextResponse.json(
          { error: 'Failed to find annual pricing. Please contact support.' },
          { status: 500 }
        )
      }

      if (!annualPriceId) {
        return NextResponse.json(
          { error: 'Annual pricing not available for this plan. Please contact support.' },
          { status: 400 }
        )
      }

      // Create discount coupon for annual billing (16.67% = 2 months free) if using monthly price
      // Note: If annualPriceId is different from currentPrice.id, we're using a true annual price
      // and may not need the discount, but we'll still apply it for consistency
      let discountId: string | undefined
      if (annualPriceId === currentPrice.id) {
        // Only apply discount if we're using the monthly price
        try {
          const coupons = await stripe.coupons.list({ limit: 100 })
          const existingCoupon = coupons.data.find(
            (c) => c.percent_off === 16.67 && c.name === 'Annual Billing - 2 Months Free'
          )

          if (existingCoupon) {
            discountId = existingCoupon.id
          } else {
            const coupon = await stripe.coupons.create({
              name: 'Annual Billing - 2 Months Free',
              percent_off: 16.67,
              duration: 'forever',
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

      // Create checkout session to update subscription to annual billing
      const session = await stripe.checkout.sessions.create({
        customer: org.stripe_customer_id,
        mode: 'subscription',
        line_items: [
          {
            price: annualPriceId, // Use annual price ID
            quantity: currentQuantity,
          },
        ],
        discounts: discountId ? [{ coupon: discountId }] : undefined,
        subscription_data: {
          metadata: {
            action: 'switch_billing_interval',
            organization_id: org.id,
            current_subscription_id: org.stripe_subscription_id,
            billing_interval: 'annual',
            plan_type: org.plan_tier || 'starter',
            supabase_user_id: user.id,
          },
        },
        metadata: {
          action: 'switch_billing_interval',
          organization_id: org.id,
          current_subscription_id: org.stripe_subscription_id,
          billing_interval: 'annual',
          plan_type: org.plan_tier || 'starter',
          supabase_user_id: user.id,
        },
        success_url: `${origin}/settings/billing?billing_interval=annual&success=true`,
        cancel_url: `${origin}/settings/billing?billing_interval=canceled`,
        allow_promotion_codes: true,
      })

      return NextResponse.json({
        success: true,
        url: session.url,
        sessionId: session.id,
        message: 'Redirecting to checkout to switch to annual billing',
      })
    }

    // If switching to monthly, we can update directly via subscription API
    // For now, return an error suggesting to use Stripe portal
    return NextResponse.json(
      { error: 'Switching to monthly billing is not yet supported via checkout. Please use the Manage Subscription button.' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error switching billing interval:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

