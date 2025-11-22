import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!userData?.organization_id) {
      return NextResponse.json({
        plan: null,
        isOrganization: false,
        message: 'No organization found',
      })
    }

    // Get organization details
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

    // Get subscription details from Stripe if subscription exists
    let subscriptionDetails = null
    if (org.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          org.stripe_subscription_id,
          { expand: ['items.data.price'] }
        )
        
        subscriptionDetails = {
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          quantity: subscription.items.data[0]?.quantity || 0,
        }
      } catch (stripeError) {
        console.error('Error fetching Stripe subscription:', stripeError)
      }
    }

    // Calculate usage metrics
    const { count: activeRepsCount } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .eq('is_active', true)

    // Get sessions this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: sessionsCount } = await supabase
      .from('live_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())

    return NextResponse.json({
      plan: {
        tier: org.plan_tier,
        seatLimit: org.seat_limit,
        seatsUsed: org.seats_used,
        billingInterval: org.billing_interval || 'monthly',
        trialEndsAt: org.trial_ends_at,
      },
      subscription: subscriptionDetails,
      usage: {
        activeReps: activeRepsCount || 0,
        sessionsThisMonth: sessionsCount || 0,
      },
      isManager: userData.role === 'manager' || userData.role === 'admin',
    })
  } catch (error: any) {
    console.error('Error fetching current plan:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

