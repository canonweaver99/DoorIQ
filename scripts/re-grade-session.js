#!/usr/bin/env node

/**
 * Re-grade a session by triggering deep analysis
 * Usage: node scripts/re-grade-session.js [sessionId]
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

async function reGradeSession(sessionId) {
  console.log('\n🔄 RE-GRADING SESSION')
  console.log('='.repeat(60))
  console.log(`Session ID: ${sessionId}\n`)

  // Fetch session data
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
  console.log(`  Close Attempts: ${session.instant_metrics?.closeAttempts || 0}`)
  console.log('')

  if (!session.full_transcript || session.full_transcript.length === 0) {
    console.error('❌ No transcript found - cannot re-grade')
    process.exit(1)
  }

  console.log('🚀 Triggering deep analysis...\n')

  // Call deep analysis endpoint - use production URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://dooriq.ai'
  const deepAnalysisUrl = `${baseUrl}/api/grade/deep-analysis`

  console.log(`   URL: ${deepAnalysisUrl}`)
  console.log(`   Session ID: ${sessionId}\n`)

  try {
    const response = await fetch(deepAnalysisUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId,
        keyMoments: session.key_moments || [],
        instantMetrics: session.instant_metrics || {},
        elevenLabsData: session.elevenlabs_metrics || null
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Deep analysis failed:', response.status)
      console.error('Error:', errorText)
      process.exit(1)
    }

    const result = await response.json()
    console.log('✅ Deep analysis completed')
    console.log('  Status:', result.status || 'complete')
    console.log('')

    // Wait a moment for database update
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Fetch updated session
    const { data: updatedSession, error: updateError } = await supabase
      .from('live_sessions')
      .select('sale_closed, virtual_earnings, close_score, earnings_data, deal_details')
      .eq('id', sessionId)
      .single()

    if (updateError) {
      console.error('❌ Error fetching updated session:', updateError.message)
      process.exit(1)
    }

    console.log('📊 Updated Status:')
    console.log(`  Sale Closed: ${updatedSession.sale_closed ? '✅ YES' : '❌ NO'}`)
    console.log(`  Virtual Earnings: $${updatedSession.virtual_earnings || 0}`)
    console.log(`  Close Score: ${updatedSession.close_score || 'NULL'}`)
    
    if (updatedSession.earnings_data) {
      console.log('\n💰 Earnings Breakdown:')
      console.log(`  Base Amount: $${updatedSession.earnings_data.base_amount || 0}`)
      console.log(`  Total Earned: $${updatedSession.earnings_data.total_earned || updatedSession.virtual_earnings || 0}`)
      console.log(`  Total Earned: $${updatedSession.earnings_data.total_earned || 0}`)
    }

    if (updatedSession.deal_details) {
      console.log('\n📋 Deal Details:')
      console.log(`  Product: ${updatedSession.deal_details.product_sold || 'N/A'}`)
      console.log(`  Contract Value: $${updatedSession.deal_details.total_contract_value || 0}`)
    }

    console.log('\n' + '='.repeat(60))
    
    if (updatedSession.sale_closed && updatedSession.virtual_earnings > 0) {
      console.log('✅ SUCCESS: Sale detected and earnings calculated!')
    } else if (updatedSession.sale_closed && updatedSession.virtual_earnings === 0) {
      console.log('⚠️  WARNING: Sale marked as closed but earnings are $0')
    } else {
      console.log('ℹ️  Sale not detected - check transcript for close attempts')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

const sessionId = process.argv[2] || '0febad42-5e9c-4e28-920c-30b6b46a2029'
reGradeSession(sessionId).catch(console.error)
