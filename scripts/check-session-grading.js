/**
 * Check grading status for a specific session
 * 
 * Usage:
 *   node scripts/check-session-grading.js <session-id>
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSession(sessionId) {
  console.log(`\n🔍 Checking session: ${sessionId}\n`)
  
  const { data: session, error } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()
  
  if (error || !session) {
    console.error('❌ Session not found:', error?.message)
    return
  }
  
  console.log('📊 Grading Status:', session.grading_status || 'N/A')
  console.log('📅 Graded At:', session.graded_at || 'Not yet graded')
  console.log('\n🎯 Scores:')
  console.log('   Overall Score:', session.overall_score ?? 'N/A')
  console.log('   Rapport Score:', session.rapport_score ?? 'N/A')
  console.log('   Discovery Score:', session.discovery_score ?? 'N/A')
  console.log('   Objection Handling Score:', session.objection_handling_score ?? 'N/A')
  console.log('   Closing Score:', session.close_score ?? 'N/A')
  
  console.log('\n💰 Sale Info:')
  console.log('   Sale Closed:', session.sale_closed ? '✅ Yes' : '❌ No')
  console.log('   Virtual Earnings:', session.virtual_earnings ?? 0)
  
  if (session.instant_metrics) {
    console.log('\n⚡ Instant Metrics:')
    console.log('   WPM:', session.instant_metrics.wordsPerMinute ?? 'N/A')
    console.log('   Filler Words:', session.instant_metrics.fillerWords ?? 'N/A')
    console.log('   Close Attempts:', session.instant_metrics.closeAttempts ?? 'N/A')
    console.log('   Objections:', session.instant_metrics.objectionCount ?? 'N/A')
  }
  
  if (session.key_moments && Array.isArray(session.key_moments)) {
    console.log(`\n🔑 Key Moments: ${session.key_moments.length} found`)
  }
  
  if (session.analytics) {
    const analytics = session.analytics
    console.log('\n📝 Analytics Data:')
    
    if (analytics.deep_analysis) {
      console.log('   ✅ Deep Analysis: Complete')
      if (analytics.deep_analysis.overallAssessment) {
        console.log(`   Assessment: ${analytics.deep_analysis.overallAssessment.substring(0, 150)}...`)
      }
      if (analytics.deep_analysis.topStrengths && analytics.deep_analysis.topStrengths.length > 0) {
        console.log(`\n   Top Strengths (${analytics.deep_analysis.topStrengths.length}):`)
        analytics.deep_analysis.topStrengths.slice(0, 3).forEach((s, i) => {
          console.log(`      ${i + 1}. ${s}`)
        })
      }
      if (analytics.deep_analysis.topImprovements && analytics.deep_analysis.topImprovements.length > 0) {
        console.log(`\n   Top Improvements (${analytics.deep_analysis.topImprovements.length}):`)
        analytics.deep_analysis.topImprovements.slice(0, 3).forEach((s, i) => {
          console.log(`      ${i + 1}. ${s}`)
        })
      }
    } else {
      console.log('   ⏳ Deep Analysis: Not yet complete')
    }
  }
  
  console.log('\n')
}

const sessionId = process.argv[2]
if (!sessionId) {
  console.error('❌ Please provide a session ID')
  console.log('Usage: node scripts/check-session-grading.js <session-id>')
  process.exit(1)
}

checkSession(sessionId).catch(error => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})
