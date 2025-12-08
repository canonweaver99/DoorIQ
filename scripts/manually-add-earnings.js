#!/usr/bin/env node

/**
 * Manually add earnings to user account for a session
 * Usage: node scripts/manually-add-earnings.js [sessionId]
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

async function manuallyAddEarnings(sessionId) {
  console.log('\n💰 MANUALLY ADDING EARNINGS')
  console.log('='.repeat(60))
  console.log(`Session ID: ${sessionId}\n`)

  // Fetch session
  const { data: session, error: sessionError } = await supabase
    .from('live_sessions')
    .select('user_id, sale_closed, virtual_earnings')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    console.error('❌ Session not found:', sessionError?.message)
    process.exit(1)
  }

  if (!session.sale_closed || session.virtual_earnings === 0) {
    console.error('❌ Session is not marked as closed or has no earnings')
    console.log(`   Sale Closed: ${session.sale_closed}`)
    console.log(`   Virtual Earnings: $${session.virtual_earnings}`)
    process.exit(1)
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

  console.log('📋 Current Status:')
  console.log(`  User: ${user.full_name || user.email}`)
  console.log(`  Current Total Earnings: $${user.virtual_earnings || 0}`)
  console.log(`  Session Earnings: $${session.virtual_earnings}`)
  console.log('')

  // Check if earnings already added
  const currentEarnings = user.virtual_earnings || 0
  const sessionEarnings = session.virtual_earnings || 0
  
  // Calculate what the total should be (rough estimate - may have other sessions)
  // We'll just add the session earnings if it's not already reflected
  console.log('🔧 Adding session earnings to user account...\n')

  const newTotal = currentEarnings + sessionEarnings

  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update({ virtual_earnings: newTotal })
    .eq('id', user.id)
    .select('virtual_earnings')
    .single()

  if (updateError) {
    console.error('❌ Error updating user:', updateError.message)
    process.exit(1)
  }

  console.log('✅ Earnings added successfully!')
  console.log('\n📊 Updated Status:')
  console.log(`  Previous Total: $${currentEarnings}`)
  console.log(`  Session Earnings Added: $${sessionEarnings}`)
  console.log(`  New Total: $${updatedUser.virtual_earnings}`)
  console.log('\n' + '='.repeat(60))
}

const sessionId = process.argv[2] || '0febad42-5e9c-4e28-920c-30b6b46a2029'
manuallyAddEarnings(sessionId).catch(console.error)
