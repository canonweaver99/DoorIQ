/**
 * Validate transcript format matches what grading endpoints expect
 * 
 * Usage:
 *   node scripts/validate-transcript-format.js <sessionId>
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

async function validateTranscript(sessionId) {
  console.log('🔍 Validating Transcript Format')
  console.log('='.repeat(50))
  
  try {
    // Fetch session
    const { data: session, error } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    if (error || !session) {
      console.error('❌ Session not found:', error?.message)
      return false
    }
    
    console.log('✅ Session found:', session.id)
    console.log('   Duration:', session.duration_seconds, 'seconds')
    console.log('   Agent:', session.agent_name || 'N/A')
    
    // Check transcript
    const transcript = session.full_transcript
    
    if (!transcript) {
      console.error('❌ No transcript found')
      return false
    }
    
    if (!Array.isArray(transcript)) {
      console.error('❌ Transcript is not an array. Type:', typeof transcript)
      return false
    }
    
    if (transcript.length === 0) {
      console.error('❌ Transcript is empty')
      return false
    }
    
    console.log('\n📝 Transcript Validation')
    console.log('   Total entries:', transcript.length)
    
    // Validate each entry
    let validEntries = 0
    let invalidEntries = 0
    const issues = []
    
    transcript.forEach((entry, index) => {
      const entryIssues = []
      
      // Check required fields
      if (!entry.speaker) {
        entryIssues.push('missing speaker')
      } else if (entry.speaker !== 'user' && entry.speaker !== 'homeowner') {
        entryIssues.push(`invalid speaker: ${entry.speaker} (must be 'user' or 'homeowner')`)
      }
      
      if (!entry.text) {
        entryIssues.push('missing text')
      } else if (typeof entry.text !== 'string') {
        entryIssues.push(`text is not a string: ${typeof entry.text}`)
      } else if (entry.text.trim().length === 0) {
        entryIssues.push('text is empty')
      }
      
      if (!entry.timestamp) {
        entryIssues.push('missing timestamp')
      } else if (typeof entry.timestamp !== 'string') {
        entryIssues.push(`timestamp is not a string: ${typeof entry.timestamp}`)
      }
      
      // id is optional but recommended
      if (!entry.id) {
        entryIssues.push('missing id (optional but recommended)')
      }
      
      if (entryIssues.length === 0) {
        validEntries++
      } else {
        invalidEntries++
        issues.push({ index, entry, issues: entryIssues })
      }
    })
    
    console.log('   Valid entries:', validEntries)
    console.log('   Invalid entries:', invalidEntries)
    
    if (invalidEntries > 0) {
      console.log('\n❌ Validation Issues Found:')
      issues.slice(0, 5).forEach(({ index, entry, issues: entryIssues }) => {
        console.log(`   Entry ${index}:`)
        console.log(`     Speaker: ${entry.speaker || 'MISSING'}`)
        console.log(`     Text: ${(entry.text || 'MISSING').substring(0, 50)}...`)
        console.log(`     Issues: ${entryIssues.join(', ')}`)
      })
      if (issues.length > 5) {
        console.log(`   ... and ${issues.length - 5} more issues`)
      }
      return false
    }
    
    console.log('\n✅ All entries are valid!')
    
    // Show sample entries
    console.log('\n📄 Sample Entries:')
    transcript.slice(0, 3).forEach((entry, i) => {
      console.log(`   [${i}] ${entry.speaker}: ${entry.text.substring(0, 60)}...`)
      console.log(`       Timestamp: ${entry.timestamp}`)
      console.log(`       ID: ${entry.id || 'N/A'}`)
    })
    
    // Check format compatibility with grading endpoints
    console.log('\n🔍 Format Compatibility Check:')
    
    // Check if format matches what grading endpoints expect
    const sampleEntry = transcript[0]
    const hasSpeaker = 'speaker' in sampleEntry
    const hasText = 'text' in sampleEntry || 'message' in sampleEntry
    const hasTimestamp = 'timestamp' in sampleEntry
    
    console.log('   Has speaker field:', hasSpeaker ? '✅' : '❌')
    console.log('   Has text/message field:', hasText ? '✅' : '❌')
    console.log('   Has timestamp field:', hasTimestamp ? '✅' : '❌')
    
    // Test extraction (like grading endpoints do)
    const testExtraction = transcript.map(entry => {
      const speaker = entry.speaker === 'user' ? 'Sales Rep' : 'Customer'
      const text = entry.text || entry.message || ''
      const timestamp = entry.timestamp || '0:00'
      return `[${timestamp}] ${speaker}: ${text}`
    })
    
    console.log('   Can extract text:', testExtraction.length > 0 ? '✅' : '❌')
    console.log('   Sample extraction:', testExtraction[0]?.substring(0, 80) + '...')
    
    console.log('\n✅ Transcript format is compatible with grading endpoints!')
    return true
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message)
    console.error('   Stack:', error.stack)
    return false
  }
}

async function main() {
  const sessionId = process.argv[2]
  
  if (!sessionId) {
    console.error('❌ Session ID required')
    console.log('Usage: node scripts/validate-transcript-format.js <sessionId>')
    console.log('\nTo create a test session first, run:')
    console.log('  node scripts/test-grading-endpoint.js')
    process.exit(1)
  }
  
  const success = await validateTranscript(sessionId)
  process.exit(success ? 0 : 1)
}

main().catch(error => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})

