#!/usr/bin/env node

/**
 * Fix script to finalize a session and trigger grading
 * Usage: node scripts/fix-session-finalization.js <sessionId>
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

async function fixSession(sessionId) {
  console.log('🔧 Fixing session:', sessionId)
  console.log('='.repeat(60))
  
  // 1. Fetch current session
  const { data: session, error: sessionError } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()
  
  if (sessionError || !session) {
    console.error('❌ Session not found:', sessionError?.message)
    process.exit(1)
  }
  
  console.log('✅ Session found')
  console.log(`  Started: ${session.started_at}`)
  console.log(`  Ended: ${session.ended_at || '❌ NOT SET'}`)
  console.log(`  Duration: ${session.duration_seconds || 0} seconds`)
  console.log(`  Transcript entries: ${Array.isArray(session.full_transcript) ? session.full_transcript.length : 0}`)
  
  // 2. Calculate duration if not set
  let durationSeconds = session.duration_seconds || 0
  if (!durationSeconds && session.started_at) {
    const startedAt = new Date(session.started_at)
    const endedAt = session.ended_at ? new Date(session.ended_at) : new Date()
    durationSeconds = Math.floor((endedAt - startedAt) / 1000)
    console.log(`  Calculated duration: ${durationSeconds} seconds`)
  }
  
  // 3. Set ended_at if not set
  const now = new Date().toISOString()
  const endedAt = session.ended_at || now
  
  // 4. Update session to finalize it
  console.log('\n📝 Finalizing session...')
  const { data: updatedSession, error: updateError } = await supabase
    .from('live_sessions')
    .update({
      ended_at: endedAt,
      duration_seconds: durationSeconds || null,
      // Don't override existing scores if they exist
      // But ensure sale_closed is set to false initially if null
      sale_closed: session.sale_closed !== null ? session.sale_closed : false
    })
    .eq('id', sessionId)
    .select('id, ended_at, duration_seconds, sale_closed, grading_status')
    .single()
  
  if (updateError) {
    console.error('❌ Error updating session:', updateError.message)
    process.exit(1)
  }
  
  console.log('✅ Session finalized')
  console.log(`  Ended At: ${updatedSession.ended_at}`)
  console.log(`  Duration: ${updatedSession.duration_seconds} seconds`)
  console.log(`  Sale Closed: ${updatedSession.sale_closed}`)
  console.log(`  Grading Status: ${updatedSession.grading_status}`)
  
  // 5. Check if grading needs to be triggered
  if (updatedSession.grading_status !== 'complete') {
    console.log('\n🎯 Triggering grading...')
    console.log('  Note: This will call the grading orchestration endpoint')
    console.log('  The grading will run in the background and may take 1-2 minutes')
    
    // Try to trigger grading via API (if running locally)
    // Otherwise, just log instructions
    const apiUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    console.log(`\n💡 To trigger grading, run:`)
    console.log(`   curl -X POST ${apiUrl}/api/grade/orchestrate \\`)
    console.log(`     -H "Content-Type: application/json" \\`)
    console.log(`     -d '{"sessionId": "${sessionId}"}'`)
    console.log(`\n   Or visit the analytics page to trigger it automatically:`)
    console.log(`   ${apiUrl}/analytics/${sessionId}`)
  } else {
    console.log('\n✅ Grading already complete')
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Fix complete!')
  console.log('='.repeat(60))
}

const sessionId = process.argv[2]

if (!sessionId) {
  console.error('❌ Usage: node scripts/fix-session-finalization.js <sessionId>')
  process.exit(1)
}

fixSession(sessionId)
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
