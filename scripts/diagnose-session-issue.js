#!/usr/bin/env node

/**
 * Diagnostic script to check why a session wasn't stored or sale_closed wasn't recognized
 * Usage: node scripts/diagnose-session-issue.js <sessionId>
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function diagnoseSession(sessionId) {
  console.log('🔍 Diagnosing session:', sessionId)
  console.log('='.repeat(60))
  
  // 1. Check if session exists
  const { data: session, error: sessionError } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()
  
  if (sessionError) {
    console.error('❌ Session not found in database:', sessionError.message)
    console.log('\n📋 Possible causes:')
    console.log('  1. Session was never created')
    console.log('  2. Session ID is incorrect')
    console.log('  3. Database connection issue')
    return
  }
  
  console.log('✅ Session found in database')
  console.log('\n📊 Session Status:')
  console.log(`  ID: ${session.id}`)
  console.log(`  Created: ${session.created_at || 'N/A'}`)
  console.log(`  Started: ${session.started_at || 'N/A'}`)
  console.log(`  Ended: ${session.ended_at || '❌ NOT SET'}`)
  console.log(`  Duration: ${session.duration_seconds || 0} seconds`)
  console.log(`  Agent: ${session.agent_name || 'N/A'}`)
  console.log(`  User ID: ${session.user_id || 'N/A'}`)
  
  // 2. Check transcript
  const transcriptLength = Array.isArray(session.full_transcript) 
    ? session.full_transcript.length 
    : 0
  console.log(`\n📝 Transcript: ${transcriptLength} entries`)
  if (transcriptLength === 0) {
    console.log('  ⚠️ WARNING: Empty transcript - session may not have been saved properly')
  } else {
    console.log('  ✅ Transcript exists')
    // Show first and last entries
    if (session.full_transcript.length > 0) {
      console.log(`  First entry: ${JSON.stringify(session.full_transcript[0]).substring(0, 100)}...`)
      console.log(`  Last entry: ${JSON.stringify(session.full_transcript[session.full_transcript.length - 1]).substring(0, 100)}...`)
    }
  }
  
  // 3. Check grading status
  console.log(`\n🎯 Grading Status:`)
  console.log(`  Status: ${session.grading_status || '❌ NOT SET'}`)
  console.log(`  Graded At: ${session.graded_at || '❌ NOT SET'}`)
  console.log(`  Overall Score: ${session.overall_score !== null ? session.overall_score : '❌ NOT SET'}`)
  console.log(`  Rapport Score: ${session.rapport_score !== null ? session.rapport_score : '❌ NOT SET'}`)
  console.log(`  Discovery Score: ${session.discovery_score !== null ? session.discovery_score : '❌ NOT SET'}`)
  console.log(`  Objection Handling Score: ${session.objection_handling_score !== null ? session.objection_handling_score : '❌ NOT SET'}`)
  console.log(`  Close Score: ${session.close_score !== null ? session.close_score : '❌ NOT SET'}`)
  
  // 4. Check sale_closed status
  console.log(`\n💰 Sale Status:`)
  console.log(`  Sale Closed: ${session.sale_closed !== null && session.sale_closed !== undefined ? (session.sale_closed ? '✅ YES' : '❌ NO') : '❌ NOT SET (NULL)'}`)
  console.log(`  Virtual Earnings: $${session.virtual_earnings || 0}`)
  console.log(`  Return Appointment: ${session.return_appointment ? '✅ YES' : '❌ NO'}`)
  console.log(`  Total Contract Value: $${session.total_contract_value || 'N/A'}`)
  
  if (session.earnings_data) {
    console.log(`  Earnings Data:`, JSON.stringify(session.earnings_data, null, 2))
  }
  
  if (session.deal_details) {
    console.log(`  Deal Details:`, JSON.stringify(session.deal_details, null, 2))
  }
  
  // 5. Check grading audit log
  if (session.grading_audit) {
    console.log(`\n📋 Grading Audit:`)
    console.log(`  GPT Detected Sale: ${session.grading_audit.gpt_detected_sale ? '✅ YES' : '❌ NO'}`)
    console.log(`  Fallback Detection Triggered: ${session.grading_audit.fallback_detection_triggered ? '✅ YES' : '❌ NO'}`)
    console.log(`  Fallback Detected Sale: ${session.grading_audit.fallback_detected_sale ? '✅ YES' : '❌ NO'}`)
    console.log(`  Final Sale Closed: ${session.grading_audit.final_sale_closed ? '✅ YES' : '❌ NO'}`)
    if (session.grading_audit.fallback_reason) {
      console.log(`  Fallback Reason: ${session.grading_audit.fallback_reason}`)
    }
  }
  
  // 6. Check analytics
  console.log(`\n📊 Analytics:`)
  if (session.analytics) {
    console.log(`  Has Analytics: ✅ YES`)
    console.log(`  Analytics Keys: ${Object.keys(session.analytics).join(', ')}`)
    if (session.analytics.voice_analysis) {
      console.log(`  Voice Analysis: ✅ Present`)
    }
    if (session.analytics.feedback) {
      console.log(`  Feedback: ✅ Present`)
    }
    if (session.analytics.coaching_plan) {
      console.log(`  Coaching Plan: ✅ Present`)
    }
  } else {
    console.log(`  Has Analytics: ❌ NO`)
  }
  
  // 7. Check instant_metrics
  console.log(`\n⚡ Instant Metrics:`)
  if (session.instant_metrics) {
    console.log(`  Has Instant Metrics: ✅ YES`)
    console.log(`  Close Attempts: ${session.instant_metrics.closeAttempts || 0}`)
    console.log(`  Techniques Used: ${session.instant_metrics.techniquesUsed?.length || 0}`)
    if (session.instant_metrics.techniquesUsed) {
      console.log(`  Techniques: ${session.instant_metrics.techniquesUsed.join(', ')}`)
    }
  } else {
    console.log(`  Has Instant Metrics: ❌ NO`)
  }
  
  // 8. Check key_moments
  console.log(`\n🔑 Key Moments:`)
  if (session.key_moments && Array.isArray(session.key_moments)) {
    console.log(`  Key Moments Count: ${session.key_moments.length}`)
    if (session.key_moments.length > 0) {
      console.log(`  First Key Moment: ${JSON.stringify(session.key_moments[0]).substring(0, 100)}...`)
    }
  } else {
    console.log(`  Key Moments: ❌ NOT SET`)
  }
  
  // 9. Diagnosis summary
  console.log('\n' + '='.repeat(60))
  console.log('🔍 DIAGNOSIS SUMMARY:')
  console.log('='.repeat(60))
  
  const issues = []
  
  if (!session.ended_at) {
    issues.push('❌ Session never ended (ended_at is NULL) - session finalization may have failed')
  }
  
  if (transcriptLength === 0) {
    issues.push('❌ Empty transcript - session data may not have been saved')
  }
  
  if (session.grading_status !== 'complete') {
    issues.push(`❌ Grading not complete (status: ${session.grading_status || 'NULL'}) - grading may have failed or not started`)
  }
  
  if (session.sale_closed === null || session.sale_closed === undefined) {
    issues.push('❌ sale_closed is NULL - deep analysis may not have completed or failed')
  }
  
  if (session.overall_score === null) {
    issues.push('❌ Overall score is NULL - grading may not have completed')
  }
  
  if (issues.length === 0) {
    console.log('✅ No obvious issues found. Session appears to be stored correctly.')
    if (session.sale_closed === false && transcriptLength > 0) {
      console.log('\n⚠️ NOTE: sale_closed is FALSE. This may be correct if:')
      console.log('  - The sale did not actually close')
      console.log('  - GPT-4o analysis determined no sale occurred')
      console.log('  - Fallback detection did not find evidence of a sale')
      console.log('\n💡 To check if this is correct, review the transcript and grading_audit.')
    }
  } else {
    console.log('⚠️ Issues found:')
    issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`)
    })
    
    console.log('\n💡 Recommended Actions:')
    if (!session.ended_at) {
      console.log('  1. Check if /api/session PATCH endpoint was called successfully')
      console.log('  2. Check server logs for errors during session finalization')
    }
    if (session.grading_status !== 'complete') {
      console.log('  3. Check if /api/grade/orchestrate was called')
      console.log('  4. Check if /api/grade/deep-analysis completed successfully')
      console.log('  5. Check server logs for grading errors')
    }
    if (session.sale_closed === null || session.sale_closed === undefined) {
      console.log('  6. Deep analysis may have failed - check server logs')
      console.log('  7. Consider manually triggering grading: POST /api/grade/orchestrate')
    }
  }
  
  console.log('\n' + '='.repeat(60))
}

const sessionId = process.argv[2]

if (!sessionId) {
  console.error('❌ Usage: node scripts/diagnose-session-issue.js <sessionId>')
  process.exit(1)
}

diagnoseSession(sessionId)
  .then(() => {
    console.log('\n✅ Diagnosis complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error during diagnosis:', error)
    process.exit(1)
  })
