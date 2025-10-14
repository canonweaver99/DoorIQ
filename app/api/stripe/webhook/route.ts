import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.supabase_user_id

        if (!userId) {
          console.error('No user ID in subscription metadata')
          break
        }

        await supabase
          .from('users')
          .update({
            subscription_status: subscription.status,
            subscription_id: subscription.id,
            subscription_plan: subscription.items.data[0]?.price.id,
            subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
          })
          .eq('id', userId)

        console.log(`Subscription ${subscription.status} for user ${userId}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.supabase_user_id

        if (!userId) break

        await supabase
          .from('users')
          .update({
            subscription_status: 'canceled',
            subscription_id: null,
            subscription_plan: null
          })
          .eq('id', userId)

        console.log(`Subscription canceled for user ${userId}`)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscription = invoice.subscription as string
        
        if (subscription) {
          const sub = await stripe.subscriptions.retrieve(subscription)
          const userId = sub.metadata.supabase_user_id

          if (userId) {
            await supabase
              .from('users')
              .update({
                subscription_status: 'active',
                last_payment_date: new Date().toISOString()
              })
              .eq('id', userId)

            console.log(`Payment succeeded for user ${userId}`)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscription = invoice.subscription as string
        
        if (subscription) {
          const sub = await stripe.subscriptions.retrieve(subscription)
          const userId = sub.metadata.supabase_user_id

          if (userId) {
            await supabase
              .from('users')
              .update({
                subscription_status: 'past_due'
              })
              .eq('id', userId)

            console.log(`Payment failed for user ${userId}`)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

