export const dynamic = "force-static";

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { STRIPE_CONFIG } from '@/lib/stripe/config'

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
    } else {
      // No Stripe subscription - use current seat_limit from database
      currentQuantity = org.seat_limit || 0
    }

    const newQuantity = currentQuantity + seatsToAdd

    // Check plan limits
    if (org.plan_tier === 'starter' && newQuantity > 20) {
      return NextResponse.json(
        { 
          error: 'Starter plan limit is 20 seats. Please upgrade to Team plan.',
          requiresUpgrade: true,
          currentTier: 'starter',
          maxSeats: 20,
        },
        { status: 400 }
      )
    }

    if (org.plan_tier === 'team' && newQuantity > 100) {
      return NextResponse.json(
        { 
          error: 'Team plan limit is 100 seats. Please upgrade to Enterprise plan.',
          requiresUpgrade: true,
          currentTier: 'team',
          maxSeats: 100,
        },
        { status: 400 }
      )
    }

    // FAKE PAYWALL: Always add seats directly without payment
    // This bypasses Stripe checkout for development/testing
    try {
      // Update subscription quantity directly (if subscription exists)
      if (subscriptionItem && org.stripe_subscription_item_id) {
        try {
          await stripe.subscriptionItems.update(org.stripe_subscription_item_id, {
            quantity: newQuantity,
          })
        } catch (stripeError) {
          // If Stripe update fails, just update database (for testing without Stripe)
          console.log('Stripe update skipped (fake paywall mode)')
        }
      }

      // Update organization seat_limit in database
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ seat_limit: newQuantity })
        .eq('id', org.id)

      if (updateError) {
        console.error('Error updating organization seat limit:', updateError)
        throw updateError
      }

      return NextResponse.json({
        success: true,
        message: `${seatsToAdd} seat${seatsToAdd !== 1 ? 's' : ''} added successfully.`,
        seatsAdded: seatsToAdd,
        newQuantity,
      })
    } catch (error: any) {
      console.error('Error adding seats:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to add seats' },
        { status: 500 }
      )
    }

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

