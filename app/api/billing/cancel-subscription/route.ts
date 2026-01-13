
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

    if (!userData || ((userData as any).role !== 'manager' && (userData as any).role !== 'admin')) {
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
      .eq('id', (userData as any).organization_id)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const orgData = org as any
    
    if (!orgData.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    // Get subscription details to check if it's a trial
    const stripe = getStripeClient()
    let isTrial = false
    let subscriptionStatus = 'active'
    
    if (stripe && orgData.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(orgData.stripe_subscription_id)
        isTrial = subscription.status === 'trialing'
        subscriptionStatus = subscription.status
        
        if (cancelImmediately) {
          // Cancel immediately - end subscription right away
          await stripe.subscriptions.cancel(orgData.stripe_subscription_id)
        } else {
          // Cancel at period end - keep access until period/trial ends
          await stripe.subscriptions.update(orgData.stripe_subscription_id, {
            cancel_at_period_end: true,
          })
        }
      } catch (stripeError: any) {
        console.error('Error canceling Stripe subscription:', stripeError)
        // If subscription doesn't exist in Stripe, still update our database
        if (stripeError.code !== 'resource_missing') {
          throw stripeError
        }
      }
    }

    // Update organization subscription status
    const orgUpdate: any = {
      stripe_subscription_id: cancelImmediately ? null : orgData.stripe_subscription_id,
    }
    // @ts-ignore - Supabase type inference issue
    await supabase
      .from('organizations')
      .update(orgUpdate)
      .eq('id', orgData.id)

    // Update all users in organization
    const userUpdate: any = {
      subscription_status: cancelImmediately ? 'canceled' : (isTrial ? 'trialing' : 'active'),
    }
    // @ts-ignore - Supabase type inference issue
    await supabase
      .from('users')
      .update(userUpdate)
      .eq('organization_id', orgData.id)

    // Generate appropriate success message
    let message: string
    if (isTrial) {
      message = cancelImmediately
        ? 'Free trial canceled. No charges were made.'
        : 'Free trial will cancel at the end of the trial period. No charges will be made.'
    } else {
      message = cancelImmediately
        ? 'Subscription canceled immediately'
        : 'Subscription will cancel at the end of the billing period'
    }

    return NextResponse.json({
      success: true,
      canceledImmediately: cancelImmediately,
      isTrial,
      message,
    })
  } catch (error: any) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

