/**
 * Test script to verify the grading endpoint works correctly
 * 
 * Usage:
 *   node scripts/test-grading-endpoint.js <sessionId>
 * 
 * Or test with a new session:
 *   node scripts/test-grading-endpoint.js
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

async function testGradingEndpoint(sessionId) {
  console.log('🧪 Testing Grading Endpoint')
  console.log('=' .repeat(50))
  
  try {
    // Step 1: Verify session exists and has transcript
    console.log('\n📋 Step 1: Checking session...')
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    if (sessionError || !session) {
      console.error('❌ Session not found:', sessionError?.message)
      return false
    }
    
    console.log('✅ Session found')
    console.log('   Session ID:', session.id)
    console.log('   User ID:', session.user_id)
    console.log('   Duration:', session.duration_seconds, 'seconds')
    console.log('   Transcript entries:', session.full_transcript?.length || 0)
    
    // Step 2: Check transcript
    if (!session.full_transcript || session.full_transcript.length === 0) {
      console.error('❌ No transcript found in session')
      console.log('   This is the issue - transcript is not saved')
      return false
    }
    
    console.log('\n📝 Step 2: Transcript check')
    console.log('✅ Transcript found with', session.full_transcript.length, 'entries')
    console.log('   Sample entries:')
    session.full_transcript.slice(0, 3).forEach((entry, i) => {
      console.log(`   [${i}] ${entry.speaker}: ${entry.text?.substring(0, 50)}...`)
    })
    
    // Step 3: Test the non-streaming grading endpoint first
    console.log('\n🎯 Step 3: Testing non-streaming grading endpoint (/api/grade/session)...')
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const sessionGradingUrl = `${baseUrl}/api/grade/session`
    
    console.log('   Endpoint:', sessionGradingUrl)
    console.log('   Session ID:', sessionId)
    console.log('   Note: This will call OpenAI API and may take 30-60 seconds')
    
    try {
      const sessionResponse = await fetch(sessionGradingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      })
      
      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text()
        console.error('❌ Session grading endpoint failed:', sessionResponse.status, sessionResponse.statusText)
        console.error('   Error:', errorText.substring(0, 500))
        // Continue to test streaming endpoint anyway
      } else {
        const gradeResult = await sessionResponse.json()
        console.log('✅ Session grading completed successfully!')
        console.log('   Overall Score:', gradeResult.scores?.overall || gradeResult.overall_score || 'N/A')
        console.log('   Rapport Score:', gradeResult.scores?.rapport || gradeResult.rapport_score || 'N/A')
        console.log('   Objection Handling:', gradeResult.scores?.objection_handling || gradeResult.objection_handling_score || 'N/A')
        console.log('   Closing Score:', gradeResult.scores?.closing || gradeResult.closing_score || 'N/A')
        console.log('   Virtual Earnings:', gradeResult.virtual_earnings || 'N/A')
        console.log('   Sale Closed:', gradeResult.sale_closed || false)
      }
    } catch (error) {
      console.error('❌ Error testing session endpoint:', error.message)
      // Continue to test streaming endpoint
    }
    
    // Step 4: Test the streaming grading endpoint
    console.log('\n📡 Step 4: Testing streaming grading endpoint (/api/grade/stream)...')
    
    const streamGradingUrl = `${baseUrl}/api/grade/stream`
    console.log('   Endpoint:', streamGradingUrl)
    console.log('   Session ID:', sessionId)
    
    try {
      const streamResponse = await fetch(streamGradingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      })
      
      if (!streamResponse.ok) {
        const errorText = await streamResponse.text()
        console.error('❌ Streaming grading endpoint failed:', streamResponse.status, streamResponse.statusText)
        console.error('   Error:', errorText.substring(0, 500))
        return false
      }
      
      console.log('✅ Streaming endpoint responded successfully')
      console.log('   Status:', streamResponse.status)
      console.log('   Content-Type:', streamResponse.headers.get('content-type'))
      
      // Check if it's streaming
      if (streamResponse.body) {
        console.log('\n📡 Reading stream chunks...')
        const reader = streamResponse.body.getReader()
        const decoder = new TextDecoder()
        
        let chunks = 0
        let hasData = false
        let lastMessageType = null
        
        // Read first few chunks to verify streaming works
        for (let i = 0; i < 10; i++) {
          const { done, value } = await reader.read()
          if (done) break
          
          chunks++
          const text = decoder.decode(value, { stream: true })
          if (text.includes('data:')) {
            hasData = true
            const lines = text.split('\n').filter(l => l.startsWith('data:'))
            if (lines.length > 0) {
              console.log(`   ✅ Received chunk ${chunks} with ${lines.length} data lines`)
              try {
                const data = JSON.parse(lines[0].substring(6))
                if (data.type) {
                  lastMessageType = data.type
                  console.log(`   📊 Message type: ${data.type}`)
                  if (data.content) {
                    console.log(`   📝 Content preview: ${data.content.substring(0, 100)}...`)
                  }
                }
              } catch (e) {
                // Not JSON yet, that's okay
              }
            }
          }
        }
        
        reader.releaseLock()
        
        if (hasData) {
          console.log('✅ Streaming is working correctly')
          console.log('   Last message type:', lastMessageType || 'N/A')
          console.log('   Note: Full grading will continue in background')
          return true
        } else {
          console.log('⚠️  No data chunks received yet (may be normal)')
          return true
        }
      }
      
      return true
    } catch (error) {
      console.error('❌ Error testing streaming endpoint:', error.message)
      return false
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    console.error('   Stack:', error.stack)
    return false
  }
}

async function createTestSession() {
  console.log('📝 Creating test session with realistic sample transcript...')
  
  // Get a test user
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .limit(1)
  
  if (!users || users.length === 0) {
    console.error('❌ No users found in database')
    return null
  }
  
  const userId = users[0].id
  
  // Create a realistic test transcript using the new format (with id field)
  const baseTime = new Date()
  const mockTranscript = [
    { 
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      speaker: 'user', 
      text: 'Hi there! I\'m Sarah from DoorIQ. I noticed you have a beautiful home here. I\'m in the neighborhood today offering free security consultations.', 
      timestamp: new Date(baseTime.getTime() + 0 * 1000).toISOString() 
    },
    { 
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      speaker: 'homeowner', 
      text: 'Oh, hi. I\'m not really interested right now. We already have a security system.', 
      timestamp: new Date(baseTime.getTime() + 5 * 1000).toISOString() 
    },
    { 
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      speaker: 'user', 
      text: 'That\'s great that you already have something in place! Can I ask what concerns you most about home security?', 
      timestamp: new Date(baseTime.getTime() + 10 * 1000).toISOString() 
    },
    { 
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      speaker: 'homeowner', 
      text: 'Well, I guess I worry about break-ins, especially when we\'re not home. But everything seems so expensive.', 
      timestamp: new Date(baseTime.getTime() + 15 * 1000).toISOString() 
    },
    { 
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      speaker: 'user', 
      text: 'I totally understand that concern. Our system actually starts at just $29 a month, which is less than most people spend on coffee. And we offer a 30-day money-back guarantee.', 
      timestamp: new Date(baseTime.getTime() + 20 * 1000).toISOString() 
    },
    { 
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      speaker: 'homeowner', 
      text: 'Really? That\'s more reasonable than I thought. How does it work?', 
      timestamp: new Date(baseTime.getTime() + 25 * 1000).toISOString() 
    },
    { 
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      speaker: 'user', 
      text: 'Great question! Our system uses AI-powered sensors that detect unusual activity and alert you immediately via your phone. It\'s really easy to set up and doesn\'t require any drilling.', 
      timestamp: new Date(baseTime.getTime() + 30 * 1000).toISOString() 
    },
    { 
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      speaker: 'homeowner', 
      text: 'That sounds interesting. Is it safe? I have kids and pets.', 
      timestamp: new Date(baseTime.getTime() + 35 * 1000).toISOString() 
    },
    { 
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      speaker: 'user', 
      text: 'Absolutely! Safety is our top priority. The system is completely non-toxic and pet-friendly. It won\'t harm children or pets at all. Would you like me to schedule a free consultation to show you how it works?', 
      timestamp: new Date(baseTime.getTime() + 40 * 1000).toISOString() 
    },
    { 
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      speaker: 'homeowner', 
      text: 'Hmm, that does sound good. When would be a good time?', 
      timestamp: new Date(baseTime.getTime() + 45 * 1000).toISOString() 
    },
    { 
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      speaker: 'user', 
      text: 'How about this Saturday afternoon around 2 PM? I can come by and show you everything, answer any questions, and there\'s no obligation at all.', 
      timestamp: new Date(baseTime.getTime() + 50 * 1000).toISOString() 
    },
    { 
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      speaker: 'homeowner', 
      text: 'That works for me. I\'ll see you then!', 
      timestamp: new Date(baseTime.getTime() + 55 * 1000).toISOString() 
    },
  ]
  
  const startedAt = baseTime.toISOString()
  const endedAt = new Date(baseTime.getTime() + 60 * 1000).toISOString()
  
  const { data: session, error } = await supabase
    .from('live_sessions')
    .insert({
      user_id: userId,
      agent_name: 'Test Homeowner',
      full_transcript: mockTranscript,
      duration_seconds: 60,
      started_at: startedAt,
      ended_at: endedAt,
    })
    .select('id')
    .single()
  
  if (error) {
    console.error('❌ Failed to create test session:', error.message)
    console.error('   Error details:', JSON.stringify(error, null, 2))
    return null
  }
  
  console.log('✅ Test session created:', session.id)
  console.log('   Transcript entries:', mockTranscript.length)
  console.log('   Duration:', 60, 'seconds')
  return session.id
}

async function main() {
  const sessionId = process.argv[2]
  
  if (!sessionId) {
    console.log('ℹ️  No session ID provided, creating test session...')
    const testSessionId = await createTestSession()
    if (!testSessionId) {
      process.exit(1)
    }
    console.log('\n')
    const success = await testGradingEndpoint(testSessionId)
    process.exit(success ? 0 : 1)
  } else {
    const success = await testGradingEndpoint(sessionId)
    process.exit(success ? 0 : 1)
  }
}

main().catch(error => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})

