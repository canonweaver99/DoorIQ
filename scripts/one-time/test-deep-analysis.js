/**
 * Test script for deep analysis endpoint directly
 */

const sessionId = process.argv[2] || 'cb66320b-6b26-4cfe-b087-47e8e70341fc'
const baseUrl = process.env.TEST_URL || 'https://dooriq.ai'

async function testDeepAnalysis() {
  console.log(`\n🧪 Testing Deep Analysis Endpoint`)
  console.log(`Session ID: ${sessionId}`)
  console.log(`Base URL: ${baseUrl}\n`)

  try {
    // First get session data
    console.log('📋 Step 1: Fetching session data...')
    const sessionResponse = await fetch(`${baseUrl}/api/session?id=${sessionId}`)
    if (!sessionResponse.ok) {
      console.error(`❌ Session not found: ${sessionResponse.status}`)
      return
    }
    const session = await sessionResponse.json()
    console.log(`✅ Session found`)
    console.log(`   Has instant_metrics: ${!!session.instant_metrics}`)
    console.log(`   Has key_moments: ${!!session.key_moments}`)
    console.log(`   Key moments count: ${session.key_moments?.length || 0}\n`)

    // Call deep analysis endpoint
    console.log('🚀 Step 2: Calling deep analysis endpoint...')
    const startTime = Date.now()
    const deepAnalysisResponse = await fetch(`${baseUrl}/api/grade/deep-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId,
        keyMoments: session.key_moments,
        instantMetrics: session.instant_metrics,
        elevenLabsData: session.elevenlabs_metrics
      })
    })

    const elapsed = Date.now() - startTime
    console.log(`   Response status: ${deepAnalysisResponse.status}`)
    console.log(`   Time elapsed: ${elapsed}ms\n`)

    if (!deepAnalysisResponse.ok) {
      const errorText = await deepAnalysisResponse.text()
      console.error(`❌ Deep analysis failed:`)
      console.error(`   ${errorText}`)
      return
    }

    const result = await deepAnalysisResponse.json()
    console.log(`✅ Deep analysis completed!`)
    console.log(`   Status: ${result.status}`)
    console.log(`   Time elapsed: ${result.timeElapsed}ms`)
    console.log(`   Has deepAnalysis: ${!!result.deepAnalysis}`)
    console.log(`   Has coachingPlan: ${!!result.coachingPlan}`)
    console.log(`   Final scores:`, result.finalScores)

    // Check session status
    console.log(`\n📊 Step 3: Verifying session update...`)
    const verifyResponse = await fetch(`${baseUrl}/api/session?id=${sessionId}`)
    if (verifyResponse.ok) {
      const verifySession = await verifyResponse.json()
      console.log(`   Grading status: ${verifySession.grading_status}`)
      console.log(`   Overall score: ${verifySession.overall_score}`)
      console.log(`   Has deep_analysis: ${!!verifySession.analytics?.deep_analysis}`)
      console.log(`   Has coaching_plan: ${!!verifySession.analytics?.coaching_plan}`)
    }

  } catch (error) {
    console.error(`\n❌ Test failed:`, error.message)
    console.error(error.stack)
  }
}

testDeepAnalysis()

