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

    const { cancelImmediately } = await request.json()

    // Get user's subscription info
    const { data: profile } = await supabase
      .from('users')
      .select('stripe_customer_id, subscription_id')
      .eq('id', user.id)
      .single()

    if (!profile?.subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    if (cancelImmediately) {
      // Cancel immediately
      await stripe.subscriptions.cancel(profile.subscription_id)

      // Update user in database
      await supabase
        .from('users')
        .update({
          subscription_status: 'canceled',
          subscription_id: null,
          subscription_plan: null
        })
        .eq('id', user.id)

      return NextResponse.json({
        success: true,
        message: 'Subscription canceled immediately'
      })
    } else {
      // Cancel at period end
      const subscription = await stripe.subscriptions.update(profile.subscription_id, {
        cancel_at_period_end: true
      })

      return NextResponse.json({
        success: true,
        message: 'Subscription will be canceled at the end of the billing period',
        cancelAt: subscription.current_period_end
      })
    }
  } catch (error: any) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

