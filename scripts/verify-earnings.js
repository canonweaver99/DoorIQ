#!/usr/bin/env node

/**
 * Verify earnings were added to user account
 * Usage: node scripts/verify-earnings.js [sessionId]
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyEarnings(sessionId) {
  console.log('\n💰 VERIFYING EARNINGS')
  console.log('='.repeat(60))
  console.log(`Session ID: ${sessionId}\n`)

  // Fetch session
  const { data: session, error: sessionError } = await supabase
    .from('live_sessions')
    .select('user_id, sale_closed, virtual_earnings, earnings_data, ended_at')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    console.error('❌ Session not found:', sessionError?.message)
    process.exit(1)
  }

  console.log('📋 Session Status:')
  console.log(`  Sale Closed: ${session.sale_closed ? '✅ YES' : '❌ NO'}`)
  console.log(`  Virtual Earnings: $${session.virtual_earnings || 0}`)
  console.log(`  Ended At: ${session.ended_at || 'NULL'}`)
  console.log('')

  if (!session.user_id) {
    console.log('⚠️  No user_id - cannot verify user earnings')
    return
  }

  // Fetch user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name, virtual_earnings')
    .eq('id', session.user_id)
    .single()

  if (userError || !user) {
    console.error('❌ User not found:', userError?.message)
    process.exit(1)
  }

  console.log('👤 User Account:')
  console.log(`  Name: ${user.full_name || 'N/A'}`)
  console.log(`  Email: ${user.email || 'N/A'}`)
  console.log(`  Total Virtual Earnings: $${user.virtual_earnings || 0}`)
  console.log('')

  // Check if trigger should have fired
  if (session.sale_closed && session.virtual_earnings > 0 && session.ended_at) {
    console.log('✅ Conditions met for earnings trigger:')
    console.log('  ✓ Sale closed')
    console.log('  ✓ Virtual earnings > 0')
    console.log('  ✓ Session ended')
    console.log('')
    console.log('💡 The database trigger should have added $' + session.virtual_earnings + ' to user account')
    console.log('')
    
    // Check if we need to manually trigger
    const expectedEarnings = (user.virtual_earnings || 0)
    if (expectedEarnings >= session.virtual_earnings) {
      console.log('✅ User earnings look correct!')
    } else {
      console.log('⚠️  User earnings may not have been updated by trigger')
      console.log('   This can happen if:')
      console.log('   - Trigger hasn\'t fired yet')
      console.log('   - Session was updated after it ended')
      console.log('   - Trigger needs to be manually triggered')
    }
  } else {
    console.log('ℹ️  Conditions not met for earnings trigger:')
    if (!session.sale_closed) console.log('  ✗ Sale not closed')
    if (session.virtual_earnings === 0) console.log('  ✗ Virtual earnings is 0')
    if (!session.ended_at) console.log('  ✗ Session not ended')
  }

  console.log('\n' + '='.repeat(60))
}

const sessionId = process.argv[2] || '0febad42-5e9c-4e28-920c-30b6b46a2029'
verifyEarnings(sessionId).catch(console.error)
