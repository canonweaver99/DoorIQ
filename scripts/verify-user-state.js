const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyUserState() {
  const email = 'canonweaver@loopline.design'
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  
  if (error || !user) {
    console.error('❌ User not found')
    return
  }
  
  console.log('📊 User State:')
  console.log(`   Email: ${user.email}`)
  console.log(`   Subscription ID: ${user.subscription_id || 'null'}`)
  console.log(`   Subscription Status: ${user.subscription_status || 'null'}`)
  console.log(`   Subscription Plan: ${user.subscription_plan || 'null'}`)
  console.log(`   Stripe Price ID: ${user.stripe_price_id || 'null'}`)
  console.log(`   Period End: ${user.subscription_current_period_end || 'null'}`)
  console.log(`   Stripe Customer ID: ${user.stripe_customer_id || 'null'}`)
  
  const isFresh = !user.subscription_id && !user.subscription_status && !user.subscription_plan
  console.log(`\n✅ Fresh State: ${isFresh ? 'YES' : 'NO'}`)
}

verifyUserState().catch(console.error)

