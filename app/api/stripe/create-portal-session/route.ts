import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Ensure Node.js runtime so process.env is available
export const runtime = 'nodejs'

// Lazy initialize Stripe to avoid build-time errors
function getStripeClient() {
  const secret = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secret) {
    return null
  }
  return new Stripe(secret, {
    apiVersion: '2024-06-20' as any
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

    // Get user's Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    const profileData = profile as { stripe_customer_id?: string | null; email?: string | null; full_name?: string | null }
    let customerId = profileData.stripe_customer_id || undefined

    // Verify customer exists in Stripe
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId)
      } catch (error: any) {
        // If customer doesn't exist, create a new one
        console.warn(`Customer ${customerId} not found in Stripe, creating new customer:`, error.message)
        customerId = undefined
      }
    }

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profileData.email || user.email || '',
        name: profileData.full_name || undefined,
        metadata: {
          supabase_user_id: user.id
        }
      })
      customerId = customer.id

      // Save customer ID to database
      const { error: updateError } = await (supabase
        .from('users') as any)
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
      
      if (updateError) {
        console.error('Error updating customer ID:', updateError)
      }
    }

    // Determine base URL from request origin (handles dev port changes)
    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000'

    // Create portal session
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/billing`
      })

      return NextResponse.json({ url: session.url })
    } catch (portalError: any) {
      // Check for specific Stripe configuration errors
      if (portalError?.code === 'resource_missing' || portalError?.message?.includes('configuration')) {
        console.error('Stripe Billing Portal configuration error:', portalError)
        return NextResponse.json(
          { 
            error: 'Billing portal is not configured. Please configure it in Stripe Dashboard: https://dashboard.stripe.com/test/settings/billing/portal',
            details: portalError.message
          },
          { status: 400 }
        )
      }
      throw portalError
    }
  } catch (error: any) {
    console.error('Portal session error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    )
  }
}

