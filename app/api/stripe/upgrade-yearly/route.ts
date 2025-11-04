import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

function getStripeClient() {
  const secret = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secret) {
    return null
  }
  return new Stripe(secret, {
    apiVersion: '2024-06-20'
  })
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient()
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Stripe customer ID and subscription ID
    const { data: profile } = await supabase
      .from('users')
      .select('stripe_customer_id, subscription_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id || !profile?.subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    // Get yearly price ID
    const yearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_YEARLY
    if (!yearlyPriceId) {
      return NextResponse.json({ error: 'Yearly plan not configured' }, { status: 500 })
    }

    // Retrieve current subscription
    const subscription = await stripe.subscriptions.retrieve(profile.subscription_id)

    // Update subscription to yearly plan
    const updatedSubscription = await stripe.subscriptions.update(profile.subscription_id, {
      items: [{
        id: subscription.items.data[0].id,
        price: yearlyPriceId,
      }],
      proration_behavior: 'create_prorations', // Prorate the difference
    })

    // Determine base URL from request origin
    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000'

    return NextResponse.json({
      success: true,
      subscriptionId: updatedSubscription.id,
      redirectUrl: `${origin}/billing?upgraded=true`
    })
  } catch (error: any) {
    console.error('Upgrade to yearly error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upgrade to yearly plan' },
      { status: 500 }
    )
  }
}

