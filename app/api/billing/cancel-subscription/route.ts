import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
})

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
        { error: 'Only managers can cancel subscriptions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { cancelImmediately = false } = body

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

    if (!org.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    // Cancel subscription in Stripe
    if (cancelImmediately) {
      await stripe.subscriptions.cancel(org.stripe_subscription_id)
    } else {
      // Cancel at period end
      await stripe.subscriptions.update(org.stripe_subscription_id, {
        cancel_at_period_end: true,
      })
    }

    // Update organization subscription status
    await supabase
      .from('organizations')
      .update({
        stripe_subscription_id: cancelImmediately ? null : org.stripe_subscription_id,
      })
      .eq('id', org.id)

    // Update all users in organization
    await supabase
      .from('users')
      .update({
        subscription_status: cancelImmediately ? 'canceled' : 'active',
      })
      .eq('organization_id', org.id)

    return NextResponse.json({
      success: true,
      canceledImmediately: cancelImmediately,
      message: cancelImmediately
        ? 'Subscription canceled immediately'
        : 'Subscription will cancel at the end of the billing period',
    })
  } catch (error: any) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

