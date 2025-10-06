#!/usr/bin/env node

/**
 * List recent sessions to help debug
 */

const { createClient } = require('@supabase/supabase-js')

async function listSessions() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('📋 Fetching recent sessions...\n')
  
  const { data, error } = await supabase
    .from('live_sessions')
    .select('id, started_at, ended_at, overall_score, full_transcript, analytics')
    .order('started_at', { ascending: false })
    .limit(5)
  
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  if (!data || data.length === 0) {
    console.log('No sessions found')
    return
  }
  
  data.forEach((session, idx) => {
    console.log(`\n${idx + 1}. Session ID: ${session.id}`)
    console.log(`   Started: ${new Date(session.started_at).toLocaleString()}`)
    console.log(`   Ended: ${session.ended_at ? new Date(session.ended_at).toLocaleString() : 'In progress'}`)
    console.log(`   Score: ${session.overall_score || 'Not graded'}`)
    console.log(`   Has transcript: ${Array.isArray(session.full_transcript) ? `Yes (${session.full_transcript.length} lines)` : 'No'}`)
    console.log(`   Has AI feedback: ${session.analytics?.feedback ? 'Yes' : 'No'}`)
  })
}

listSessions()
