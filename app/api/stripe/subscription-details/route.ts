import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

function getStripeClient() {
  const secret = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secret) {
    return null
  }
  return new Stripe(secret, {
    apiVersion: '2024-06-20'
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

    // Get user's Stripe customer ID and subscription info
    const { data: profile } = await supabase
      .from('users')
      .select('stripe_customer_id, subscription_id, subscription_status, subscription_plan, subscription_current_period_end')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ 
        subscription: null,
        paymentMethod: null
      })
    }

    let subscriptionDetails = null
    let paymentMethod = null

    // Get subscription details from Stripe if subscription_id exists
    if (profile.subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(profile.subscription_id, {
          expand: ['items.data.price.product', 'default_payment_method']
        })

        const price = subscription.items.data[0]?.price
        const isYearly = price?.recurring?.interval === 'year'
        const isMonthly = price?.recurring?.interval === 'month'
        
        // Calculate yearly savings if monthly
        let yearlySavings = null
        if (isMonthly && price) {
          const monthlyPrice = price.unit_amount || 0
          const yearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_YEARLY
          if (yearlyPriceId) {
            try {
              const yearlyPrice = await stripe.prices.retrieve(yearlyPriceId)
              const yearlyPricePerMonth = (yearlyPrice.unit_amount || 0) / 12
              const savingsPerMonth = monthlyPrice - yearlyPricePerMonth
              const totalYearlySavings = savingsPerMonth * 12
              const savingsPercent = Math.round((totalYearlySavings / (monthlyPrice * 12)) * 100)
              yearlySavings = {
                amount: totalYearlySavings,
                percent: savingsPercent,
                yearlyPrice: yearlyPrice.unit_amount || 0
              }
            } catch (e) {
              // Yearly price not found, skip savings calculation
            }
          }
        }

        subscriptionDetails = {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          price: {
            amount: price?.unit_amount || 0,
            currency: price?.currency || 'usd',
            interval: price?.recurring?.interval || 'month',
            intervalCount: price?.recurring?.interval_count || 1
          },
          plan: profile.subscription_plan || 'individual',
          yearlySavings
        }

        // Get payment method from subscription
        if (subscription.default_payment_method) {
          const pm = typeof subscription.default_payment_method === 'string'
            ? await stripe.paymentMethods.retrieve(subscription.default_payment_method)
            : subscription.default_payment_method

          if (pm && pm.type === 'card' && pm.card) {
            paymentMethod = {
              type: 'card',
              brand: pm.card.brand,
              last4: pm.card.last4,
              expMonth: pm.card.exp_month,
              expYear: pm.card.exp_year
            }
          }
        }
      } catch (subError: any) {
        console.error('Error fetching subscription:', subError)
        // If subscription doesn't exist in Stripe, return null
      }
    }

    // If no payment method from subscription, try to get default payment method from customer
    if (!paymentMethod && profile.stripe_customer_id) {
      try {
        const customer = await stripe.customers.retrieve(profile.stripe_customer_id, {
          expand: ['invoice_settings.default_payment_method']
        })

        if (customer && typeof customer === 'object' && 'invoice_settings' in customer) {
          const defaultPm = customer.invoice_settings.default_payment_method
          if (defaultPm) {
            const pm = typeof defaultPm === 'string'
              ? await stripe.paymentMethods.retrieve(defaultPm)
              : defaultPm

            if (pm && pm.type === 'card' && pm.card) {
              paymentMethod = {
                type: 'card',
                brand: pm.card.brand,
                last4: pm.card.last4,
                expMonth: pm.card.exp_month,
                expYear: pm.card.exp_year
              }
            }
          }
        }
      } catch (pmError) {
        console.error('Error fetching payment method:', pmError)
      }
    }

    return NextResponse.json({
      subscription: subscriptionDetails,
      paymentMethod
    })
  } catch (error: any) {
    console.error('Subscription details error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription details' },
      { status: 500 }
    )
  }
}

