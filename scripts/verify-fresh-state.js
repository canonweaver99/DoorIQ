const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyFreshState() {
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
  
  console.log('📊 User State Verification:\n')
  console.log(`   Email: ${user.email}`)
  console.log(`   Subscription ID: ${user.subscription_id || 'null ✅'}`)
  console.log(`   Subscription Status: ${user.subscription_status || 'null ✅'}`)
  console.log(`   Subscription Plan: ${user.subscription_plan || 'null ✅'}`)
  console.log(`   Team ID: ${user.team_id || 'null ✅ (Individual user)'}`)
  console.log(`   Virtual Earnings: $${user.virtual_earnings || 0}`)
  console.log(`   Role: ${user.role || 'rep'}`)
  
  const isFresh = !user.subscription_id && 
                  !user.subscription_status && 
                  !user.subscription_plan && 
                  !user.team_id &&
                  (user.virtual_earnings === 0 || user.virtual_earnings === null)
  
  console.log(`\n✅ Fresh State: ${isFresh ? 'YES ✓' : 'NO ✗'}`)
  
  if (isFresh) {
    console.log('\n🎉 User is ready for testing as a new individual user!')
    console.log('   - Leaderboard will NOT appear in navigation')
    console.log('   - No subscription access')
    console.log('   - Clean slate for testing')
  }
}

verifyFreshState().catch(console.error)

