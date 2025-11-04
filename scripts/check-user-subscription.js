const { createClient } = require('@supabase/supabase-js')
const Stripe = require('stripe')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const stripeSecret = process.env.STRIPE_SECRET_KEY

const supabase = createClient(supabaseUrl, supabaseKey)
const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' })

async function checkSubscription() {
  const email = 'canonweaver@loopline.design'
  
  console.log(`🔍 Checking subscription for: ${email}\n`)
  
  // Get user from database
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  
  if (userError || !user) {
    console.error('❌ User not found:', userError)
    return
  }
  
  console.log('📊 Database Status:')
  console.log(`   Subscription ID: ${user.subscription_id || 'null'}`)
  console.log(`   Subscription Status: ${user.subscription_status || 'null'}`)
  console.log(`   Subscription Plan: ${user.subscription_plan || 'null'}`)
  console.log(`   Stripe Customer ID: ${user.stripe_customer_id || 'null'}`)
  console.log(`   Stripe Price ID: ${user.stripe_price_id || 'null'}`)
  console.log(`   Period End: ${user.subscription_current_period_end || 'null'}\n`)
  
  // Check Stripe
  if (user.stripe_customer_id) {
    console.log('📊 Stripe Customer:')
    try {
      const customer = await stripe.customers.retrieve(user.stripe_customer_id)
      console.log(`   Customer ID: ${customer.id}`)
      console.log(`   Email: ${customer.email}`)
      
      // Get subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 10
      })
      
      console.log(`   Active Subscriptions: ${subscriptions.data.length}\n`)
      
      if (subscriptions.data.length > 0) {
        for (const sub of subscriptions.data) {
          console.log(`   Subscription: ${sub.id}`)
          console.log(`     Status: ${sub.status}`)
          console.log(`     Current Period End: ${new Date(sub.current_period_end * 1000).toLocaleString()}`)
          console.log(`     Cancel at Period End: ${sub.cancel_at_period_end}`)
          if (sub.items.data.length > 0) {
            const price = sub.items.data[0].price
            console.log(`     Price ID: ${price.id}`)
            console.log(`     Amount: $${(price.unit_amount / 100).toFixed(2)}`)
            console.log(`     Interval: ${price.recurring.interval}`)
          }
          console.log('')
        }
      }
    } catch (e) {
      console.error('❌ Error fetching Stripe customer:', e.message)
    }
  }
  
  // Sync recommendation
  if (!user.subscription_id && user.stripe_customer_id) {
    console.log('⚠️  Database missing subscription_id, but customer exists in Stripe')
    console.log('   Recommendation: Run sync script to update database\n')
  }
}

checkSubscription().catch(console.error)

