export const dynamic = "force-static";

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
})

export async function generateStaticParams() {
  return []
}

/**
 * PATCH /api/admin/organizations/[id]/seats
 * Admin-only endpoint to update organization seat limits
 * Also updates Stripe subscription quantity
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }
    
    const { id } = params
    const body = await request.json()
    const { seat_limit } = body
    
    if (!seat_limit || typeof seat_limit !== 'number' || seat_limit < 0) {
      return NextResponse.json(
        { error: 'Invalid seat_limit. Must be a positive number.' },
        { status: 400 }
      )
    }
    
    // Get current organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()
    
    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }
    
    // Validate can't reduce below current usage
    if (seat_limit < organization.seats_used) {
      return NextResponse.json(
        { error: `Cannot set seat_limit below current usage (${organization.seats_used} seats). Deactivate some members first.` },
        { status: 400 }
      )
    }
    
    // Update Stripe subscription if exists
    if (organization.stripe_subscription_id && organization.stripe_subscription_item_id) {
      try {
        await stripe.subscriptions.update(organization.stripe_subscription_id, {
          items: [{
            id: organization.stripe_subscription_item_id,
            quantity: seat_limit,
          }],
          proration_behavior: 'always_invoice',
        })
      } catch (stripeError: any) {
        console.error('Stripe error:', stripeError)
        return NextResponse.json(
          { error: `Failed to update Stripe subscription: ${stripeError.message}` },
          { status: 500 }
        )
      }
    }
    
    // Update organization
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update({ seat_limit })
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating organization:', updateError)
      return NextResponse.json(
        { error: 'Failed to update organization' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      organization: updatedOrg,
      message: `Seat limit updated to ${seat_limit}. Stripe subscription updated.`
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

