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

    const { planType, priceId } = await request.json()

    if (!planType) {
      return NextResponse.json({ error: 'Plan type required' }, { status: 400 })
    }

    // Get user's subscription info
    const { data: profile } = await supabase
      .from('users')
      .select('stripe_customer_id, subscription_id')
      .eq('id', user.id)
      .single()

    if (!profile?.subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    // Switch to free plan = cancel subscription
    if (planType === 'free') {
      const subscription = await stripe.subscriptions.update(profile.subscription_id, {
        cancel_at_period_end: true
      })

      // Update user in database
      await supabase
        .from('users')
        .update({
          subscription_status: 'canceled',
          subscription_plan: null
        })
        .eq('id', user.id)

      return NextResponse.json({
        success: true,
        message: 'Subscription will be canceled at the end of the billing period',
        subscriptionId: subscription.id
      })
    }

    // Switch between monthly/yearly plans
    if (priceId) {
      const subscription = await stripe.subscriptions.retrieve(profile.subscription_id)
      
      const updatedSubscription = await stripe.subscriptions.update(profile.subscription_id, {
        items: [{
          id: subscription.items.data[0].id,
          price: priceId,
        }],
        proration_behavior: 'create_prorations',
      })

      // Update user in database
      const planName = priceId.includes('yearly') ? 'individual' : 'individual'
      await supabase
        .from('users')
        .update({
          subscription_plan: planName,
          stripe_price_id: priceId
        })
        .eq('id', user.id)

      return NextResponse.json({
        success: true,
        subscriptionId: updatedSubscription.id,
        message: 'Plan updated successfully'
      })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error: any) {
    console.error('Switch plan error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to switch plan' },
      { status: 500 }
    )
  }
}

