/**
 * Check grading results for the pest control test session
 * 
 * Usage:
 *   node scripts/check-grading-results.js [sessionId]
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

async function checkGradingResults(sessionId) {
  console.log('📊 Checking Grading Results')
  console.log('='.repeat(60))
  console.log('Session ID:', sessionId)
  console.log('')
  
  try {
    const { data: session, error } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    if (error || !session) {
      console.error('❌ Session not found:', error?.message || 'Unknown error')
      return false
    }
    
    console.log('✅ Session Found')
    console.log('')
    
    // Core Scores
    console.log('📈 Core Scores:')
    console.log('   Overall Score:', session.overall_score ?? 'Not graded yet')
    console.log('   Rapport Score:', session.rapport_score ?? 'N/A')
    console.log('   Discovery Score:', session.discovery_score ?? 'N/A')
    console.log('   Objection Handling Score:', session.objection_handling_score ?? 'N/A')
    console.log('   Close Score:', session.close_score ?? 'N/A')
    console.log('')
    
    // Sale Status
    console.log('💰 Sale Status:')
    console.log('   Sale Closed:', session.sale_closed ? '✅ Yes' : '❌ No')
    console.log('   Virtual Earnings:', session.virtual_earnings || 0)
    console.log('   Return Appointment:', session.return_appointment ? 'Yes' : 'No')
    console.log('')
    
    // Grading Status
    console.log('⚙️  Grading Status:')
    console.log('   Status:', session.grading_status || 'pending')
    console.log('   Graded At:', session.graded_at || 'Not graded yet')
    console.log('')
    
    // Analytics
    if (session.analytics) {
      const analytics = session.analytics
      
      if (analytics.deep_analysis) {
        console.log('📝 Deep Analysis:')
        if (analytics.deep_analysis.overallAssessment) {
          console.log('   Assessment:', analytics.deep_analysis.overallAssessment.substring(0, 200) + '...')
        }
        
        if (analytics.deep_analysis.finalScores) {
          console.log('   Final Scores:', JSON.stringify(analytics.deep_analysis.finalScores, null, 2))
        }
        
        if (analytics.deep_analysis.topStrengths && analytics.deep_analysis.topStrengths.length > 0) {
          console.log('\n   Top Strengths:')
          analytics.deep_analysis.topStrengths.forEach((strength, i) => {
            console.log(`      ${i + 1}. ${strength}`)
          })
        }
        
        if (analytics.deep_analysis.topImprovements && analytics.deep_analysis.topImprovements.length > 0) {
          console.log('\n   Top Improvements:')
          analytics.deep_analysis.topImprovements.forEach((improvement, i) => {
            console.log(`      ${i + 1}. ${improvement}`)
          })
        }
        
        if (analytics.deep_analysis.session_highlight) {
          console.log('\n   Session Highlight:')
          console.log(`      ${analytics.deep_analysis.session_highlight}`)
        }
        console.log('')
      }
      
      if (analytics.feedback) {
        console.log('💬 Feedback:')
        if (analytics.feedback.strengths && analytics.feedback.strengths.length > 0) {
          console.log('   Strengths:')
          analytics.feedback.strengths.slice(0, 3).forEach((s, i) => {
            console.log(`      ${i + 1}. ${s}`)
          })
        }
        if (analytics.feedback.improvements && analytics.feedback.improvements.length > 0) {
          console.log('   Improvements:')
          analytics.feedback.improvements.slice(0, 3).forEach((s, i) => {
            console.log(`      ${i + 1}. ${s}`)
          })
        }
        console.log('')
      }
      
      if (analytics.coaching_plan) {
        console.log('🎓 Coaching Plan:')
        if (analytics.coaching_plan.immediateFixes && analytics.coaching_plan.immediateFixes.length > 0) {
          console.log('   Immediate Fixes:', analytics.coaching_plan.immediateFixes.length)
        }
        if (analytics.coaching_plan.rolePlayScenarios && analytics.coaching_plan.rolePlayScenarios.length > 0) {
          console.log('   Role Play Scenarios:', analytics.coaching_plan.rolePlayScenarios.length)
        }
        console.log('')
      }
    }
    
    // Transcript Info
    if (session.full_transcript) {
      console.log('📄 Transcript:')
      console.log('   Total Entries:', session.full_transcript.length)
      console.log('   Rep Entries:', session.full_transcript.filter(t => t.speaker === 'rep' || t.speaker === 'user').length)
      console.log('   Homeowner Entries:', session.full_transcript.filter(t => t.speaker === 'homeowner' || t.speaker === 'agent').length)
      console.log('')
    }
    
    // Session Info
    console.log('📅 Session Info:')
    console.log('   Started:', session.started_at)
    console.log('   Ended:', session.ended_at || 'N/A')
    console.log('   Duration:', session.duration_seconds ? `${session.duration_seconds}s (${Math.round(session.duration_seconds / 60)}m)` : 'N/A')
    console.log('')
    
    if (session.overall_score === null || session.overall_score === 0) {
      console.log('⚠️  Session has not been graded yet.')
      console.log('   Run: curl -X POST http://localhost:3000/api/grade/orchestrate \\')
      console.log('        -H "Content-Type: application/json" \\')
      console.log(`        -d '{"sessionId": "${sessionId}"}'`)
    } else {
      console.log('✅ Grading Complete!')
    }
    
    return true
  } catch (error) {
    console.error('❌ Error checking results:', error.message)
    console.error('   Stack:', error.stack)
    return false
  }
}

async function main() {
  const sessionId = process.argv[2] || 'a69c4d9c-5f80-4b8e-94e1-08e988089737'
  const success = await checkGradingResults(sessionId)
  process.exit(success ? 0 : 1)
}

main().catch(error => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
