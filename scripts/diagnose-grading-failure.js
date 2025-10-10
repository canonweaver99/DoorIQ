#!/usr/bin/env node

/**
 * Diagnose why grading failed for a session
 * Usage: node scripts/diagnose-grading-failure.js [sessionId]
 */

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

async function diagnose(sessionId) {
  console.log('\n🔍 GRADING FAILURE DIAGNOSIS')
  console.log('=' .repeat(60))
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

  console.log('📋 SESSION DETAILS')
  console.log('-'.repeat(60))
  console.log('Created:', session.created_at)
  console.log('Started:', session.started_at)
  console.log('Ended:', session.ended_at)
  console.log('Duration:', session.duration_seconds, 'seconds')
  console.log('User ID:', session.user_id)
  console.log('')

  // Check transcript
  console.log('📝 TRANSCRIPT CHECK')
  console.log('-'.repeat(60))
  if (!session.full_transcript) {
    console.error('❌ No transcript exists')
    console.log('\n🔧 LIKELY CAUSE: Transcript not saved when session ended')
    console.log('🔧 FIX: Check app/trainer/page.tsx endSession() function')
    console.log('🔧 FIX: Verify PATCH /api/session is being called')
    process.exit(1)
  } else if (session.full_transcript.length === 0) {
    console.error('❌ Transcript is empty (0 lines)')
    console.log('\n🔧 LIKELY CAUSE: No conversation occurred OR transcript capture failed')
    console.log('🔧 FIX: Check ElevenLabs message handlers in ElevenLabsConversation.tsx')
    console.log('🔧 FIX: Check browser console for transcript logs during session')
    process.exit(1)
  } else {
    console.log('✅ Transcript exists:', session.full_transcript.length, 'lines')
    console.log('\nFirst 3 lines:')
    session.full_transcript.slice(0, 3).forEach((line, i) => {
      console.log(`  [${i}] ${line.speaker}: ${line.text?.substring(0, 80)}...`)
    })
  }
  console.log('')

  // Check grading
  console.log('🎯 GRADING CHECK')
  console.log('-'.repeat(60))
  
  if (!session.analytics) {
    console.error('❌ No analytics object')
    console.log('\n🔧 LIKELY CAUSE: Grading API never ran')
    console.log('🔧 CHECK: OPENAI_API_KEY environment variable')
    console.log('🔧 CHECK: Server logs for grading errors')
    console.log('🔧 TRY: Manually trigger grading:')
    console.log(`   curl -X POST http://localhost:3000/api/grade/session -H "Content-Type: application/json" -d '{"sessionId":"${sessionId}"}'`)
  } else if (!session.analytics.line_ratings || session.analytics.line_ratings.length === 0) {
    console.error('❌ Analytics exists but no line_ratings')
    console.log('\n🔧 LIKELY CAUSE: OpenAI returned empty/invalid response')
    console.log('🔧 CHECK: OpenAI API logs')
    console.log('🔧 CHECK: Prompt might be too long (token limit)')
    console.log('\nAnalytics content:', JSON.stringify(session.analytics, null, 2).substring(0, 500))
  } else {
    console.log('✅ Line ratings exist:', session.analytics.line_ratings.length, 'lines')
    console.log('✅ Grading version:', session.analytics.grading_version)
    console.log('✅ Graded at:', session.analytics.graded_at)
  }
  console.log('')

  // Check scores
  console.log('📊 SCORES CHECK')
  console.log('-'.repeat(60))
  console.log('Overall:', session.overall_score || 'NULL')
  console.log('Rapport:', session.rapport_score || 'NULL')
  console.log('Discovery:', session.discovery_score || 'NULL')
  console.log('Objection Handling:', session.objection_handling_score || 'NULL')
  console.log('Closing:', session.close_score || 'NULL')
  console.log('')

  // Check earnings
  console.log('💰 EARNINGS CHECK')
  console.log('-'.repeat(60))
  console.log('Sale Closed:', session.sale_closed ? '✅ YES' : '❌ NO')
  console.log('Virtual Earnings:', session.virtual_earnings ? `$${session.virtual_earnings}` : '$0.00')
  
  if (session.earnings_data) {
    console.log('\nEarnings Breakdown:')
    console.log('  Commission:', session.earnings_data.commission_earned || 'N/A')
    console.log('  Bonuses:', JSON.stringify(session.earnings_data.bonus_modifiers || {}))
    console.log('  Total:', session.earnings_data.total_earned || 'N/A')
  }
  
  if (session.deal_details) {
    console.log('\nDeal Details:')
    console.log('  Product:', session.deal_details.product_sold || 'N/A')
    console.log('  Contract Value:', session.deal_details.total_contract_value || 'N/A')
  }
  console.log('')

  // Check objection analysis
  if (session.analytics?.objection_analysis) {
    console.log('🛡️  OBJECTION ANALYSIS')
    console.log('-'.repeat(60))
    console.log('Total Objections:', session.analytics.objection_analysis.total_objections || 0)
    console.log('Resolution Rate:', session.analytics.objection_analysis.total_objections 
      ? Math.round((session.analytics.objection_analysis.objections_detail?.filter(o => o.resolution === 'resolved').length || 0) / session.analytics.objection_analysis.total_objections * 100) + '%'
      : 'N/A')
    console.log('')
  }

  // Check coaching plan
  if (session.analytics?.coaching_plan) {
    console.log('🎯 COACHING PLAN')
    console.log('-'.repeat(60))
    console.log('Immediate Fixes:', session.analytics.coaching_plan.immediate_fixes?.length || 0)
    console.log('Skill Development:', session.analytics.coaching_plan.skill_development?.length || 0)
    console.log('Role-Play Scenarios:', session.analytics.coaching_plan.role_play_scenarios?.length || 0)
    console.log('')
  }

  // Final diagnosis
  console.log('🏁 DIAGNOSIS SUMMARY')
  console.log('='.repeat(60))
  
  if (session.analytics?.line_ratings && session.analytics.line_ratings.length > 0) {
    console.log('✅ SESSION GRADED SUCCESSFULLY')
    console.log('✅ All systems operational')
  } else if (!session.full_transcript || session.full_transcript.length === 0) {
    console.log('❌ TRANSCRIPT MISSING OR EMPTY')
    console.log('→ Root cause: Conversation not captured')
    console.log('→ Fix: Check ElevenLabs integration and transcript capture')
  } else if (!session.analytics) {
    console.log('❌ GRADING NEVER RAN')
    console.log('→ Root cause: Grading API not triggered or failed')
    console.log('→ Fix: Check OPENAI_API_KEY and server logs')
    console.log('→ Try manual grading:')
    console.log(`   curl -X POST http://localhost:3000/api/grade/session \\`)
    console.log(`     -H "Content-Type: application/json" \\`)
    console.log(`     -d '{"sessionId":"${sessionId}"}'`)
  } else {
    console.log('❌ GRADING PARTIALLY FAILED')
    console.log('→ Root cause: OpenAI returned incomplete data')
    console.log('→ Fix: Check OpenAI API logs and response structure')
  }
  
  console.log('\n' + '='.repeat(60))
}

// Get session ID from command line or use most recent
const sessionId = process.argv[2]

if (!sessionId) {
  console.log('Usage: node scripts/diagnose-grading-failure.js [sessionId]')
  console.log('\nOr omit sessionId to diagnose most recent session:\n')
  
  // Get most recent session
  supabase
    .from('live_sessions')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
    .then(({ data }) => {
      if (data) {
        console.log(`Using most recent session: ${data.id}`)
        console.log(`Created: ${data.created_at}\n`)
        diagnose(data.id)
      } else {
        console.error('No sessions found')
        process.exit(1)
      }
    })
} else {
  diagnose(sessionId)
}

