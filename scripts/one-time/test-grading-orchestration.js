/**
 * Test script for grading orchestration endpoint
 * Run with: node scripts/test-grading-orchestration.js <sessionId>
 */

const sessionId = process.argv[2] || 'cb66320b-6b26-4cfe-b087-47e8e70341fc'
const baseUrl = process.env.TEST_URL || 'https://dooriq.ai'

async function testOrchestration() {
  console.log(`\n🧪 Testing Grading Orchestration`)
  console.log(`Session ID: ${sessionId}`)
  console.log(`Base URL: ${baseUrl}\n`)

  try {
    // Step 1: Check session exists
    console.log('📋 Step 1: Checking session exists...')
    const sessionCheck = await fetch(`${baseUrl}/api/session?id=${sessionId}`)
    if (!sessionCheck.ok) {
      console.error(`❌ Session not found: ${sessionCheck.status}`)
      return
    }
    const session = await sessionCheck.json()
    console.log(`✅ Session found: ${session.agent_name || 'Unknown'}`)
    console.log(`   Transcript lines: ${session.full_transcript?.length || 0}`)
    console.log(`   Current status: ${session.grading_status || 'pending'}`)
    console.log(`   Has instant_metrics: ${!!session.instant_metrics}`)
    console.log(`   Has key_moments: ${!!session.key_moments}`)
    console.log(`   Overall score: ${session.overall_score || 'N/A'}\n`)

    // Step 2: Trigger orchestration
    console.log('🚀 Step 2: Triggering orchestration...')
    const startTime = Date.now()
    const orchestrationResponse = await fetch(`${baseUrl}/api/grade/orchestrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionId })
    })

    if (!orchestrationResponse.ok) {
      const errorText = await orchestrationResponse.text()
      console.error(`❌ Orchestration failed: ${orchestrationResponse.status}`)
      console.error(`   Error: ${errorText}`)
      return
    }

    const orchestrationData = await orchestrationResponse.json()
    const orchestrationTime = Date.now() - startTime
    console.log(`✅ Orchestration triggered (${orchestrationTime}ms)`)
    console.log(`   Status: ${orchestrationData.status}`)
    console.log(`   Phases: ${Object.keys(orchestrationData.phases || {}).join(', ')}\n`)

    // Step 3: Check phase results
    if (orchestrationData.phases) {
      console.log('📊 Phase Results:')
      
      if (orchestrationData.phases.instant) {
        const instant = orchestrationData.phases.instant
        console.log(`   Instant Metrics: ${instant.status}`)
        if (instant.status === 'complete') {
          console.log(`     - Estimated Score: ${instant.scores?.estimatedScore || 'N/A'}`)
          console.log(`     - Time: ${instant.timeElapsed}ms`)
        } else {
          console.log(`     - Error: ${instant.error || 'Unknown'}`)
        }
      }

      if (orchestrationData.phases.keyMoments) {
        const moments = orchestrationData.phases.keyMoments
        console.log(`   Key Moments: ${moments.status}`)
        if (moments.status === 'complete') {
          console.log(`     - Moments found: ${moments.keyMoments?.length || 0}`)
          console.log(`     - Time: ${moments.timeElapsed}ms`)
        } else {
          console.log(`     - Error: ${moments.error || 'Unknown'}`)
        }
      }

      if (orchestrationData.phases.deepAnalysis) {
        const deep = orchestrationData.phases.deepAnalysis
        console.log(`   Deep Analysis: ${deep.status}`)
        console.log(`     - Message: ${deep.message || 'N/A'}`)
        if (deep.error) {
          console.log(`     - Error: ${deep.error}`)
        }
      }
    }

    // Step 4: Poll for completion
    console.log('\n⏳ Step 3: Polling for completion...')
    let pollCount = 0
    const maxPolls = 30 // 1 minute max
    
    while (pollCount < maxPolls) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
      pollCount++
      
      const pollResponse = await fetch(`${baseUrl}/api/session?id=${sessionId}`)
      if (pollResponse.ok) {
        const pollSession = await pollResponse.json()
        const status = pollSession.grading_status || 'pending'
        const score = pollSession.overall_score
        
        console.log(`   Poll ${pollCount}/${maxPolls}: Status=${status}, Score=${score || 'N/A'}`)
        
        if (status === 'complete' || status === 'completed' || score) {
          console.log(`\n✅ Grading Complete!`)
          console.log(`   Final Score: ${score}`)
          console.log(`   Status: ${status}`)
          console.log(`   Has deep_analysis: ${!!pollSession.analytics?.deep_analysis}`)
          console.log(`   Has coaching_plan: ${!!pollSession.analytics?.coaching_plan}`)
          return
        }
      }
    }
    
    console.log(`\n⚠️  Timeout after ${maxPolls} polls (${maxPolls * 2} seconds)`)
    console.log(`   Check logs for deep analysis errors`)
    
  } catch (error) {
    console.error(`\n❌ Test failed:`, error.message)
    console.error(error.stack)
  }
}

testOrchestration()

