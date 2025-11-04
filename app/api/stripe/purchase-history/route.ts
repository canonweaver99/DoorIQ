import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

function getStripeClient() {
  const secret = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secret) {
    return null
  }
  return new Stripe(secret, {
    apiVersion: '2024-06-20' as any
  })
}

export async function GET(request: NextRequest) {
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
    const { data: profile } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ purchases: [] })
    }

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: profile.stripe_customer_id,
      limit: 100,
      expand: ['data.subscription', 'data.lines.data.price.product']
    })

    // Format invoices as purchases
    const purchases = invoices.data.map(invoice => {
      const lineItem = invoice.lines.data[0]
      const price = lineItem?.price
      const product = price?.product as Stripe.Product | undefined
      
      return {
        id: invoice.id,
        date: new Date(invoice.created * 1000).toISOString(),
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        type: invoice.subscription ? 'subscription' : 'one-time',
        description: product?.name || lineItem?.description || 'Subscription',
        invoiceUrl: invoice.hosted_invoice_url,
        receiptUrl: invoice.receipt_url,
        interval: price?.recurring?.interval || null,
      }
    })

    // Sort by date (newest first)
    purchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ purchases })
  } catch (error: any) {
    console.error('Purchase history error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch purchase history' },
      { status: 500 }
    )
  }
}

