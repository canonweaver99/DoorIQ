const { createClient } = require('@supabase/supabase-js')
const Stripe = require('stripe')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const stripeSecret = process.env.STRIPE_SECRET_KEY

const supabase = createClient(supabaseUrl, supabaseKey)
const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' })

async function syncSubscription() {
  const email = 'canonweaver@loopline.design'
  
  console.log(`🔄 Syncing subscription for: ${email}\n`)
  
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
  
  if (!user.subscription_id) {
    console.error('❌ No subscription_id in database')
    return
  }
  
  console.log(`📝 Fetching subscription from Stripe: ${user.subscription_id}`)
  
  try {
    const subscription = await stripe.subscriptions.retrieve(user.subscription_id, {
      expand: ['items.data.price.product', 'default_payment_method']
    })
    
    console.log(`✅ Subscription found:`)
    console.log(`   Status: ${subscription.status}`)
    console.log(`   Current Period End: ${new Date(subscription.current_period_end * 1000).toLocaleString()}`)
    
    const price = subscription.items.data[0]?.price
    if (price) {
      console.log(`   Price ID: ${price.id}`)
      console.log(`   Amount: $${(price.unit_amount / 100).toFixed(2)}`)
      console.log(`   Interval: ${price.recurring.interval}`)
    }
    
    // Determine plan name
    const planName = price?.id?.includes('yearly') ? 'individual' : 'individual'
    
    // Update database
    console.log('\n📝 Updating database...')
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: subscription.status,
        subscription_id: subscription.id,
        subscription_plan: planName,
        stripe_price_id: price?.id,
        subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('id', user.id)
    
    if (updateError) {
      console.error('❌ Error updating database:', updateError)
      return
    }
    
    console.log('✅ Database updated successfully!')
    console.log('\n🎉 Subscription synced!')
    console.log(`   Status: ${subscription.status}`)
    console.log(`   Plan: ${planName}`)
    
  } catch (error) {
    console.error('❌ Error fetching subscription:', error.message)
    
    // If subscription doesn't exist, check for other subscriptions
    if (error.code === 'resource_missing') {
      console.log('\n⚠️  Subscription not found, checking for other subscriptions...')
      
      if (user.stripe_customer_id) {
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripe_customer_id,
          status: 'all',
          limit: 10
        })
        
        if (subscriptions.data.length > 0) {
          const activeSub = subscriptions.data.find(s => s.status === 'active' || s.status === 'trialing')
          if (activeSub) {
            console.log(`✅ Found active subscription: ${activeSub.id}`)
            console.log('   Updating database with this subscription...')
            
            const price = activeSub.items.data[0]?.price
            const planName = 'individual'
            
            const { error: updateError } = await supabase
              .from('users')
              .update({
                subscription_status: activeSub.status,
                subscription_id: activeSub.id,
                subscription_plan: planName,
                stripe_price_id: price?.id,
                subscription_current_period_end: new Date(activeSub.current_period_end * 1000).toISOString()
              })
              .eq('id', user.id)
            
            if (updateError) {
              console.error('❌ Error updating database:', updateError)
            } else {
              console.log('✅ Database updated with active subscription!')
            }
          }
        }
      }
    }
  }
}

syncSubscription().catch(console.error)

