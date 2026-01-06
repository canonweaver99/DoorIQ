
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

    // Type assertion for user data
    const userDataTyped = userData as {
      organization_id: string | null
      role: string | null
    } | null

    if (!userDataTyped || (userDataTyped.role !== 'manager' && userDataTyped.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only managers can upgrade plans' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { targetTier, billingInterval = 'monthly' } = body

    if (!targetTier || !['team', 'enterprise'].includes(targetTier)) {
      return NextResponse.json(
        { error: 'Invalid target tier. Must be "team" or "enterprise"' },
        { status: 400 }
      )
    }

    // Get organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', userDataTyped.organization_id!)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Type assertion for organization data
    const orgData = org as {
      id: string
      plan_tier: string | null
      seat_limit: number | null
      stripe_customer_id: string | null
    }

    // Check if upgrade is valid
    if (orgData.plan_tier === 'enterprise') {
      return NextResponse.json(
        { error: 'Already on Enterprise plan' },
        { status: 400 }
      )
    }

    if (orgData.plan_tier === 'team' && targetTier === 'starter') {
      return NextResponse.json(
        { error: 'Cannot downgrade to Starter plan. Use downgrade-plan endpoint.' },
        { status: 400 }
      )
    }

    // Check seat count requirements
    if (targetTier === 'team' && (orgData.seat_limit || 0) < 21) {
      return NextResponse.json(
        { error: 'Team plan requires at least 21 seats. Please add seats first.' },
        { status: 400 }
      )
    }

    if (targetTier === 'enterprise' && (orgData.seat_limit || 0) < 100) {
      return NextResponse.json(
        { error: 'Enterprise plan requires at least 100 seats. Please add seats first.' },
        { status: 400 }
      )
    }

    // Get Stripe customer
    if (!orgData.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 400 }
      )
    }

    // Get price ID for target tier
    const priceId = STRIPE_CONFIG[targetTier as 'team' | 'starter']?.perSeatPriceId
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not configured for target tier' },
        { status: 500 }
      )
    }

    // Create checkout session for upgrade
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const stripe = getStripeClient()
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }
    const session = await stripe.checkout.sessions.create({
      customer: orgData.stripe_customer_id,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: orgData.seat_limit || 1,
        },
      ],
      subscription_data: {
        metadata: {
          plan_type: targetTier,
          billing_period: billingInterval,
          organization_id: orgData.id,
          supabase_user_id: user.id,
          upgrade_from: orgData.plan_tier || 'starter',
        },
      },
      metadata: {
        plan_type: targetTier,
        billing_period: billingInterval,
        organization_id: orgData.id,
        upgrade_from: orgData.plan_tier || 'starter',
      },
      success_url: `${origin}/settings/billing?upgrade=success`,
      cancel_url: `${origin}/settings/billing?upgrade=canceled`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (error: any) {
    console.error('Error creating upgrade checkout:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

