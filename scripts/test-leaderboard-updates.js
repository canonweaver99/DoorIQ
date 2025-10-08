#!/usr/bin/env node

/**
 * Test Script: Leaderboard Real-Time Updates
 * 
 * This script tests that the leaderboard updates automatically when users gain cash.
 * 
 * Usage:
 *   node scripts/test-leaderboard-updates.js
 * 
 * What it does:
 * 1. Finds a test user
 * 2. Creates a test session with virtual earnings
 * 3. Triggers grading to award earnings
 * 4. Verifies the user's total earnings increased
 * 5. Checks that the leaderboard reflects the change
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function testLeaderboardUpdates() {
  console.log('🧪 Testing Leaderboard Real-Time Updates\n')

  try {
    // 1. Find a test user (rep)
    console.log('1️⃣  Finding test user...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'rep')
      .limit(1)

    if (usersError) throw usersError
    if (!users || users.length === 0) {
      console.error('❌ No rep users found. Create a user first.')
      process.exit(1)
    }

    const testUser = users[0]
    const initialEarnings = testUser.virtual_earnings || 0
    console.log(`✅ Found user: ${testUser.full_name} (${testUser.email})`)
    console.log(`   Current earnings: $${initialEarnings.toFixed(2)}`)

    // 2. Create a test session
    console.log('\n2️⃣  Creating test session...')
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .insert({
        user_id: testUser.id,
        agent_name: 'Test Agent',
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        duration_seconds: 120,
        full_transcript: [
          { speaker: 'user', text: 'Hi, I\'m here to talk about pest control.', timestamp: new Date().toISOString() },
          { speaker: 'homeowner', text: 'Sure, tell me more.', timestamp: new Date().toISOString() },
          { speaker: 'user', text: 'Our service is $99 per month.', timestamp: new Date().toISOString() },
          { speaker: 'homeowner', text: 'That sounds great! Let\'s do it.', timestamp: new Date().toISOString() }
        ]
      })
      .select()
      .single()

    if (sessionError) throw sessionError
    console.log(`✅ Created session: ${session.id}`)

    // 3. Award test earnings (simulating grading)
    console.log('\n3️⃣  Awarding virtual earnings...')
    const testEarnings = 99.00
    
    const { error: updateError } = await supabase
      .from('live_sessions')
      .update({
        virtual_earnings: testEarnings,
        sale_closed: true,
        overall_score: 85
      })
      .eq('id', session.id)

    if (updateError) throw updateError
    console.log(`✅ Awarded $${testEarnings.toFixed(2)} to session`)

    // 4. Wait a moment for trigger to execute
    console.log('\n4️⃣  Waiting for database trigger to update user earnings...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 5. Verify user earnings increased
    console.log('\n5️⃣  Verifying user earnings...')
    const { data: updatedUser, error: fetchError } = await supabase
      .from('users')
      .select('virtual_earnings')
      .eq('id', testUser.id)
      .single()

    if (fetchError) throw fetchError

    const newEarnings = updatedUser.virtual_earnings || 0
    const expectedEarnings = initialEarnings + testEarnings

    console.log(`   Initial earnings: $${initialEarnings.toFixed(2)}`)
    console.log(`   Test earnings:    $${testEarnings.toFixed(2)}`)
    console.log(`   Expected total:   $${expectedEarnings.toFixed(2)}`)
    console.log(`   Actual total:     $${newEarnings.toFixed(2)}`)

    if (Math.abs(newEarnings - expectedEarnings) < 0.01) {
      console.log('✅ Earnings updated correctly!')
    } else {
      console.error('❌ Earnings mismatch! Trigger may not be working.')
      process.exit(1)
    }

    // 6. Verify leaderboard query
    console.log('\n6️⃣  Checking leaderboard rankings...')
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('users')
      .select('full_name, email, virtual_earnings')
      .eq('role', 'rep')
      .order('virtual_earnings', { ascending: false })
      .limit(5)

    if (leaderboardError) throw leaderboardError

    console.log('\n📊 Top 5 Leaderboard:')
    leaderboard.forEach((user, index) => {
      const highlight = user.email === testUser.email ? ' 👈 (test user)' : ''
      console.log(`   ${index + 1}. ${user.full_name} - $${(user.virtual_earnings || 0).toFixed(2)}${highlight}`)
    })

    console.log('\n✅ All tests passed!')
    console.log('\n📝 What to test next:')
    console.log('   1. Open the leaderboard page in your browser')
    console.log('   2. Run this script again to add more earnings')
    console.log('   3. Watch the leaderboard update in real-time without refreshing!')
    console.log('   4. Try the manual refresh button')
    console.log('   5. Switch between timeframes (week/month/all)')

    // Cleanup option
    console.log('\n🧹 Cleanup:')
    console.log(`   To remove test session: DELETE FROM live_sessions WHERE id = '${session.id}';`)
    console.log(`   To reset user earnings: UPDATE users SET virtual_earnings = ${initialEarnings} WHERE id = '${testUser.id}';`)

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error('Full error:', error)
    process.exit(1)
  }
}

// Run the test
testLeaderboardUpdates()
