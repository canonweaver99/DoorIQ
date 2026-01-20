
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { STRIPE_CONFIG } from '@/lib/stripe/config'
import { calculateSeatAdditionCost, getPricingTier } from '@/lib/billing/pricing'

// Lazy initialize Stripe to avoid build-time errors
function getStripeClient() {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return null
  }
  return new Stripe(stripeKey, {
    apiVersion: '2024-11-20.acacia',
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
        { error: 'Only managers can modify seats' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { seatsToAdd } = body

    if (!seatsToAdd || typeof seatsToAdd !== 'number' || seatsToAdd <= 0) {
      return NextResponse.json(
        { error: 'Invalid number of seats' },
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

    // FAKE PAYWALL: Allow adding seats even without Stripe subscription
    let currentQuantity = 0
    let subscriptionItem = null

    if (org.stripe_subscription_id && org.stripe_subscription_item_id) {
      const stripe = getStripeClient()
      if (!stripe) {
        // If Stripe is not configured, just use current seat_limit from database
        currentQuantity = org.seat_limit || 0
      } else {
        try {
          // Get current subscription
          const subscription = await stripe.subscriptions.retrieve(
            org.stripe_subscription_id
          )

        subscriptionItem = subscription.items.data.find(
          (item) => item.id === org.stripe_subscription_item_id
        )

          if (subscriptionItem) {
            currentQuantity = subscriptionItem.quantity || 0
          }
        } catch (stripeError) {
          // If Stripe fails, just use current seat_limit from database
          console.log('Stripe subscription check skipped (fake paywall mode)')
          currentQuantity = org.seat_limit || 0
        }
      }
    } else {
      // No Stripe subscription - use current seat_limit from database
      currentQuantity = org.seat_limit || 0
    }

    const newQuantity = currentQuantity + seatsToAdd

    // Calculate pricing based on new total seat count
    const pricingInfo = calculateSeatAdditionCost(currentQuantity, seatsToAdd)
    const newTier = pricingInfo.newTier

    // Check if we need to upgrade the plan tier
    if (pricingInfo.requiresTierUpgrade && org.plan_tier !== newTier) {
      return NextResponse.json(
        {
          error: `Adding ${seatsToAdd} seat${seatsToAdd !== 1 ? 's' : ''} would require upgrading from ${org.plan_tier} to ${newTier} plan. Please upgrade your plan first.`,
          requiresUpgrade: true,
          currentTier: org.plan_tier,
          requiredTier: newTier,
          currentSeats: currentQuantity,
          newSeats: newQuantity,
        },
        { status: 400 }
      )
    }

    // If no Stripe subscription exists, allow direct addition (for testing/trials)
    if (!org.stripe_subscription_id || !org.stripe_subscription_item_id) {
      // Update organization seat_limit and tier in database
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ 
          seat_limit: newQuantity,
          plan_tier: newTier, // Update tier if it changed
        })
        .eq('id', org.id)

      if (updateError) {
        console.error('Error updating organization:', updateError)
        throw updateError
      }

      return NextResponse.json({
        success: true,
        message: `${seatsToAdd} seat${seatsToAdd !== 1 ? 's' : ''} added successfully. No charge during trial period.`,
        seatsAdded: seatsToAdd,
        newQuantity,
        newTier,
      })
    }

    // Has active subscription - create checkout session
    const stripe = getStripeClient()
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    // Get the correct price ID for the new tier
    const planConfig = STRIPE_CONFIG[newTier as keyof typeof STRIPE_CONFIG]
    if (!planConfig) {
      return NextResponse.json(
        { error: `Price ID not configured for ${newTier} plan` },
        { status: 500 }
      )
    }

    const priceId = planConfig.perSeatPriceId || planConfig.priceId
    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID not found for ${newTier} plan` },
        { status: 500 }
      )
    }

    // Get subscription to check billing period
    let subscription: Stripe.Subscription
    try {
      subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id)
    } catch (error) {
      console.error('Error retrieving subscription:', error)
      return NextResponse.json(
        { error: 'Failed to retrieve subscription' },
        { status: 500 }
      )
    }

    // Check if we're on trial - if so, allow direct addition
    if (subscription.status === 'trialing') {
      // Update subscription quantity directly
      try {
        await stripe.subscriptionItems.update(org.stripe_subscription_item_id, {
          quantity: newQuantity,
        })
      } catch (stripeError) {
        console.error('Error updating subscription:', stripeError)
        // Continue to update database even if Stripe fails
      }

      // Update organization seat_limit and tier in database
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ 
          seat_limit: newQuantity,
          plan_tier: newTier,
        })
        .eq('id', org.id)

      if (updateError) {
        console.error('Error updating organization:', updateError)
        throw updateError
      }

      return NextResponse.json({
        success: true,
        message: `${seatsToAdd} seat${seatsToAdd !== 1 ? 's' : ''} added successfully. No charge during trial period.`,
        seatsAdded: seatsToAdd,
        newQuantity,
        newTier,
      })
    }

    // Not on trial - create checkout session for payment
    // Calculate prorated amount for the additional seats
    let proratedAmount = 0
    try {
      const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
        customer: org.stripe_customer_id!,
        subscription: org.stripe_subscription_id,
        subscription_items: [{
          id: org.stripe_subscription_item_id,
          quantity: newQuantity,
        }],
      })
      proratedAmount = upcomingInvoice.amount_due
    } catch (invoiceError: any) {
      // If we can't calculate prorated amount, estimate it
      console.warn('Could not retrieve upcoming invoice, estimating prorated amount:', invoiceError.message)
      
      // Get the price to calculate estimated cost
      const price = await stripe.prices.retrieve(priceId)
      const priceAmount = (price.unit_amount || 0) / 100 // Convert from cents to dollars
      
      // Estimate prorated cost
      const daysRemaining = Math.ceil(
        (subscription.current_period_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
      )
      const daysInPeriod = Math.ceil(
        (subscription.current_period_end - subscription.current_period_start) / (60 * 60 * 24)
      )
      const prorationRatio = daysRemaining / daysInPeriod
      
      // Calculate cost difference
      const currentPricing = calculateSeatAdditionCost(currentQuantity, 0)
      const additionalCost = pricingInfo.additionalMonthlyCost
      proratedAmount = Math.round(additionalCost * prorationRatio * 100) // Convert back to cents
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create checkout session for payment
    const session = await stripe.checkout.sessions.create({
      customer: org.stripe_customer_id!,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Add ${seatsToAdd} seat${seatsToAdd !== 1 ? 's' : ''} to ${newTier} plan`,
              description: `Prorated charge for ${seatsToAdd} additional seat${seatsToAdd !== 1 ? 's' : ''}. New total: ${newQuantity} seats at $${pricingInfo.newPricePerSeat}/seat/month.`,
            },
            unit_amount: proratedAmount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        action: 'add_seats',
        organization_id: org.id,
        seats_to_add: seatsToAdd.toString(),
        current_quantity: currentQuantity.toString(),
        new_quantity: newQuantity.toString(),
        current_tier: org.plan_tier || 'starter',
        new_tier: newTier,
        subscription_id: org.stripe_subscription_id,
        subscription_item_id: org.stripe_subscription_item_id,
        price_id: priceId,
        supabase_user_id: user.id,
      },
      success_url: `${origin}/settings/billing?seats_added=success`,
      cancel_url: `${origin}/settings/billing?seats_added=canceled`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    })

    // ARCHIVED: Original Stripe checkout code (bypassed for fake paywall)
    /*
    // Not on trial - proceed with checkout for immediate payment
    // Get the price ID for the current plan and billing interval
    const planConfig = STRIPE_CONFIG[org.plan_tier as keyof typeof STRIPE_CONFIG]
    if (!planConfig) {
      return NextResponse.json(
        { error: 'Invalid plan tier' },
        { status: 400 }
      )
    }

    const priceId = planConfig.perSeatPriceId

    // Calculate prorated amount for the additional seats
    // We'll create an upcoming invoice to see what the prorated cost would be
    let proratedAmount = 0
    try {
      const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
        customer: org.stripe_customer_id,
        subscription: org.stripe_subscription_id,
        subscription_items: [{
          id: subscriptionItem.id,
          quantity: newQuantity,
        }],
      })
      proratedAmount = upcomingInvoice.amount_due
    } catch (invoiceError) {
      // If we can't calculate prorated amount, estimate it
      // Get the price to calculate estimated cost
      const price = await stripe.prices.retrieve(priceId)
      const priceAmount = (price.unit_amount || 0) / 100 // Convert from cents to dollars
      
      // Estimate prorated cost (rough calculation)
      // This is a simplified estimate - Stripe will handle actual proration
      const daysRemaining = Math.ceil(
        (subscription.current_period_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
      )
      const daysInPeriod = Math.ceil(
        (subscription.current_period_end - subscription.current_period_start) / (60 * 60 * 24)
      )
      const prorationRatio = daysRemaining / daysInPeriod
      proratedAmount = Math.round(priceAmount * seatsToAdd * prorationRatio * 100) // Convert back to cents
    }
    
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create a checkout session for a one-time payment for the prorated amount
    // After payment succeeds, we'll update the subscription via webhook
    const session = await stripe.checkout.sessions.create({
      customer: org.stripe_customer_id,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Add ${seatsToAdd} seat${seatsToAdd !== 1 ? 's' : ''} to ${org.plan_tier} plan`,
              description: `Prorated charge for ${seatsToAdd} additional seat${seatsToAdd !== 1 ? 's' : ''}`,
            },
            unit_amount: proratedAmount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        action: 'add_seats',
        organization_id: org.id,
        seats_to_add: seatsToAdd.toString(),
        current_quantity: (subscriptionItem.quantity || 0).toString(),
        new_quantity: newQuantity.toString(),
        subscription_id: org.stripe_subscription_id,
        subscription_item_id: subscriptionItem.id,
        price_id: priceId,
        supabase_user_id: user.id,
      },
      success_url: `${origin}/settings/billing?seats_added=success`,
      cancel_url: `${origin}/settings/billing?seats_added=canceled`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    })
    */
  } catch (error: any) {
    console.error('Error adding seats:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

