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

    // Fetch invoices from Stripe (including draft invoices for unpaid subscriptions)
    const invoices = await stripe.invoices.list({
      customer: profile.stripe_customer_id,
      limit: 100,
      expand: ['data.subscription', 'data.lines.data.price.product']
    })

    // Also fetch subscriptions to include subscription creation events
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      limit: 100,
      expand: ['data.items.data.price.product']
    })

    // Format invoices as purchases
    const invoicePurchases = invoices.data.map(invoice => {
      const lineItem = invoice.lines.data[0]
      const price = lineItem?.price
      const product = price?.product as Stripe.Product | undefined
      
      // Determine description based on product name or price
      let description = product?.name || lineItem?.description || 'Subscription'
      if (price?.recurring?.interval === 'year' && description.toLowerCase().includes('individual')) {
        description = 'Yearly Individual Plan'
      } else if (price?.recurring?.interval === 'month' && description.toLowerCase().includes('individual')) {
        description = 'Monthly Individual Plan'
      }
      
      return {
        id: invoice.id,
        date: new Date(invoice.created * 1000).toISOString(),
        amount: invoice.amount_paid || invoice.amount_due,
        currency: invoice.currency,
        status: invoice.status,
        type: invoice.subscription ? 'subscription' : 'one-time',
        description,
        invoiceUrl: invoice.hosted_invoice_url,
        receiptUrl: invoice.receipt_url,
        interval: price?.recurring?.interval || null,
      }
    })

    // Format subscriptions as purchases (for initial subscription creation)
    const subscriptionPurchases = subscriptions.data
      .filter(sub => {
        // Only include if there's no corresponding invoice yet, or if it's a new subscription
        const hasInvoice = invoices.data.some(inv => inv.subscription === sub.id)
        return !hasInvoice && (sub.status === 'active' || sub.status === 'trialing')
      })
      .map(subscription => {
        const price = subscription.items.data[0]?.price
        const product = price?.product as Stripe.Product | undefined
        
        let description = product?.name || 'Subscription'
        if (price?.recurring?.interval === 'year' && description.toLowerCase().includes('individual')) {
          description = 'Yearly Individual Plan'
        } else if (price?.recurring?.interval === 'month' && description.toLowerCase().includes('individual')) {
          description = 'Monthly Individual Plan'
        }
        
        return {
          id: subscription.id,
          date: new Date(subscription.created * 1000).toISOString(),
          amount: price?.unit_amount || 0,
          currency: price?.currency || 'usd',
          status: subscription.status === 'active' ? 'paid' : subscription.status,
          type: 'subscription',
          description,
          invoiceUrl: null,
          receiptUrl: null,
          interval: price?.recurring?.interval || null,
        }
      })

    // Combine and sort by date (newest first)
    const purchases = [...invoicePurchases, ...subscriptionPurchases]
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

