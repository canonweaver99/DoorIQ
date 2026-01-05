/**
 * Test script to grade the pest control sales conversation transcript
 * 
 * Usage:
 *   node scripts/test-pest-control-grading.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// The transcript provided by the user
const transcriptText = `REP: Hey! How's it going? I'm Marcus with Guardian Pest Control. We're actually taking care of a few of your neighbors here on Oakwood Drive. Just wanted to stop by real quick - do you guys currently have any pest control service?

HOMEOWNER: Hey. No, we don't have anything right now.

REP: Okay, no worries. Have you had any issues with bugs, spiders, ants, anything like that around the house lately?

HOMEOWNER: Actually yeah, we've been seeing a lot of spiders in the garage. And some ants in the kitchen a couple weeks ago.

REP: Yeah, that's pretty common around here, especially this time of year. The good news is we can actually get you taken care of today. We do a full interior and exterior treatment - inside we hit all the baseboards, windows, doors, anywhere bugs can get in. Outside we spray the foundation, eaves, windows, the whole perimeter. Creates a barrier so nothing's getting inside.

HOMEOWNER: Okay... how often do you guys come out?

REP: We come quarterly, so every three months. That keeps the barrier active year-round. And if you ever have any issues between services, we come back for free. How long have you been dealing with the spider situation?

HOMEOWNER: Probably the last month or so. It's been driving my wife crazy honestly.

REP: I bet. Garage spiders are the worst because they just keep coming back. We can knock out that first treatment today actually - get rid of what you're dealing with now and then keep you covered going forward. We can get you started at $99 for the first service, then it's $135 quarterly after that. Does that work for you guys?

HOMEOWNER: Hmm, that's a bit more than I was expecting. What's included in that exactly?

REP: Yeah, totally fair. So that covers full interior and exterior - we're hitting every room inside, all the baseboards, under sinks, garage, attic access if you want. Outside is the full perimeter, foundation, eaves, windows, door frames. We're also treating for ants, spiders, roaches, silverfish, earwigs, all the common stuff you see around here. And like I said, if anything pops up between services, we come back free of charge.

HOMEOWNER: Okay. And you guys can do it today?

REP: Yep, I've got a technician in the area right now. He could probably be here in the next hour or two. Are you gonna be around this afternoon?

HOMEOWNER: Yeah, I'm working from home today. Let me ask you this - do we have to be home when you come out?

REP: Nope, not at all. Most of our customers aren't home. We just need access to the garage and exterior. For the interior, if you're not around, we can schedule that for when you are, or a lot of people just leave a door unlocked and we shoot them a text when we're done.

HOMEOWNER: Okay, that's good. And you said if I see bugs after you spray, you guys come back?

REP: Exactly. We guarantee it. You see anything crawling around, just shoot us a text or call, and we'll have someone back out there within 24 to 48 hours. No extra charge.

HOMEOWNER: Alright. Yeah, let's do it. My wife will be happy to get rid of these spiders.

REP: Awesome! Yeah, she's gonna be stoked. Alright, let me just grab some info from you real quick. What's the best phone number to reach you at?

HOMEOWNER: It's 512-555-0147.

REP: Perfect. And email?

HOMEOWNER: [email protected]

REP: Got it. And just so I'm clear, are you the homeowner?

HOMEOWNER: Yep, we've been here about three years now.

REP: Nice. Okay, so I've got you down for the first service today - technician should be here between 2 and 4. He'll text you about 30 minutes before he shows up. First service is $99, then you'll be on the quarterly plan at $135. We'll bill you after each service, and you can pay online or over the phone. Sound good?

HOMEOWNER: Yeah, that works for me.

REP: Awesome. You're all set. And hey, if you have any questions before the tech gets here, my number's on this card. Just shoot me a text.

HOMEOWNER: Perfect, appreciate it.

REP: No problem! Have a good one.`

function parseTranscript(text) {
  const lines = text.split('\n').filter(line => line.trim())
  const transcript = []
  const baseTime = new Date()
  let currentTime = 0
  
  // Estimate ~5 minutes total (300 seconds) for this conversation
  const totalDuration = 300
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    
    // Check if line starts with REP: or HOMEOWNER:
    if (trimmed.startsWith('REP:')) {
      const text = trimmed.substring(4).trim()
      if (text) {
        // Estimate time based on text length (roughly 150 words per minute)
        const wordCount = text.split(/\s+/).length
        const estimatedSeconds = Math.max(2, Math.round(wordCount / 2.5)) // ~2.5 words per second
        
        transcript.push({
          speaker: 'rep',
          text: text,
          timestamp: new Date(baseTime.getTime() + currentTime * 1000).toISOString()
        })
        
        currentTime += estimatedSeconds
      }
    } else if (trimmed.startsWith('HOMEOWNER:')) {
      const text = trimmed.substring(10).trim()
      if (text) {
        const wordCount = text.split(/\s+/).length
        const estimatedSeconds = Math.max(2, Math.round(wordCount / 2.5))
        
        transcript.push({
          speaker: 'homeowner',
          text: text,
          timestamp: new Date(baseTime.getTime() + currentTime * 1000).toISOString()
        })
        
        currentTime += estimatedSeconds
      }
    }
  }
  
  return { transcript, durationSeconds: Math.min(currentTime, totalDuration) }
}

async function createSessionAndGrade() {
  console.log('🧪 Testing Pest Control Sales Conversation Grading')
  console.log('='.repeat(60))
  
  try {
    // Step 1: Get a test user (or create one if needed)
    console.log('\n📋 Step 1: Getting test user...')
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (!users || users.length === 0) {
      console.error('❌ No users found in database')
      console.log('   Please create a user first or use an existing one')
      return false
    }
    
    const userId = users[0].id
    console.log('✅ Using user ID:', userId)
    
    // Step 2: Parse the transcript
    console.log('\n📝 Step 2: Parsing transcript...')
    const { transcript, durationSeconds } = parseTranscript(transcriptText)
    console.log(`✅ Parsed ${transcript.length} transcript entries`)
    console.log(`   Estimated duration: ${durationSeconds} seconds (${Math.round(durationSeconds / 60)} minutes)`)
    console.log(`   Rep entries: ${transcript.filter(t => t.speaker === 'rep').length}`)
    console.log(`   Homeowner entries: ${transcript.filter(t => t.speaker === 'homeowner').length}`)
    
    // Show first few entries
    console.log('\n   Sample entries:')
    transcript.slice(0, 3).forEach((entry, i) => {
      console.log(`   [${i}] ${entry.speaker}: ${entry.text.substring(0, 60)}...`)
    })
    
    // Step 3: Create session directly in database
    console.log('\n💾 Step 3: Creating session in database...')
    const startedAt = new Date()
    const endedAt = new Date(startedAt.getTime() + durationSeconds * 1000)
    
    // Set overall_score to 0 to bypass trigger calculation (grading will update it)
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .insert({
        user_id: userId,
        agent_name: 'Test Homeowner (Pest Control)',
        full_transcript: transcript,
        duration_seconds: durationSeconds,
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        overall_score: 0, // Set to 0 to bypass trigger (grading will update)
        sale_closed: false,
        virtual_earnings: 0,
        return_appointment: false
      })
      .select('id')
      .single()
    
    if (sessionError) {
      console.error('❌ Failed to create session:', sessionError.message)
      console.error('   Error details:', JSON.stringify(sessionError, null, 2))
      console.error('\n⚠️  If you see an error about introduction_score, run this SQL migration:')
      console.error('   lib/supabase/migrations/126_fix_calculate_overall_score_trigger.sql')
      return false
    }
    
    const sessionId = session.id
    console.log('✅ Session created:', sessionId)
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004'
    
    // Step 4: Trigger grading via orchestration endpoint
    console.log('\n🎯 Step 4: Triggering grading orchestration...')
    const orchestrationUrl = `${baseUrl}/api/grade/orchestrate`
    
    console.log('   Endpoint:', orchestrationUrl)
    console.log('   Session ID:', sessionId)
    console.log('   This will run all 3 grading phases...')
    console.log('   Phase 1: Instant Metrics (~1-2s)')
    console.log('   Phase 2: Key Moments (~2-5s)')
    console.log('   Phase 3: Deep Analysis (~5-15s, background)')
    console.log('\n   ⏳ Starting grading process...\n')
    
    const startTime = Date.now()
    
    try {
      const response = await fetch(orchestrationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          transcript: transcript
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Grading orchestration failed:', response.status, response.statusText)
        console.error('   Error:', errorText.substring(0, 500))
        return false
      }
      
      const result = await response.json()
      const totalTime = Date.now() - startTime
      
      console.log('✅ Grading orchestration completed!')
      console.log(`   Total time: ${(totalTime / 1000).toFixed(2)}s`)
      console.log('\n📊 Phase Results:')
      
      if (result.phases) {
        if (result.phases.instant) {
          const instant = result.phases.instant
          console.log(`\n   Phase 1 (Instant Metrics): ${instant.status}`)
          if (instant.status === 'complete') {
            console.log(`      Time: ${instant.timeElapsed}ms`)
            if (instant.scores) {
              console.log(`      Estimated Overall Score: ${instant.scores.estimatedScore || 'N/A'}`)
            }
          } else if (instant.error) {
            console.log(`      Error: ${instant.error}`)
          }
        }
        
        if (result.phases.keyMoments) {
          const moments = result.phases.keyMoments
          console.log(`\n   Phase 2 (Key Moments): ${moments.status}`)
          if (moments.status === 'complete') {
            console.log(`      Time: ${moments.timeElapsed}ms`)
            if (moments.keyMoments) {
              console.log(`      Key Moments Found: ${moments.keyMoments.length}`)
            }
          } else if (moments.error) {
            console.log(`      Error: ${moments.error}`)
          }
        }
        
        if (result.phases.deepAnalysis) {
          const deep = result.phases.deepAnalysis
          console.log(`\n   Phase 3 (Deep Analysis): ${deep.status}`)
          if (deep.status === 'processing') {
            console.log(`      Status: Running in background`)
            console.log(`      Note: This will complete in ~5-15 seconds`)
          } else if (deep.error) {
            console.log(`      Error: ${deep.error}`)
          }
        }
      }
      
      // Step 5: Wait a bit and check final results
      console.log('\n⏳ Waiting 20 seconds for deep analysis to complete...')
      await new Promise(resolve => setTimeout(resolve, 20000))
      
      console.log('\n📊 Step 5: Fetching final session results...')
      const { data: finalSession, error: fetchError } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()
      
      if (fetchError) {
        console.error('❌ Failed to fetch final session:', fetchError.message)
        return false
      }
      
      console.log('\n✅ Final Grading Results:')
      console.log('   Session ID:', sessionId)
      console.log('   Overall Score:', finalSession.overall_score || 'Not yet graded')
      console.log('   Rapport Score:', finalSession.rapport_score || 'N/A')
      console.log('   Discovery Score:', finalSession.discovery_score || 'N/A')
      console.log('   Objection Handling Score:', finalSession.objection_handling_score || 'N/A')
      console.log('   Closing Score:', finalSession.close_score || 'N/A')
      console.log('   Sale Closed:', finalSession.sale_closed ? '✅ Yes' : '❌ No')
      console.log('   Virtual Earnings:', finalSession.virtual_earnings || 0)
      
      if (finalSession.analytics) {
        const analytics = finalSession.analytics
        if (analytics.deep_analysis) {
          console.log('\n📝 Deep Analysis Summary:')
          if (analytics.deep_analysis.overallAssessment) {
            console.log(`   Assessment: ${analytics.deep_analysis.overallAssessment.substring(0, 200)}...`)
          }
          if (analytics.deep_analysis.topStrengths && analytics.deep_analysis.topStrengths.length > 0) {
            console.log(`\n   Top Strengths:`)
            analytics.deep_analysis.topStrengths.slice(0, 3).forEach((strength, i) => {
              console.log(`      ${i + 1}. ${strength}`)
            })
          }
          if (analytics.deep_analysis.topImprovements && analytics.deep_analysis.topImprovements.length > 0) {
            console.log(`\n   Top Improvements:`)
            analytics.deep_analysis.topImprovements.slice(0, 3).forEach((improvement, i) => {
              console.log(`      ${i + 1}. ${improvement}`)
            })
          }
        }
      }
      
      console.log('\n✅ Test completed successfully!')
      console.log(`\n   View session in database: ${sessionId}`)
      console.log(`   Or check the analytics page in the app`)
      
      return true
      
    } catch (error) {
      console.error('❌ Error during grading:', error.message)
      console.error('   Stack:', error.stack)
      return false
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    console.error('   Stack:', error.stack)
    return false
  }
}

async function main() {
  const success = await createSessionAndGrade()
  process.exit(success ? 0 : 1)
}

main().catch(error => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
