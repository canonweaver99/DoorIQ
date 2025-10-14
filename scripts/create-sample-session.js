const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createSampleSession() {
  try {
    console.log('🔍 Finding user with email: canonweaver@gmail.com')
    
    // Find user by email
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'canonweaver@gmail.com')
      .limit(1)
    
    if (userError) {
      console.error('❌ Error finding user:', userError)
      return
    }
    
    if (!users || users.length === 0) {
      console.error('❌ User not found with email canonweaver@gmail.com')
      console.log('💡 Available users:')
      const { data: allUsers } = await supabase.from('users').select('email, id').limit(5)
      allUsers?.forEach(u => console.log(`   - ${u.email} (${u.id})`))
      return
    }
    
    const user = users[0]
    console.log('✅ Found user:', user.email, '(', user.id, ')')
    
    // Load transcript
    const transcript = JSON.parse(fs.readFileSync('/tmp/sample_transcript.json', 'utf8'))
    console.log('📝 Loaded transcript with', transcript.length, 'lines')
    
    // Calculate duration (from first to last timestamp)
    const firstTime = new Date(transcript[0].timestamp)
    const lastTime = new Date(transcript[transcript.length - 1].timestamp)
    const durationSeconds = Math.floor((lastTime - firstTime) / 1000)
    
    console.log('⏱️ Duration:', durationSeconds, 'seconds (', Math.floor(durationSeconds / 60), 'min', durationSeconds % 60, 'sec )')
    
    // Create session
    console.log('📊 Creating session...')
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .insert({
        user_id: user.id,
        agent_name: 'Austin Rodriguez',
        full_transcript: transcript,
        duration_seconds: durationSeconds,
        started_at: firstTime.toISOString(),
        ended_at: lastTime.toISOString(),
        upload_type: 'file_upload'
      })
      .select('id')
      .single()
    
    if (sessionError) {
      console.error('❌ Error creating session:', sessionError)
      return
    }
    
    console.log('✅ Session created with ID:', session.id)
    
    // Trigger grading
    console.log('🎯 Triggering grading...')
    const gradeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3007'}/api/grade/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id })
    })
    
    if (!gradeResponse.ok) {
      const error = await gradeResponse.text()
      console.error('❌ Grading failed:', gradeResponse.status, error)
      return
    }
    
    const gradeResult = await gradeResponse.json()
    console.log('✅ Grading complete!')
    console.log('📊 Results:', {
      overall_score: gradeResult.scores?.overall,
      sale_closed: gradeResult.sale_closed,
      virtual_earnings: gradeResult.virtual_earnings,
      lines_graded: gradeResult.lines_graded
    })
    
    console.log('\n🎉 SUCCESS! Session created and graded.')
    console.log('🔗 View at: http://localhost:3007/analytics/' + session.id)
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createSampleSession()

