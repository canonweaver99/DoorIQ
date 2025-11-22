import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events for subscriptions and checkout
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  const supabase = await createServerSupabaseClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Check if this is a team or starter plan signup
        const planType = session.metadata?.plan_type || session.subscription_data?.metadata?.plan_type

        if (planType === 'team' || planType === 'starter') {
          await handleTeamPlanCheckout(session, supabase, planType)
        } else {
          // Handle individual plan checkout
          await handleIndividualPlanCheckout(session, supabase)
        }
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCreated(subscription, supabase)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription, supabase)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription, supabase)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice, supabase)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice, supabase)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle team or starter plan checkout completion
 */
async function handleTeamPlanCheckout(
  session: Stripe.Checkout.Session,
  supabase: any,
  planType: string = 'team'
) {
  const metadata = session.metadata || session.subscription_data?.metadata || {}
  const organizationName = metadata.organization_name
  const seatCount = parseInt(metadata.seat_count || '1', 10)
  const userId = metadata.supabase_user_id

  if (!organizationName || !userId) {
    console.error('Missing required metadata for team plan checkout:', { organizationName, userId })
    return
  }

  // Get subscription to get quantity and subscription item ID
  const subscriptionId = session.subscription as string
  if (!subscriptionId) {
    console.error('No subscription ID in checkout session')
    return
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price'],
  })

  const subscriptionItem = subscription.items.data[0]
  const actualQuantity = subscriptionItem?.quantity || seatCount

  // Get customer ID
  const customerId = typeof session.customer === 'string' 
    ? session.customer 
    : session.customer?.id

  if (!customerId) {
    console.error('No customer ID in checkout session')
    return
  }

  // Create organization
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: organizationName,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_subscription_item_id: subscriptionItem?.id,
      plan_tier: planType === 'starter' ? 'starter' : 'team',
      seat_limit: actualQuantity,
      seats_used: 1, // Manager counts as first seat
    })
    .select()
    .single()

  if (orgError) {
    console.error('Error creating organization:', orgError)
    throw orgError
  }

  // Link user to organization as manager/admin
  const { error: userError } = await supabase
    .from('users')
    .update({
      organization_id: organization.id,
      role: 'manager',
      is_active: true,
      stripe_customer_id: customerId,
    })
    .eq('id', userId)

  if (userError) {
    console.error('Error updating user:', userError)
    throw userError
  }

  console.log(`✅ Team plan checkout completed: Organization ${organization.id} created with ${actualQuantity} seats`)
}

/**
 * Handle individual/starter plan checkout completion
 */
async function handleIndividualPlanCheckout(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  const customerId = typeof session.customer === 'string' 
    ? session.customer 
    : session.customer?.id

  const subscriptionId = session.subscription as string

  if (!customerId || !subscriptionId) {
    console.error('Missing customer or subscription ID')
    return
  }

  // Get user ID from customer metadata or subscription metadata
  const customer = await stripe.customers.retrieve(customerId)
  const userId = (customer as Stripe.Customer).metadata?.supabase_user_id

  if (!userId) {
    console.error('No user ID in customer metadata')
    return
  }

  // Update user subscription info
  const { error } = await supabase
    .from('users')
    .update({
      stripe_customer_id: customerId,
      subscription_status: 'trialing',
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user subscription:', error)
  }
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id

  if (!customerId) return

  // Check if this is for an organization (team or starter plan)
  const planType = subscription.metadata?.plan_type

  if (planType === 'team' || planType === 'starter') {
    // Organization subscription - already handled in checkout.session.completed
    return
  }

  // Individual subscription - grant credits
  const customer = await stripe.customers.retrieve(customerId)
  const userId = (customer as Stripe.Customer).metadata?.supabase_user_id

  if (userId) {
    // Grant subscription credits
    const { error } = await supabase.rpc('grant_subscription_credits', {
      p_user_id: userId,
    })

    if (error) {
      console.error('Error granting subscription credits:', error)
    }
  }
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id

  if (!customerId) return

  const planType = subscription.metadata?.plan_type

  if (planType === 'team' || planType === 'starter') {
    // Update organization subscription
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (org) {
      const subscriptionItem = subscription.items.data[0]
      const quantity = subscriptionItem?.quantity || 0

      await supabase
        .from('organizations')
        .update({
          stripe_subscription_id: subscription.id,
          stripe_subscription_item_id: subscriptionItem?.id,
          seat_limit: quantity,
        })
        .eq('id', org.id)
    }
  } else {
    // Update individual subscription status
    const customer = await stripe.customers.retrieve(customerId)
    const userId = (customer as Stripe.Customer).metadata?.supabase_user_id

    if (userId) {
      await supabase
        .from('users')
        .update({
          subscription_status: subscription.status,
          subscription_id: subscription.id,
        })
        .eq('id', userId)
    }
  }
}

/**
 * Handle subscription deleted event
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id

  if (!customerId) return

  const planType = subscription.metadata?.plan_type

  if (planType === 'team' || planType === 'starter') {
    // Update organization subscription status
    await supabase
      .from('organizations')
      .update({
        stripe_subscription_id: null,
        stripe_subscription_item_id: null,
      })
      .eq('stripe_customer_id', customerId)
  } else {
    // Update individual subscription status
    const customer = await stripe.customers.retrieve(customerId)
    const userId = (customer as Stripe.Customer).metadata?.supabase_user_id

    if (userId) {
      await supabase
        .from('users')
        .update({
          subscription_status: 'canceled',
        })
        .eq('id', userId)
    }
  }
}

/**
 * Handle invoice payment succeeded
 */
async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any
) {
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id

  if (!customerId) return

  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const planType = subscription.metadata?.plan_type

  if (planType === 'team' || planType === 'starter') {
    // Organization payment - no action needed
    return
  }

  // Individual payment - update subscription status
  const customer = await stripe.customers.retrieve(customerId)
  const userId = (customer as Stripe.Customer).metadata?.supabase_user_id

  if (userId) {
    await supabase
      .from('users')
      .update({
        subscription_status: 'active',
      })
      .eq('id', userId)
  }
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
) {
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id

  if (!customerId) return

  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const planType = subscription.metadata?.plan_type

  if (planType === 'team' || planType === 'starter') {
    // Organization payment failed - could send notification
    return
  }

  // Individual payment failed
  const customer = await stripe.customers.retrieve(customerId)
  const userId = (customer as Stripe.Customer).metadata?.supabase_user_id

  if (userId) {
    await supabase
      .from('users')
      .update({
        subscription_status: 'past_due',
      })
      .eq('id', userId)
  }
}

