#!/usr/bin/env node

/**
 * Fix session close detection by applying fallback logic and updating database
 * Usage: node scripts/fix-session-close.js [sessionId]
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

function detectCloseAttempts(transcript) {
  const closePatterns = [
    /just get you signed up/i,
    /get you signed up/i,
    /sign you up/i,
    /get you set up/i,
    /just need your/i,
    /need your name/i,
    /need your phone/i,
    /can get you started/i,
    /ready to get started/i,
    /let's do this/i,
    /let's do it/i,
    /I can get you/i,
    /I'll get you/i
  ]
  
  let count = 0
  transcript.forEach(entry => {
    const text = (entry.text || '').toLowerCase()
    if (closePatterns.some(pattern => pattern.test(text))) {
      count++
    }
  })
  return count
}

function detectBuyingSignals(transcript) {
  const buyingSignals = [
    "let's go ahead and do it",
    "let's do it",
    "go ahead",
    "sounds good",
    "that works",
    "i'm ready",
    "let's go",
    "sure",
    "alright",
    "okay",
    "yes"
  ]
  
  const transcriptText = transcript.map(t => (t.text || '').toLowerCase()).join(' ')
  return buyingSignals.some(signal => transcriptText.includes(signal))
}

function detectInfoCollection(transcript) {
  const infoPatterns = [
    /my (name|phone|number|email|address) is/i,
    /call me/i,
    /I'm [A-Z]/i,
    /my number is/i,
    /tomorrow at/i,
    /tomorrow works/i,
    /[0-9]{3}.*[0-9]{3}.*[0-9]{4}/i, // Phone number pattern
    /@.*\.(com|net|org)/i // Email pattern
  ]
  
  const transcriptText = transcript.map(t => (t.text || '').toLowerCase()).join(' ')
  return infoPatterns.some(pattern => pattern.test(transcriptText))
}

function detectRepAskingForInfo(transcript) {
  const repPatterns = [
    /(just )?need your (name|phone|number|email|address)/i,
    /what's your (name|phone|number|email|address)/i,
    /what is your (name|phone|number|email|address)/i,
    /can get you signed up/i,
    /get you signed up/i,
    /get you set up/i
  ]
  
  const transcriptText = transcript.map(t => (t.text || '').toLowerCase()).join(' ')
  return repPatterns.some(pattern => pattern.test(transcriptText))
}

function detectSpouseApproval(transcript) {
  const spousePattern = /(spouse|wife|husband|partner).*(said|okay|ok|fine|good).*(let's|go ahead|do it|sounds good)/i
  const transcriptText = transcript.map(t => (t.text || '').toLowerCase()).join(' ')
  return spousePattern.test(transcriptText)
}

async function fixSession(sessionId) {
  console.log('\n🔧 FIXING SESSION CLOSE DETECTION')
  console.log('='.repeat(60))
  console.log(`Session ID: ${sessionId}\n`)

  // Fetch session
  const { data: session, error: fetchError } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (fetchError || !session) {
    console.error('❌ Session not found:', fetchError?.message)
    process.exit(1)
  }

  console.log('📋 Current Status:')
  console.log(`  Sale Closed: ${session.sale_closed ? 'YES' : 'NO'}`)
  console.log(`  Virtual Earnings: $${session.virtual_earnings || 0}`)
  console.log(`  Close Score: ${session.close_score || 'NULL'}`)
  console.log('')

  if (!session.full_transcript || session.full_transcript.length === 0) {
    console.error('❌ No transcript found')
    process.exit(1)
  }

  const transcript = session.full_transcript
  const closeAttempts = detectCloseAttempts(transcript)
  const hasBuyingSignal = detectBuyingSignals(transcript)
  const hasInfoCollection = detectInfoCollection(transcript)
  const repAskedForInfo = detectRepAskingForInfo(transcript)
  const hasSpouseApproval = detectSpouseApproval(transcript)

  console.log('🔍 Detection Results:')
  console.log(`  Close Attempts: ${closeAttempts}`)
  console.log(`  Buying Signals: ${hasBuyingSignal ? 'YES' : 'NO'}`)
  console.log(`  Info Collection: ${hasInfoCollection ? 'YES' : 'NO'}`)
  console.log(`  Rep Asked for Info: ${repAskedForInfo ? 'YES' : 'NO'}`)
  console.log(`  Spouse Approval: ${hasSpouseApproval ? 'YES' : 'NO'}`)
  console.log('')

  // Apply fallback detection
  const shouldBeClosed = (closeAttempts > 0 || hasBuyingSignal || repAskedForInfo) && 
                         (hasInfoCollection || hasSpouseApproval)

  if (!shouldBeClosed && session.sale_closed) {
    console.log('ℹ️  Sale is already marked as closed')
    return
  }

  if (!shouldBeClosed && !session.sale_closed) {
    console.log('ℹ️  Fallback detection: Sale should NOT be marked as closed')
    console.log('   (Not enough evidence of close + info collection)')
    return
  }

  if (shouldBeClosed && session.sale_closed) {
    console.log('✅ Sale is already correctly marked as closed')
    if (session.virtual_earnings === 0) {
      console.log('⚠️  But earnings are $0 - fixing earnings...')
    } else if (!session.ended_at) {
      console.log('⚠️  But ended_at is not set - setting it to trigger earnings update...')
    } else {
      console.log('✅ All good - sale closed, earnings set, and ended_at is set')
      return
    }
  }

  console.log('🔧 Applying fix...\n')

  // Calculate earnings if needed
  let virtualEarnings = session.virtual_earnings || 0
  let earningsData = session.earnings_data || {}
  
  if (shouldBeClosed && virtualEarnings === 0) {
    // Extract price from transcript or use default
    const transcriptText = transcript.map(t => t.text || '').join(' ')
    const priceMatch = transcriptText.match(/\$(\d+)/)
    const basePrice = priceMatch ? parseInt(priceMatch[1]) : 1000
    
    virtualEarnings = basePrice
    earningsData = {
      base_amount: basePrice,
      closed_amount: basePrice,
      total_earned: basePrice
    }
    
    console.log(`💰 Calculated earnings: $${virtualEarnings}`)
  }

  // Update session
  // Set ended_at if not set (required for trigger to fire)
  const endedAt = session.ended_at || session.started_at || new Date().toISOString()
  
  const updateData = {
    sale_closed: shouldBeClosed,
    virtual_earnings: virtualEarnings,
    earnings_data: earningsData,
    close_score: shouldBeClosed ? Math.max(session.close_score || 0, 90) : session.close_score,
    ended_at: endedAt // Set ended_at to trigger earnings update
  }

  const { data: updatedSession, error: updateError } = await supabase
    .from('live_sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select('sale_closed, virtual_earnings, close_score, earnings_data')
    .single()

  if (updateError) {
    console.error('❌ Error updating session:', updateError.message)
    process.exit(1)
  }

  console.log('✅ Session updated successfully!')
  console.log('\n📊 Updated Status:')
  console.log(`  Sale Closed: ${updatedSession.sale_closed ? '✅ YES' : '❌ NO'}`)
  console.log(`  Virtual Earnings: $${updatedSession.virtual_earnings || 0}`)
  console.log(`  Close Score: ${updatedSession.close_score || 'NULL'}`)
  
  if (updatedSession.earnings_data) {
    console.log('\n💰 Earnings Breakdown:')
    console.log(`  Total Earned: $${updatedSession.earnings_data.total_earned || 0}`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Fix applied! Earnings should now be reflected in your account.')
}

const sessionId = process.argv[2] || '0febad42-5e9c-4e28-920c-30b6b46a2029'
fixSession(sessionId).catch(console.error)
