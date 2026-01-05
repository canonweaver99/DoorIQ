/**
 * Test script for simplified grading endpoint
 * Run with: node scripts/test-simple-grading.js <sessionId>
 * Or without sessionId to use the test session from the user's query
 */

const sessionId = process.argv[2] || 'b10e3bdb-e475-4c50-a47d-d8d02fd1f602'
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function testSimpleGrading() {
  console.log(`\n🧪 Testing Simplified Grading Endpoint`)
  console.log(`Session ID: ${sessionId}`)
  console.log(`Base URL: ${baseUrl}\n`)

  try {
    // Step 1: Check session exists
    console.log('📋 Step 1: Checking session exists...')
    const sessionCheck = await fetch(`${baseUrl}/api/session?id=${sessionId}`)
    if (!sessionCheck.ok) {
      console.error(`❌ Session not found: ${sessionCheck.status}`)
      return false
    }
    const session = await sessionCheck.json()
    console.log(`✅ Session found: ${session.agent_name || 'Unknown'}`)
    console.log(`   Transcript lines: ${session.full_transcript?.length || 0}`)
    console.log(`   Current status: ${session.grading_status || 'pending'}`)
    console.log(`   Overall score: ${session.overall_score || 'N/A'}`)
    console.log(`   Sale closed: ${session.sale_closed !== null ? session.sale_closed : 'N/A'}\n`)

    if (!session.full_transcript || session.full_transcript.length === 0) {
      console.error('❌ No transcript found in session')
      return false
    }

    // Step 2: Trigger simple grading
    console.log('🚀 Step 2: Triggering simple grading...')
    console.log('   This will make a single OpenAI call and may take 10-30 seconds\n')
    const startTime = Date.now()
    
    const gradingResponse = await fetch(`${baseUrl}/api/grade/simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionId })
    })

    if (!gradingResponse.ok) {
      const errorText = await gradingResponse.text()
      console.error(`❌ Simple grading failed: ${gradingResponse.status}`)
      console.error(`   Error: ${errorText}`)
      return false
    }

    const gradingData = await gradingResponse.json()
    const gradingTime = Date.now() - startTime
    console.log(`✅ Simple grading completed (${(gradingTime / 1000).toFixed(2)}s)`)
    console.log(`   Status: ${gradingData.status}`)
    console.log(`   Sale closed: ${gradingData.sale_closed}`)
    console.log(`   Overall score: ${gradingData.overall_score || 'N/A'}\n`)

    // Step 3: Verify results in database
    console.log('📊 Step 3: Verifying results in database...')
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for DB update
    
    const verifyResponse = await fetch(`${baseUrl}/api/session?id=${sessionId}`)
    if (!verifyResponse.ok) {
      console.error(`❌ Failed to verify session: ${verifyResponse.status}`)
      return false
    }
    
    const verifiedSession = await verifyResponse.json()
    console.log(`✅ Session verified`)
    console.log(`   Grading status: ${verifiedSession.grading_status}`)
    console.log(`   Overall score: ${verifiedSession.overall_score || 'N/A'}`)
    console.log(`   Rapport score: ${verifiedSession.rapport_score || 'N/A'}`)
    console.log(`   Discovery score: ${verifiedSession.discovery_score || 'N/A'}`)
    console.log(`   Objection handling: ${verifiedSession.objection_handling_score || 'N/A'}`)
    console.log(`   Close score: ${verifiedSession.close_score || 'N/A'}`)
    console.log(`   Sale closed: ${verifiedSession.sale_closed !== null ? verifiedSession.sale_closed : 'N/A'}`)
    console.log(`   Virtual earnings: ${verifiedSession.virtual_earnings || 0}`)
    console.log(`   Key moments: ${verifiedSession.key_moments?.length || 0}`)
    console.log(`   Top strengths: ${verifiedSession.top_strengths?.length || 0}`)
    console.log(`   Top improvements: ${verifiedSession.top_improvements?.length || 0}`)
    console.log(`   Session highlight: ${verifiedSession.session_highlight ? 'Yes' : 'No'}\n`)

    // Check if all required fields are present
    const requiredFields = [
      'overall_score',
      'rapport_score',
      'discovery_score',
      'objection_handling_score',
      'close_score',
      'sale_closed',
      'virtual_earnings',
      'key_moments',
      'top_strengths',
      'top_improvements'
    ]

    const missingFields = requiredFields.filter(field => {
      if (field === 'sale_closed') {
        return verifiedSession[field] === null || verifiedSession[field] === undefined
      }
      return verifiedSession[field] === null || verifiedSession[field] === undefined
    })

    if (missingFields.length > 0) {
      console.warn(`⚠️  Missing fields: ${missingFields.join(', ')}`)
    } else {
      console.log(`✅ All required fields present`)
    }

    if (verifiedSession.grading_status === 'complete' && verifiedSession.sale_closed !== null) {
      console.log(`\n✅ SUCCESS: Grading completed successfully!`)
      return true
    } else {
      console.warn(`\n⚠️  WARNING: Grading may not be fully complete`)
      console.warn(`   Status: ${verifiedSession.grading_status}`)
      console.warn(`   Sale closed: ${verifiedSession.sale_closed}`)
      return false
    }

  } catch (error) {
    console.error(`❌ Error testing simple grading:`, error)
    return false
  }
}

testSimpleGrading().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
