import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Stripe client setup
function getStripeClient() {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      console.warn('⚠️ STRIPE_SECRET_KEY not set')
      return null
    }
    
    // Dynamic import to avoid bundling Stripe in client
    const stripe = require('stripe')(stripeKey)
    return stripe
  } catch (error) {
    console.error('Error initializing Stripe:', error)
    return null
  }
}

// Credit package pricing (in cents)
const CREDIT_PACKAGES = [
  { credits: 10, price: 500 }, // $5 for 10 credits
  { credits: 25, price: 1000 }, // $10 for 25 credits
  { credits: 50, price: 1800 }, // $18 for 50 credits (better value)
  { credits: 100, price: 3000 }, // $30 for 100 credits (best value)
]

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { credits, referral } = await request.json()
    
    if (!credits || !Number.isInteger(credits) || credits <= 0) {
      return NextResponse.json({ error: 'Invalid credits amount' }, { status: 400 })
    }

    // Find matching package or calculate price
    const packageInfo = CREDIT_PACKAGES.find(pkg => pkg.credits === credits)
    const priceInCents = packageInfo?.price || (credits * 50) // Default: $0.50 per credit

    const stripe = getStripeClient()
    if (!stripe) {
      return NextResponse.json({ error: 'Payment processing unavailable' }, { status: 503 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('email, full_name, stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    // Verify customer exists in Stripe, or create new one
    if (customerId) {
      try {
        // Verify the customer exists in Stripe
        await stripe.customers.retrieve(customerId)
      } catch (error: any) {
        // If customer doesn't exist (404) or any other error, create a new one
        console.warn(`Customer ${customerId} not found in Stripe, creating new customer:`, error.message)
        customerId = null
      }
    }

    // Create Stripe customer if doesn't exist or was invalid
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: profile?.full_name,
        metadata: {
          supabase_user_id: user.id
        }
      })
      
      customerId = customer.id

      // Save customer ID to database
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create a one-time payment checkout session
    const origin = request.headers.get('origin') || 
                   process.env.NEXT_PUBLIC_SITE_URL || 
                   'http://localhost:3000'

    // Build checkout session parameters
    const checkoutParams: any = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${credits} Practice Call Credits`,
              description: `Purchase ${credits} extra credits to continue training`
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_creation: 'always',
      success_url: `${origin}/pricing?success=true&credits=${credits}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        credits: credits.toString(),
        purchase_type: 'credits'
      },
    }

    // Add referral ID if present and non-empty (Stripe rejects blank values)
    if (referral && referral.trim() !== '') {
      checkoutParams.client_reference_id = referral
    }

    const session = await stripe.checkout.sessions.create(checkoutParams)

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Credit purchase error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

