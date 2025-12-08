#!/usr/bin/env node

/**
 * Analyze session for close detection issues
 * Usage: node scripts/analyze-session-close.js [sessionId]
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Load from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Close patterns from enhancedPatternAnalyzer.ts
const CLOSE_PATTERNS = {
  soft: [
    /would you like to/i,
    /shall we/i,
    /can we schedule/i,
    /does.*sound good/i,
    /how.*feel about/i,
    /what do you think/i
  ],
  hard: [
    /let's get you started/i,
    /I'll set you up/i,
    /here's what we'll do/i,
    /I'm going to/i,
    /we're going to/i,
    /what is your name/i,
    /what's your name/i,
    /what is your phone number/i,
    /what's your phone/i,
    /what is your email/i,
    /what's your email/i,
    /what is a good address/i,
    /what's a good address/i,
    /what is your house number/i,
    /what's your house number/i,
    /anything else.*special notes/i,
    /special notes/i,
    /are you using a credit/i,
    /are you using a debit/i,
    /credit or debit/i,
    /payment method/i,
    /how would you like to pay/i
  ],
  assumptive: [
    /when we start/i,
    /your first treatment/i,
    /once you're enrolled/i,
    /after we begin/i,
    /during your service/i
  ],
  urgency: [
    /today only/i,
    /limited time/i,
    /special pricing/i,
    /this week/i,
    /expires/i,
    /last chance/i,
    /while I'm here/i,
    /best time to service/i,
    /best time to treat/i,
    /bug activity.*going to get worse/i,
    /never have a bug issue/i
  ],
  option: [
    /do you want.*front yard.*back yard/i,
    /front yard or back yard/i,
    /would you like.*park.*front.*driveway/i,
    /park out front.*driveway/i,
    /does morning.*evening work/i,
    /morning or evening/i,
    /would you prefer/i,
    /do you want.*or/i,
    /which.*would you/i
  ],
  responsibility: [
    /can you make sure.*dog away/i
  ]
}

function detectCloseAttempt(text) {
  for (const [type, patterns] of Object.entries(CLOSE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return { type, matched: pattern.toString() }
      }
    }
  }
  return null
}

function detectBuyingSignals(text) {
  const buyingPatterns = [
    /sounds good/i,
    /that works/i,
    /I'm interested/i,
    /let's do it/i,
    /I'll take it/i,
    /count me in/i,
    /I'm ready/i,
    /when can you start/i,
    /what's next/i,
    /how do I sign up/i,
    /that makes sense/i,
    /I like that/i,
    /we need that/i,
    /definitely need/i,
    /yes/i,
    /okay/i,
    /go ahead/i,
    /let's go/i,
    /sure/i,
    /alright/i,
    /fine/i,
    /I agree/i,
    /that's fine/i,
    /works for me/i,
    /I'm good with that/i
  ]
  
  for (const pattern of buyingPatterns) {
    if (pattern.test(text)) {
      return true
    }
  }
  return false
}

function detectInfoCollection(text) {
  const infoPatterns = [
    /my name is/i,
    /I'm [A-Z]/i,
    /call me/i,
    /my phone is/i,
    /my number is/i,
    /my email is/i,
    /my address is/i,
    /I live at/i,
    /credit card/i,
    /debit card/i,
    /I'll pay/i
  ]
  
  return infoPatterns.some(pattern => pattern.test(text))
}

async function analyzeSession(sessionId) {
  console.log('\n🔍 SESSION CLOSE DETECTION ANALYSIS')
  console.log('='.repeat(60))
  console.log(`Session ID: ${sessionId}\n`)

  // Fetch session
  const { data: session, error } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error || !session) {
    console.error('❌ Session not found:', error?.message)
    process.exit(1)
  }

  console.log('📋 SESSION STATUS')
  console.log('-'.repeat(60))
  console.log('Sale Closed:', session.sale_closed ? '✅ YES' : '❌ NO')
  console.log('Virtual Earnings:', session.virtual_earnings ? `$${session.virtual_earnings}` : '$0.00')
  console.log('Close Score:', session.close_score || 'NULL')
  console.log('Close Attempts (instant_metrics):', session.instant_metrics?.closeAttempts || 0)
  console.log('')

  if (!session.full_transcript || session.full_transcript.length === 0) {
    console.error('❌ No transcript found')
    process.exit(1)
  }

  const transcript = session.full_transcript
  console.log(`📝 TRANSCRIPT ANALYSIS (${transcript.length} lines)`)
  console.log('-'.repeat(60))

  // Analyze transcript for close attempts
  const closeAttempts = []
  const buyingSignals = []
  const infoCollection = []
  const repEntries = []
  const homeownerEntries = []

  transcript.forEach((entry, index) => {
    const text = entry.text || ''
    const speaker = entry.speaker || ''
    
    if (speaker === 'user' || speaker === 'rep') {
      repEntries.push({ index, text, timestamp: entry.timestamp })
      const closeMatch = detectCloseAttempt(text)
      if (closeMatch) {
        closeAttempts.push({ index, text, type: closeMatch.type, matched: closeMatch.matched })
      }
    } else if (speaker === 'homeowner' || speaker === 'agent') {
      homeownerEntries.push({ index, text, timestamp: entry.timestamp })
      if (detectBuyingSignals(text)) {
        buyingSignals.push({ index, text })
      }
      if (detectInfoCollection(text)) {
        infoCollection.push({ index, text })
      }
    }
  })

  console.log(`\n🎯 CLOSE ATTEMPTS DETECTED: ${closeAttempts.length}`)
  if (closeAttempts.length > 0) {
    closeAttempts.forEach((attempt, i) => {
      console.log(`\n  ${i + 1}. [Line ${attempt.index}] Type: ${attempt.type}`)
      console.log(`     Text: "${attempt.text.substring(0, 100)}${attempt.text.length > 100 ? '...' : ''}"`)
      console.log(`     Pattern: ${attempt.matched}`)
    })
  } else {
    console.log('  ❌ NO CLOSE ATTEMPTS DETECTED BY PATTERN MATCHING')
    console.log('\n  Looking for close-like phrases in rep entries...')
    
    // Look for potential close phrases that didn't match
    repEntries.forEach((entry, i) => {
      const lowerText = entry.text.toLowerCase()
      const potentialCloseWords = [
        'ready', 'start', 'begin', 'schedule', 'set up', 'install', 
        'sign up', 'enroll', 'move forward', 'proceed', 'interested',
        'want', 'like', 'take', 'get started'
      ]
      
      if (potentialCloseWords.some(word => lowerText.includes(word))) {
        console.log(`\n  Potential close (not matched): [Line ${entry.index}]`)
        console.log(`    "${entry.text.substring(0, 100)}${entry.text.length > 100 ? '...' : ''}"`)
      }
    })
  }

  console.log(`\n💰 BUYING SIGNALS FROM CUSTOMER: ${buyingSignals.length}`)
  if (buyingSignals.length > 0) {
    buyingSignals.forEach((signal, i) => {
      console.log(`\n  ${i + 1}. [Line ${signal.index}]`)
      console.log(`     "${signal.text.substring(0, 100)}${signal.text.length > 100 ? '...' : ''}"`)
    })
  }

  console.log(`\n📋 INFORMATION COLLECTION: ${infoCollection.length}`)
  if (infoCollection.length > 0) {
    infoCollection.forEach((info, i) => {
      console.log(`\n  ${i + 1}. [Line ${info.index}]`)
      console.log(`     "${info.text.substring(0, 100)}${info.text.length > 100 ? '...' : ''}"`)
    })
  }

  // Check for objections
  const objectionCount = session.instant_metrics?.objectionCount || 0
  console.log(`\n🛡️  OBJECTIONS: ${objectionCount}`)

  // Analyze last portion of conversation
  console.log(`\n📊 CONVERSATION END ANALYSIS`)
  console.log('-'.repeat(60))
  const last10 = transcript.slice(-10)
  console.log('\nLast 10 lines of conversation:')
  last10.forEach((entry, i) => {
    const speaker = entry.speaker === 'user' || entry.speaker === 'rep' ? 'REP' : 'CUSTOMER'
    console.log(`  [${transcript.length - 10 + i}] ${speaker}: ${entry.text?.substring(0, 80)}${entry.text?.length > 80 ? '...' : ''}`)
  })

  // Summary
  console.log(`\n🏁 ANALYSIS SUMMARY`)
  console.log('='.repeat(60))
  console.log(`Close Attempts Detected: ${closeAttempts.length}`)
  console.log(`Buying Signals Found: ${buyingSignals.length}`)
  console.log(`Information Collected: ${infoCollection.length > 0 ? 'YES' : 'NO'}`)
  console.log(`Sale Closed (DB): ${session.sale_closed ? 'YES' : 'NO'}`)
  console.log(`Earnings: $${session.virtual_earnings || 0}`)
  
  if (closeAttempts.length > 0 && buyingSignals.length > 0 && !session.sale_closed) {
    console.log('\n⚠️  ISSUE IDENTIFIED: Close attempts and buying signals detected but sale not marked as closed')
    console.log('   → Likely OpenAI analysis issue or missing fallback detection')
  } else if (closeAttempts.length === 0 && buyingSignals.length > 0) {
    console.log('\n⚠️  ISSUE IDENTIFIED: Buying signals detected but no close attempts matched patterns')
    console.log('   → Close patterns may be too restrictive')
  } else if (closeAttempts.length === 0 && infoCollection.length > 0) {
    console.log('\n⚠️  ISSUE IDENTIFIED: Information collected but no close attempts detected')
    console.log('   → Information collection should trigger close detection')
  }
  
  console.log('\n' + '='.repeat(60))
}

const sessionId = process.argv[2] || '0febad42-5e9c-4e28-920c-30b6b46a2029'
analyzeSession(sessionId).catch(console.error)
