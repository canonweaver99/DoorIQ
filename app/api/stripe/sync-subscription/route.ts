import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

function getStripeClient() {
  const secret = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secret) {
    console.error('❌ STRIPE_SECRET_KEY not found in environment')
    return null
  }
  return new Stripe(secret, {
    apiVersion: '2024-06-20'
  })
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const stripe = getStripeClient()
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Syncing subscription for session:', sessionId)

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (!session.subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Retrieve the subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

    console.log('📋 Retrieved subscription:', {
      id: subscription.id,
      status: subscription.status,
      trialEnd: subscription.trial_end
    })

    // Update user's subscription in database
    const updateData = {
      subscription_status: subscription.status,
      subscription_id: subscription.id,
      subscription_plan: subscription.items.data[0]?.price.id,
      stripe_price_id: subscription.items.data[0]?.price.id,
      stripe_customer_id: session.customer as string,
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      trial_start_date: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ Error updating subscription:', updateError)
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }

    console.log('✅ Subscription synced successfully for user:', user.id)

    return NextResponse.json({ 
      success: true,
      subscription: {
        status: subscription.status,
        trialEnd: subscription.trial_end,
        currentPeriodEnd: subscription.current_period_end
      }
    })
  } catch (error: any) {
    console.error('Sync subscription error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync subscription' },
      { status: 500 }
    )
  }
}

