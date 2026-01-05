const { createClient } = require('@supabase/supabase-js')
const Stripe = require('stripe')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const stripeSecret = process.env.STRIPE_SECRET_KEY
const monthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

if (!stripeSecret) {
  console.error('❌ Missing STRIPE_SECRET_KEY')
  process.exit(1)
}

if (!monthlyPriceId) {
  console.error('❌ Missing NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL_MONTHLY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' })

async function setupSubscription() {
  const email = 'canonweaver@loopline.design'
  
  console.log(`🔍 Looking up user: ${email}`)
  
  // Get user from Supabase
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  
  if (userError || !user) {
    console.error('❌ User not found:', userError)
    process.exit(1)
  }
  
  console.log(`✅ Found user: ${user.id} (${user.email})`)
  
  // Get or create Stripe customer
  let customerId = user.stripe_customer_id
  
  if (!customerId) {
    console.log('📝 Creating Stripe customer...')
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.full_name,
      metadata: {
        supabase_user_id: user.id
      }
    })
    customerId = customer.id
    console.log(`✅ Created customer: ${customerId}`)
  } else {
    console.log(`✅ Using existing customer: ${customerId}`)
  }
  
  // Check if user already has an active subscription
  if (user.subscription_id) {
    try {
      const existingSub = await stripe.subscriptions.retrieve(user.subscription_id)
      if (existingSub.status === 'active' || existingSub.status === 'trialing') {
        console.log(`✅ User already has an active subscription: ${existingSub.id}`)
        console.log(`   Status: ${existingSub.status}`)
        console.log(`   Plan: ${existingSub.items.data[0]?.price.id}`)
        return
      }
    } catch (e) {
      console.log('ℹ️  Existing subscription not found in Stripe, creating new one...')
    }
  }
  
  // Create a test payment method
  console.log('📝 Creating test payment method...')
  const paymentMethod = await stripe.paymentMethods.create({
    type: 'card',
    card: {
      number: '4242 4242 4242 4242',
      exp_month: 12,
      exp_year: 2025,
      cvc: '123',
    },
  })
  
  // Attach payment method to customer
  await stripe.paymentMethods.attach(paymentMethod.id, {
    customer: customerId,
  })
  
  // Set as default payment method
  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethod.id,
    },
  })
  
  console.log('✅ Payment method attached')
  
  // Create subscription
  console.log('📝 Creating subscription...')
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: monthlyPriceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    metadata: {
      supabase_user_id: user.id
    }
  })
  
  // Immediately pay the invoice to activate
  if (subscription.latest_invoice?.payment_intent) {
    const paymentIntent = subscription.latest_invoice.payment_intent
    if (paymentIntent.status !== 'succeeded') {
      await stripe.paymentIntents.confirm(paymentIntent.id)
    }
  }
  
  // Retrieve the updated subscription
  const updatedSubscription = await stripe.subscriptions.retrieve(subscription.id)
  
  console.log(`✅ Created subscription: ${updatedSubscription.id}`)
  console.log(`   Status: ${updatedSubscription.status}`)
  
  // Update user in database
  const { error: updateError } = await supabase
    .from('users')
    .update({
      stripe_customer_id: customerId,
      subscription_id: updatedSubscription.id,
      subscription_status: updatedSubscription.status,
      subscription_plan: 'individual',
      stripe_price_id: monthlyPriceId,
      subscription_current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', user.id)
  
  if (updateError) {
    console.error('❌ Error updating user:', updateError)
    process.exit(1)
  }
  
  console.log('✅ User updated in database')
  console.log('\n🎉 Subscription setup complete!')
  console.log(`   User: ${user.email}`)
  console.log(`   Subscription ID: ${updatedSubscription.id}`)
  console.log(`   Status: ${updatedSubscription.status}`)
  console.log(`   Plan: Individual (Monthly)`)
}

setupSubscription().catch(console.error)

