import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Ensure Node.js runtime so process.env is available
export const runtime = 'nodejs'

// Lazy initialize Stripe to avoid build-time errors
function getStripeClient() {
  const secret = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secret) {
    console.error('❌ STRIPE_SECRET_KEY not found in environment')
    return null
  }
  return new Stripe(secret, {
    apiVersion: '2024-06-20'
  })
}

// Helper to log subscription events
async function logSubscriptionEvent(
  supabase: any,
  userId: string,
  eventType: string,
  eventData: any
) {
  await supabase.from('subscription_events').insert({
    user_id: userId,
    event_type: eventType,
    event_data: eventData,
    notification_sent: false
  })
}

// Helper to send notification email
async function sendNotificationEmail(
  userId: string,
  eventType: string,
  data: any
) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, eventType, data })
    })
  } catch (error) {
    console.error('Failed to send notification email:', error)
  }
}

export async function POST(request: NextRequest) {
  const stripe = getStripeClient()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 })
  }

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
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id

        console.log('✅ Checkout session completed:', {
          sessionId: session.id,
          userId,
          customerId: session.customer,
          subscriptionId: session.subscription
        })

        if (!userId) {
          console.error('❌ No user ID in checkout session metadata')
          break
        }

        // Get the subscription details
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          
          const updateData = {
            subscription_status: subscription.status,
            subscription_id: subscription.id,
            subscription_plan: subscription.items.data[0]?.price.id,
            stripe_price_id: subscription.items.data[0]?.price.id,
            stripe_customer_id: session.customer as string,
            subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            trial_start_date: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null
          }

          console.log('📝 Updating user subscription:', updateData)

          const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)

          if (updateError) {
            console.error('❌ Error updating user subscription:', updateError)
          } else {
            console.log('✅ User subscription updated successfully')
            // Grant 50 monthly credits for paid subscription
            if (subscription.status === 'active' || subscription.status === 'trialing') {
              await supabase.rpc('grant_subscription_credits', { p_user_id: userId })
              console.log('✅ Granted 50 monthly credits to user')
            }
          }

          // Check if this is an Individual plan purchase
          const priceId = subscription.items.data[0]?.price.id
          const individualMonthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY
          const individualYearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_YEARLY
          const isIndividualPlan = priceId === individualMonthlyPriceId || priceId === individualYearlyPriceId

          // Log event
          await logSubscriptionEvent(supabase, userId, 'trial_started', {
            subscription_id: subscription.id,
            trial_ends_at: subscription.trial_end
          })

          // Send welcome email for Individual plan purchases
          if (isIndividualPlan && (subscription.status === 'active' || subscription.status === 'trialing')) {
            await sendNotificationEmail(userId, 'individual_plan_welcome', {})
            console.log(`✅ Sent Individual plan welcome email to user ${userId}`)
          } else {
            // Send regular trial email for other plans
            await sendNotificationEmail(userId, 'trial_started', {
              trialEndsAt: subscription.trial_end
            })
          }

          console.log(`✅ Trial started for user ${userId}`)
        }
        break
      }

      case 'customer.subscription.created': {
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
            stripe_price_id: subscription.items.data[0]?.price.id,
            subscription_current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            trial_start_date: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null
          })
          .eq('id', userId)

        // Grant 50 monthly credits for subscription
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          await supabase.rpc('grant_subscription_credits', { p_user_id: userId })
          console.log('✅ Granted 50 monthly credits to user')
        }

        // Check if this is an Individual plan purchase
        const priceId = subscription.items.data[0]?.price.id
        const individualMonthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY
        const individualYearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_YEARLY
        const isIndividualPlan = priceId === individualMonthlyPriceId || priceId === individualYearlyPriceId

        // Log event
        await logSubscriptionEvent(supabase, userId, 'trial_started', {
          subscription_id: subscription.id,
          trial_ends_at: subscription.trial_end
        })

        // Send welcome email for Individual plan purchases
        if (isIndividualPlan && (subscription.status === 'active' || subscription.status === 'trialing')) {
          await sendNotificationEmail(userId, 'individual_plan_welcome', {})
          console.log(`✅ Sent Individual plan welcome email to user ${userId}`)
        } else {
          // Send regular trial email for other plans
          await sendNotificationEmail(userId, 'trial_started', {
            trialEndsAt: subscription.trial_end
          })
        }

        console.log(`Trial started for user ${userId}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.supabase_user_id

        if (!userId) {
          console.error('No user ID in subscription metadata')
          break
        }

        const previousAttributes = (event.data as any).previous_attributes

        await supabase
          .from('users')
          .update({
            subscription_status: subscription.status,
            subscription_id: subscription.id,
            subscription_plan: subscription.items.data[0]?.price.id,
            stripe_price_id: subscription.items.data[0]?.price.id,
            subscription_current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            subscription_cancel_at_period_end: subscription.cancel_at_period_end
          })
          .eq('id', userId)

        // Grant credits if subscription is now active/trialing
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          await supabase.rpc('grant_subscription_credits', { p_user_id: userId })
          console.log('✅ Granted/updated 50 monthly credits to user')
        }

        // Check if trial just ended
        if (previousAttributes?.status === 'trialing' && subscription.status === 'active') {
          await logSubscriptionEvent(supabase, userId, 'trial_ended_converted', {
            subscription_id: subscription.id
          })
          await sendNotificationEmail(userId, 'trial_ended_converted', {})
        }

        // Check if subscription was canceled
        if (subscription.cancel_at_period_end && !previousAttributes?.cancel_at_period_end) {
          await logSubscriptionEvent(supabase, userId, 'subscription_cancel_scheduled', {
            cancel_at: (subscription as any).current_period_end
          })
          await sendNotificationEmail(userId, 'subscription_cancel_scheduled', {
            cancelAt: (subscription as any).current_period_end
          })
        }

        console.log(`Subscription updated for user ${userId}: ${subscription.status}`)
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

        await logSubscriptionEvent(supabase, userId, 'subscription_canceled', {
          subscription_id: subscription.id,
          canceled_at: subscription.canceled_at
        })

        await sendNotificationEmail(userId, 'subscription_canceled', {})

        console.log(`Subscription canceled for user ${userId}`)
        break
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.supabase_user_id

        if (!userId) break

        await logSubscriptionEvent(supabase, userId, 'trial_ending_soon', {
          trial_ends_at: subscription.trial_end
        })

        await sendNotificationEmail(userId, 'trial_ending_soon', {
          trialEndsAt: subscription.trial_end,
          daysRemaining: subscription.trial_end 
            ? Math.ceil((subscription.trial_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
            : 0
        })

        console.log(`Trial ending soon for user ${userId}`)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscription = invoice.subscription as unknown as string
        
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

            await logSubscriptionEvent(supabase, userId, 'payment_succeeded', {
              invoice_id: invoice.id,
              amount: invoice.amount_paid
            })

            // Only send notification if not the first invoice (not trial start)
            if (invoice.billing_reason !== 'subscription_create') {
              await sendNotificationEmail(userId, 'payment_succeeded', {
                amount: invoice.amount_paid / 100,
                currency: invoice.currency
              })
            }

            console.log(`Payment succeeded for user ${userId}`)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscription = invoice.subscription as unknown as string
        
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

            await logSubscriptionEvent(supabase, userId, 'payment_failed', {
              invoice_id: invoice.id,
              amount: invoice.amount_due
            })

            await sendNotificationEmail(userId, 'payment_failed', {
              amount: invoice.amount_due / 100,
              currency: invoice.currency,
              attemptCount: invoice.attempt_count
            })

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

