const { createClient } = require('@supabase/supabase-js')
const Stripe = require('stripe')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const stripeSecret = process.env.STRIPE_SECRET_KEY

const supabase = createClient(supabaseUrl, supabaseKey)
const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' })

async function resetUserToFresh() {
  const email = 'canonweaver@loopline.design'
  
  console.log(`🔄 Resetting user to fresh state: ${email}\n`)
  
  // Get user from database
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  
  if (userError || !user) {
    console.error('❌ User not found:', userError)
    process.exit(1)
  }
  
  console.log(`✅ Found user: ${user.id} (${user.email})\n`)
  
  // Cancel/delete all Stripe subscriptions
  if (user.stripe_customer_id) {
    console.log('📝 Checking Stripe subscriptions...')
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripe_customer_id,
        status: 'all',
        limit: 100
      })
      
      console.log(`   Found ${subscriptions.data.length} subscription(s)`)
      
      for (const sub of subscriptions.data) {
        if (sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due') {
          console.log(`   Canceling subscription: ${sub.id} (${sub.status})`)
          try {
            await stripe.subscriptions.cancel(sub.id)
            console.log(`   ✅ Canceled subscription: ${sub.id}`)
          } catch (cancelError) {
            // If cancel fails, try to delete it
            try {
              await stripe.subscriptions.delete(sub.id)
              console.log(`   ✅ Deleted subscription: ${sub.id}`)
            } catch (deleteError) {
              console.error(`   ❌ Failed to cancel/delete subscription ${sub.id}:`, deleteError.message)
            }
          }
        } else {
          console.log(`   ⏭️  Skipping subscription: ${sub.id} (${sub.status})`)
        }
      }
    } catch (error) {
      console.error('⚠️  Error managing Stripe subscriptions:', error.message)
    }
  }
  
  // Reset user in database
  console.log('\n📝 Resetting user data in database...')
  const { error: updateError } = await supabase
    .from('users')
    .update({
      subscription_id: null,
      subscription_status: null,
      subscription_plan: null,
      stripe_price_id: null,
      subscription_current_period_end: null,
      // Keep stripe_customer_id in case they want to subscribe again
      // stripe_customer_id: null,  // Uncomment if you want to remove customer ID too
    })
    .eq('id', user.id)
  
  if (updateError) {
    console.error('❌ Error updating user:', updateError)
    process.exit(1)
  }
  
  console.log('✅ User data reset successfully!')
  
  // Summary
  console.log('\n🎉 User reset complete!')
  console.log('\n📊 Fresh State Summary:')
  console.log(`   Email: ${user.email}`)
  console.log(`   Subscription: None`)
  console.log(`   Plan: Free`)
  console.log(`   Stripe Customer ID: ${user.stripe_customer_id || 'None'}`)
  console.log('\n✅ User is now in a fresh state and can test signup/subscription flow!')
}

resetUserToFresh().catch(console.error)

