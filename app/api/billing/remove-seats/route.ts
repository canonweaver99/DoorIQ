export const dynamic = "force-static";

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
        { error: 'Only managers can modify seats' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { seatsToRemove } = body

    if (!seatsToRemove || typeof seatsToRemove !== 'number' || seatsToRemove <= 0) {
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

    if (!org.stripe_subscription_id || !org.stripe_subscription_item_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(
      org.stripe_subscription_id
    )

    const subscriptionItem = subscription.items.data.find(
      (item) => item.id === org.stripe_subscription_item_id
    )

    if (!subscriptionItem) {
      return NextResponse.json(
        { error: 'Subscription item not found' },
        { status: 404 }
      )
    }

    const currentQuantity = subscriptionItem.quantity || 0
    const newQuantity = Math.max(1, currentQuantity - seatsToRemove) // Minimum 1 seat

    // Check if removing seats would go below seats_used
    if (newQuantity < org.seats_used) {
      return NextResponse.json(
        { 
          error: `Cannot reduce seats below current usage (${org.seats_used} seats in use)`,
          currentUsage: org.seats_used,
        },
        { status: 400 }
      )
    }

    // Check plan minimums
    if (org.plan_tier === 'starter' && newQuantity < 1) {
      return NextResponse.json(
        { error: 'Starter plan requires at least 1 seat' },
        { status: 400 }
      )
    }

    if (org.plan_tier === 'team' && newQuantity < 21) {
      return NextResponse.json(
        { 
          error: 'Team plan requires at least 21 seats. Please downgrade to Starter plan.',
          requiresDowngrade: true,
          currentTier: 'team',
          minSeats: 21,
        },
        { status: 400 }
      )
    }

    // Update subscription quantity
    await stripe.subscriptionItems.update(subscriptionItem.id, {
      quantity: newQuantity,
    })

    // Update organization seat_limit
    await supabase
      .from('organizations')
      .update({ seat_limit: newQuantity })
      .eq('id', org.id)

    return NextResponse.json({
      success: true,
      newSeatCount: newQuantity,
    })
  } catch (error: any) {
    console.error('Error removing seats:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

