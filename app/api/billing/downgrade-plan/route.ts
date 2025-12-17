
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
        { error: 'Only managers can downgrade plans' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { targetTier } = body

    if (!targetTier || !['starter', 'team'].includes(targetTier)) {
      return NextResponse.json(
        { error: 'Invalid target tier. Must be "starter" or "team"' },
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

    // Check if downgrade is valid
    if (org.plan_tier === 'starter' && targetTier === 'starter') {
      return NextResponse.json(
        { error: 'Already on Starter plan' },
        { status: 400 }
      )
    }

    if (org.plan_tier === 'enterprise' && targetTier === 'starter') {
      return NextResponse.json(
        { error: 'Cannot downgrade directly from Enterprise to Starter. Please downgrade to Team first.' },
        { status: 400 }
      )
    }

    // Check seat count requirements
    if (targetTier === 'starter' && org.seat_limit > 20) {
      return NextResponse.json(
        { error: 'Starter plan allows maximum 20 seats. Please remove seats first.' },
        { status: 400 }
      )
    }

    if (targetTier === 'team' && org.seat_limit > 100) {
      return NextResponse.json(
        { error: 'Team plan allows maximum 100 seats. Please remove seats first.' },
        { status: 400 }
      )
    }

    if (!org.stripe_subscription_id || !org.stripe_subscription_item_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    // Get price ID for target tier
    const priceId = STRIPE_CONFIG[targetTier as 'starter' | 'team']?.perSeatPriceId
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not configured for target tier' },
        { status: 500 }
      )
    }

    // Update subscription item with new price
    await stripe.subscriptionItems.update(org.stripe_subscription_item_id, {
      price: priceId,
      quantity: org.seat_limit,
    })

    // Update organization plan_tier
    await supabase
      .from('organizations')
      .update({ plan_tier: targetTier })
      .eq('id', org.id)

    return NextResponse.json({
      success: true,
      newTier: targetTier,
    })
  } catch (error: any) {
    console.error('Error downgrading plan:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

