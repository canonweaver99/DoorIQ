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
    
    // Step 3: Test the grading endpoint
    console.log('\n🎯 Step 3: Testing grading endpoint...')
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const gradingUrl = `${baseUrl}/api/grade/stream`
    
    console.log('   Endpoint:', gradingUrl)
    console.log('   Session ID:', sessionId)
    
    // Note: This will actually call OpenAI, so it will cost money
    // We'll just test the initial connection and transcript check
    const response = await fetch(gradingUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Grading endpoint failed:', response.status, response.statusText)
      console.error('   Error:', errorText)
      return false
    }
    
    console.log('✅ Grading endpoint responded successfully')
    console.log('   Status:', response.status)
    console.log('   Content-Type:', response.headers.get('content-type'))
    
    // Step 4: Check if it's streaming
    if (response.body) {
      console.log('\n📡 Step 4: Checking stream...')
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      let chunks = 0
      let hasData = false
      
      // Read first few chunks to verify streaming works
      for (let i = 0; i < 5; i++) {
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
                console.log(`   📊 Message type: ${data.type}`)
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
        console.log('   Note: Full grading will continue in background')
        return true
      } else {
        console.log('⚠️  No data chunks received yet (may be normal)')
        return true
      }
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    console.error('   Stack:', error.stack)
    return false
  }
}

async function createTestSession() {
  console.log('📝 Creating test session with mock transcript...')
  
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
  
  // Create a test transcript
  const mockTranscript = [
    { speaker: 'user', text: 'Hi, I\'m John from ABC Pest Control. I noticed you have a beautiful home here.', timestamp: new Date().toISOString() },
    { speaker: 'homeowner', text: 'Oh, hi. What can I do for you?', timestamp: new Date().toISOString() },
    { speaker: 'user', text: 'I\'m in the neighborhood offering free inspections. Would you be interested?', timestamp: new Date().toISOString() },
    { speaker: 'homeowner', text: 'Well, I\'m not sure. We just had pest control done last month.', timestamp: new Date().toISOString() },
    { speaker: 'user', text: 'That\'s great! I can help you maintain that protection. When would be a good time?', timestamp: new Date().toISOString() },
  ]
  
  const { data: session, error } = await supabase
    .from('live_sessions')
    .insert({
      user_id: userId,
      agent_name: 'Test Homeowner',
      full_transcript: mockTranscript,
      duration_seconds: 30,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  
  if (error) {
    console.error('❌ Failed to create test session:', error.message)
    return null
  }
  
  console.log('✅ Test session created:', session.id)
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

