export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

// Lazy initialize Stripe to avoid build-time errors
function getStripeClient() {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return null
  }
  return new Stripe(stripeKey, {
    apiVersion: '2025-09-30.clover',
  })
}

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

  const stripe = getStripeClient()
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
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

        // Check if this is for adding seats to an existing subscription
        const action = session.metadata?.action
        if (action === 'add_seats') {
          await handleAddSeatsCheckout(session, supabase)
          break
        }

        // Check if this is for switching billing interval
        if (action === 'switch_billing_interval') {
          await handleSwitchBillingIntervalCheckout(session, supabase)
          break
        }

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
  let userId = metadata.supabase_user_id
  const userEmail = metadata.user_email || session.customer_email
  const userName = metadata.user_name

  // For guest checkouts, we need to create the user account
  if (!userId && userEmail) {
    console.log('🔐 Guest checkout detected - creating user account for:', userEmail)
    const serviceSupabase = await createServiceSupabaseClient()
    
    // Create admin client for auth operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing Supabase configuration for admin client')
      throw new Error('Missing Supabase configuration')
    }
    
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    
    try {
      // Check if user already exists by email using admin client
      const { data: existingUserData, error: getUserError } = await adminClient.auth.admin.getUserByEmail(userEmail.toLowerCase())
      
      if (!getUserError && existingUserData?.user) {
        userId = existingUserData.user.id
        console.log('✅ Found existing user:', userId)
      } else {
        // Create new auth user (unconfirmed - they'll set password via email)
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: userEmail.toLowerCase(),
          email_confirm: false, // They'll confirm via password setup email
          user_metadata: {
            full_name: userName || userEmail.split('@')[0],
            source: 'stripe_checkout',
          },
        })

        if (authError) {
          console.error('❌ Error creating auth user:', authError)
          throw authError
        }

        if (!authData?.user) {
          throw new Error('Failed to create auth user')
        }

        userId = authData.user.id
        console.log('✅ Created new auth user:', userId)

        // Generate rep ID
        const repId = `REP-${Date.now().toString().slice(-6)}`

        // Create user profile using service client (bypasses RLS)
        const { error: profileError } = await serviceSupabase
          .from('users')
          .insert({
            id: userId,
            email: userEmail.toLowerCase(),
            full_name: userName || userEmail.split('@')[0],
            rep_id: repId,
            role: 'rep', // Will be updated to manager below
            virtual_earnings: 0,
            checkout_session_id: session.id || null,
          })

        if (profileError) {
          console.error('❌ Error creating user profile:', profileError)
          // Try to clean up auth user
          await adminClient.auth.admin.deleteUser(userId)
          throw profileError
        }

        // Create session limits record
        const today = new Date().toISOString().split('T')[0]
        const { error: limitsError } = await serviceSupabase
          .from('user_session_limits')
          .insert({
            user_id: userId,
            sessions_this_month: 0,
            sessions_limit: 75,
            last_reset_date: today,
          })

        if (limitsError) {
          console.error('⚠️ Error creating session limits:', limitsError)
          // Don't fail - this is not critical
        }

        // Note: Password setup is now handled in the onboarding flow
        // Users are redirected to /onboarding after checkout where they set their password
        console.log('✅ User account created for guest checkout. Password will be set in onboarding flow.')
      }
    } catch (error: any) {
      console.error('❌ Error creating user for guest checkout:', error)
      console.error('❌ Error details:', JSON.stringify(error, null, 2))
      // Re-throw to ensure webhook fails and Stripe retries
      throw error
    }
  }

  if (!organizationName) {
    console.error('Missing required metadata for team plan checkout: organizationName')
    return
  }

  if (!userId) {
    console.error('Missing userId - cannot link user to organization')
    return
  }

  // Get subscription to get quantity and subscription item ID
  const subscriptionId = session.subscription as string
  if (!subscriptionId) {
    console.error('No subscription ID in checkout session')
    return
  }

  const stripe = getStripeClient()
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    )
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

  // Get trial end date from subscription
  const trialEndsAt = subscription.trial_end 
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null

  // Use service client for webhook operations (no user session)
  const serviceSupabase = await createServiceSupabaseClient()

  // Link user to organization as manager/admin and set subscription status
  const { error: userError } = await serviceSupabase
    .from('users')
    .update({
      organization_id: organization.id,
      role: 'manager',
      is_active: true,
      stripe_customer_id: customerId,
      subscription_status: subscription.status === 'trialing' ? 'trialing' : 'active',
      trial_ends_at: trialEndsAt,
    })
    .eq('id', userId)

  if (userError) {
    console.error('Error updating user:', userError)
    // If user doesn't exist, try to create it
    if (userError.code === 'PGRST116' || userError.message?.includes('not found')) {
      console.log('⚠️ User not found, creating user profile...')
      const repId = `REP-${Date.now().toString().slice(-6)}`
      const { error: insertError } = await serviceSupabase
        .from('users')
        .insert({
          id: userId,
          email: userEmail?.toLowerCase() || '',
          full_name: userName || userEmail?.split('@')[0] || 'User',
          rep_id: repId,
          role: 'manager',
          is_active: true,
          organization_id: organization.id,
          stripe_customer_id: customerId,
          subscription_status: subscription.status === 'trialing' ? 'trialing' : 'active',
          trial_ends_at: trialEndsAt,
          virtual_earnings: 0,
        })

      if (insertError) {
        console.error('Error creating user profile:', insertError)
        throw insertError
      }
    } else {
      throw userError
    }
  }

  console.log(`✅ Team plan checkout completed: Organization ${organization.id} created with ${actualQuantity} seats, subscription_status: ${subscription.status}`)
  
  // Send welcome email and trial notification if trial started
  if (subscription.status === 'trialing') {
    try {
      const { sendWelcomeEmail, sendTrialStartNotification } = await import('@/lib/email/send')
      
      // Get user details for emails
      const { data: userData } = await serviceSupabase
        .from('users')
        .select('email, full_name')
        .eq('id', userId)
        .single()
      
      if (userData?.email) {
        // Send welcome email to user
        await sendWelcomeEmail(userData.email, userData.full_name || undefined)
        
        // Send trial start notification to admin
        await sendTrialStartNotification(
          userData.email,
          userData.full_name || userEmail || 'User',
          planType,
          trialEndsAt
        )
      }
    } catch (error) {
      console.error('Error sending trial start emails:', error)
      // Don't throw - email sending shouldn't fail the webhook
    }
  }
}

/**
 * Handle individual/starter plan checkout completion
 * Supports both existing users (with supabase_user_id) and guest checkouts (creates new user)
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

  const stripe = getStripeClient()
  if (!stripe) {
    console.error('Stripe is not configured')
    return
  }

  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  
  // Get user ID from customer metadata or session metadata
  let userId = customer.metadata?.supabase_user_id || session.metadata?.supabase_user_id
  
  // Get user info from session metadata (for guest checkouts)
  const metadata = session.metadata || {}
  const userEmail = metadata.user_email || customer.email || session.customer_email
  const userName = metadata.user_name || customer.name
  
  // For guest checkouts, we need to create the user account
  if (!userId && userEmail) {
    console.log('🔐 Guest individual checkout detected - creating user account for:', userEmail)
    const serviceSupabase = await createServiceSupabaseClient()
    
    // Create admin client for auth operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing Supabase configuration for admin client')
      throw new Error('Missing Supabase configuration')
    }
    
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    
    try {
      // Check if user already exists by email using admin client
      const { data: existingUserData, error: getUserError } = await adminClient.auth.admin.getUserByEmail(userEmail.toLowerCase())
      
      if (!getUserError && existingUserData?.user) {
        userId = existingUserData.user.id
        console.log('✅ Found existing user:', userId)
      } else {
        // Create new auth user (unconfirmed - they'll set password via email)
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: userEmail.toLowerCase(),
          email_confirm: false, // They'll confirm via password setup email
          user_metadata: {
            full_name: userName || userEmail.split('@')[0],
            source: 'stripe_checkout',
          },
        })

        if (authError) {
          console.error('❌ Error creating auth user:', authError)
          throw authError
        }

        if (!authData?.user) {
          throw new Error('Failed to create auth user')
        }

        userId = authData.user.id
        console.log('✅ Created new auth user:', userId)

        // Generate rep ID
        const repId = `REP-${Date.now().toString().slice(-6)}`

        // Create user profile using service client (bypasses RLS)
        const { error: profileError } = await serviceSupabase
          .from('users')
          .insert({
            id: userId,
            email: userEmail.toLowerCase(),
            full_name: userName || userEmail.split('@')[0],
            rep_id: repId,
            role: 'rep',
            virtual_earnings: 0,
            checkout_session_id: session.id || null,
          })

        if (profileError) {
          console.error('❌ Error creating user profile:', profileError)
          // Try to clean up auth user
          await adminClient.auth.admin.deleteUser(userId)
          throw profileError
        }

        // Create session limits record
        const today = new Date().toISOString().split('T')[0]
        const { error: limitsError } = await serviceSupabase
          .from('user_session_limits')
          .insert({
            user_id: userId,
            sessions_this_month: 0,
            sessions_limit: 75,
            last_reset_date: today,
          })

        if (limitsError) {
          console.error('⚠️ Error creating session limits:', limitsError)
          // Don't fail - this is not critical
        }

        // Update Stripe customer with user ID for future reference
        await stripe.customers.update(customerId, {
          metadata: {
            ...customer.metadata,
            supabase_user_id: userId,
          },
        })
        
        console.log('✅ User account created successfully for individual plan:', userId)
      }
    } catch (error) {
      console.error('❌ Error creating user for individual checkout:', error)
      throw error
    }
  }

  if (!userId) {
    console.error('No user ID found and could not create user (missing email)')
    return
  }

  // Get subscription to check status and trial end date
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const trialEndsAt = subscription.trial_end 
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null
  
  // Update user subscription info
  const { error } = await supabase
    .from('users')
    .update({
      stripe_customer_id: customerId,
      subscription_status: subscription.status === 'trialing' ? 'trialing' : 'active',
      trial_ends_at: trialEndsAt,
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user subscription:', error)
  }
  
  // Send welcome email and trial notification if trial started
  if (subscription.status === 'trialing') {
    try {
      const { sendWelcomeEmail, sendTrialStartNotification } = await import('@/lib/email/send')
      
      // Get user details for emails
      const { data: userData } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', userId)
        .single()
      
      const emailToUse = userData?.email || userEmail
      if (emailToUse) {
        // Send welcome email to user
        await sendWelcomeEmail(emailToUse, userData?.full_name || undefined)
        
        // Send trial start notification to admin
        await sendTrialStartNotification(
          emailToUse,
          userData?.full_name || userName || 'User',
          'individual',
          trialEndsAt
        )
      }
    } catch (error) {
      console.error('Error sending trial start emails:', error)
      // Don't throw - email sending shouldn't fail the webhook
    }
  }
}

/**
 * Handle checkout session completion for adding seats
 */
async function handleAddSeatsCheckout(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  const metadata = session.metadata || {}
  const organizationId = metadata.organization_id
  const seatsToAdd = parseInt(metadata.seats_to_add || '0', 10)
  const newQuantity = parseInt(metadata.new_quantity || '0', 10)
  const subscriptionId = metadata.subscription_id
  const subscriptionItemId = metadata.subscription_item_id
  const priceId = metadata.price_id

  if (!organizationId || !subscriptionId || !subscriptionItemId || !priceId || seatsToAdd <= 0) {
    console.error('Missing required metadata for adding seats:', {
      organizationId,
      subscriptionId,
      subscriptionItemId,
      priceId,
      seatsToAdd,
    })
    return
  }

  const stripe = getStripeClient()
  if (!stripe) {
    console.error('Stripe is not configured')
    return
  }
  try {
    // Update the subscription quantity in Stripe
    await stripe.subscriptionItems.update(subscriptionItemId, {
      quantity: newQuantity,
      proration_behavior: 'always_invoice',
    })

    // Update organization seat_limit in database
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ seat_limit: newQuantity })
      .eq('id', organizationId)

    if (updateError) {
      console.error('Error updating organization seat limit:', updateError)
      throw updateError
    }

    console.log(`Successfully added ${seatsToAdd} seats to organization ${organizationId}. New quantity: ${newQuantity}`)
  } catch (error: any) {
    console.error('Error handling add seats checkout:', error)
    throw error
  }
}

/**
 * Handle checkout session completion for switching billing interval
 */
async function handleSwitchBillingIntervalCheckout(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  const metadata = session.metadata || session.subscription_data?.metadata || {}
  const organizationId = metadata.organization_id
  const currentSubscriptionId = metadata.current_subscription_id
  const billingInterval = metadata.billing_interval
  const newSubscriptionId = session.subscription as string

  if (!organizationId || !currentSubscriptionId || !newSubscriptionId || !billingInterval) {
    console.error('Missing required metadata for switching billing interval:', {
      organizationId,
      currentSubscriptionId,
      newSubscriptionId,
      billingInterval,
    })
    return
  }

  const stripe = getStripeClient()
  if (!stripe) {
    console.error('Stripe is not configured')
    return
  }
  try {
    // Get the new subscription to get subscription item ID
    const newSubscription = await stripe.subscriptions.retrieve(newSubscriptionId, {
      expand: ['items.data.price'],
    })

    const subscriptionItem = newSubscription.items.data[0]

    // Cancel the old subscription
    await stripe.subscriptions.cancel(currentSubscriptionId)

    // Update organization with new subscription details and billing interval
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        stripe_subscription_id: newSubscriptionId,
        stripe_subscription_item_id: subscriptionItem?.id,
        billing_interval: billingInterval,
      })
      .eq('id', organizationId)

    if (updateError) {
      console.error('Error updating organization billing interval:', updateError)
      throw updateError
    }

    console.log(`Successfully switched organization ${organizationId} to ${billingInterval} billing. New subscription: ${newSubscriptionId}`)
  } catch (error: any) {
    console.error('Error handling switch billing interval checkout:', error)
    throw error
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
    // Organization subscription - ensure subscription status and trial_ends_at are set
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (org) {
      const trialEndsAt = subscription.trial_end 
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null

      // Update all users in the organization with subscription status
      await supabase
        .from('users')
        .update({
          subscription_status: subscription.status === 'trialing' ? 'trialing' : 'active',
          trial_ends_at: trialEndsAt,
        })
        .eq('organization_id', org.id)
      
      // Send welcome email and trial notification if trial started (backup in case checkout handler didn't send)
      if (subscription.status === 'trialing') {
        try {
          const { sendWelcomeEmail, sendTrialStartNotification } = await import('@/lib/email/send')
          
          // Get the manager user (first user in org)
          const { data: managerUser } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('organization_id', org.id)
            .eq('role', 'manager')
            .limit(1)
            .single()
          
          if (managerUser?.email) {
            // Send welcome email to manager
            await sendWelcomeEmail(managerUser.email, managerUser.full_name || undefined)
            
            // Send trial start notification to admin
            await sendTrialStartNotification(
              managerUser.email,
              managerUser.full_name || 'User',
              planType || 'team',
              trialEndsAt
            )
          }
        } catch (error) {
          console.error('Error sending trial start emails in subscription.created:', error)
          // Don't throw - email sending shouldn't fail the webhook
        }
      }
    }
    return
  }

  // Individual subscription - grant credits
  const stripe = getStripeClient()
  if (!stripe) {
    console.error('Stripe is not configured')
    return
  }
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
    
    // Send welcome email and trial notification if trial started (backup in case checkout handler didn't send)
    if (subscription.status === 'trialing') {
      try {
        const { sendWelcomeEmail, sendTrialStartNotification } = await import('@/lib/email/send')
        
        const trialEndsAt = subscription.trial_end 
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null
        
        // Get user details for emails
        const { data: userData } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', userId)
          .single()
        
        const userEmail = userData?.email || (customer as Stripe.Customer).email
        if (userEmail) {
          // Send welcome email to user
          await sendWelcomeEmail(userEmail, userData?.full_name || undefined)
          
          // Send trial start notification to admin
          await sendTrialStartNotification(
            userEmail,
            userData?.full_name || 'User',
            'individual',
            trialEndsAt
          )
        }
      } catch (error) {
        console.error('Error sending trial start emails in subscription.created:', error)
        // Don't throw - email sending shouldn't fail the webhook
      }
    }
  }
}

/**
 * Handle subscription updated event
 * Updates seat counts, billing intervals, and plan tiers
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

      // Determine billing interval from subscription
      const billingInterval = subscription.interval === 'year' ? 'annual' : 'monthly'

      await supabase
        .from('organizations')
        .update({
          stripe_subscription_id: subscription.id,
          stripe_subscription_item_id: subscriptionItem?.id,
          seat_limit: quantity,
          billing_interval: billingInterval,
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
    const stripe = getStripeClient()
    if (!stripe) {
      console.error('Stripe is not configured')
      return
    }
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

  // Store invoice in database
  try {
    let organizationId: string | null = null
    let userId: string | null = null

    if (planType === 'team' || planType === 'starter') {
      // Organization payment - update subscription status for all users in organization
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (org) {
        organizationId = org.id
        await supabase
          .from('users')
          .update({
            subscription_status: 'active',
          })
          .eq('organization_id', org.id)
      }
    } else {
      // Individual payment - update subscription status
      const customer = await stripe!.customers.retrieve(customerId)
      userId = (customer as Stripe.Customer).metadata?.supabase_user_id

      if (userId) {
        await supabase
          .from('users')
          .update({
            subscription_status: 'active',
          })
          .eq('id', userId)
      }
    }

    // Store invoice in invoices table
    const { error: invoiceError } = await supabase
      .from('invoices')
      .upsert({
        stripe_invoice_id: invoice.id,
        stripe_customer_id: customerId,
        organization_id: organizationId,
        user_id: userId,
        amount_paid: invoice.amount_paid,
        currency: invoice.currency || 'usd',
        status: invoice.status || 'paid',
        invoice_pdf_url: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
        invoice_date: new Date(invoice.created * 1000).toISOString(),
        period_start: invoice.period_start
          ? new Date(invoice.period_start * 1000).toISOString()
          : null,
        period_end: invoice.period_end
          ? new Date(invoice.period_end * 1000).toISOString()
          : null,
      }, {
        onConflict: 'stripe_invoice_id',
      })

    if (invoiceError) {
      console.error('Error storing invoice:', invoiceError)
    }
  } catch (error) {
    console.error('Error in handleInvoicePaymentSucceeded:', error)
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

  const stripe = getStripeClient()
  if (!stripe) {
    console.error('Stripe is not configured')
    return
  }
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

