/**
 * Test script to prove the grading pipeline works end-to-end
 * 
 * Usage:
 *   npx tsx scripts/test-grading-pipeline.ts
 * 
 * This will:
 * 1. Create a test session with synthetic transcript
 * 2. Run the grading API
 * 3. Fetch and display the results
 */

// Load env from .env.local (fallback to .env) so this script can run outside Next.js
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
const envLocalPath = path.resolve(process.cwd(), '.env.local')
const envPath = fs.existsSync(envLocalPath) ? envLocalPath : path.resolve(process.cwd(), '.env')
dotenv.config({ path: envPath })

import { createClient } from '@supabase/supabase-js'

// Synthetic transcript that covers all grading categories
const SYNTHETIC_TRANSCRIPT = [
  {
    speaker: 'user',
    text: 'Hi there! My name is John from Pest Shield Solutions. How are you doing today?',
    timestamp: new Date(Date.now() - 180000).toISOString(), // 3 min ago
  },
  {
    speaker: 'homeowner',
    text: 'I\'m doing well, thanks. What can I help you with?',
    timestamp: new Date(Date.now() - 175000).toISOString(),
  },
  {
    speaker: 'user',
    text: 'I\'m calling about your home at 123 Main Street. I wanted to ask - have you noticed any pest issues lately? Maybe ants, spiders, or rodents?',
    timestamp: new Date(Date.now() - 170000).toISOString(),
  },
  {
    speaker: 'homeowner',
    text: 'Actually yes, we\'ve been seeing some ants in the kitchen. It\'s been pretty annoying.',
    timestamp: new Date(Date.now() - 165000).toISOString(),
  },
  {
    speaker: 'user',
    text: 'I completely understand how you feel - many homeowners have told me that ants in the kitchen can be really frustrating, especially when you\'re trying to keep things clean. Can you tell me more about where you\'re seeing them?',
    timestamp: new Date(Date.now() - 160000).toISOString(),
  },
  {
    speaker: 'homeowner',
    text: 'Mostly around the sink and near the trash can. They seem to come in through the window.',
    timestamp: new Date(Date.now() - 155000).toISOString(),
  },
  {
    speaker: 'user',
    text: 'That makes perfect sense. What we do is create a protective barrier around entry points and treat the areas where they\'re active. Our service is completely safe for pets and children - do you have any pets at home?',
    timestamp: new Date(Date.now() - 150000).toISOString(),
  },
  {
    speaker: 'homeowner',
    text: 'Yes, we have a dog and two kids. How much does this cost?',
    timestamp: new Date(Date.now() - 145000).toISOString(),
  },
  {
    speaker: 'user',
    text: 'Great question! The investment depends on the size of your home, but I want to focus on the value first. With our quarterly service, we guarantee you\'ll be pest-free, and if you see any pests between visits, we come back for free. Most importantly, you\'ll have peace of mind knowing your kids and dog are safe.',
    timestamp: new Date(Date.now() - 140000).toISOString(),
  },
  {
    speaker: 'homeowner',
    text: 'That sounds good, but I\'m pretty busy right now. Can you just email me some information?',
    timestamp: new Date(Date.now() - 135000).toISOString(),
  },
  {
    speaker: 'user',
    text: 'I appreciate your time, and I\'d be happy to send you information. But let me ask you this - if I could get a technician out there this week to take care of your ant problem, would that be helpful? I have two appointments available: Tuesday at 2pm or Thursday at 10am. Which works better for you?',
    timestamp: new Date(Date.now() - 130000).toISOString(),
  },
  {
    speaker: 'homeowner',
    text: 'Well... Thursday morning could work.',
    timestamp: new Date(Date.now() - 125000).toISOString(),
  },
  {
    speaker: 'user',
    text: 'Perfect! Let me get you scheduled for Thursday at 10am. Can I get your phone number to confirm?',
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
  {
    speaker: 'homeowner',
    text: 'Sure, it\'s 555-0123.',
    timestamp: new Date(Date.now() - 115000).toISOString(),
  },
  {
    speaker: 'user',
    text: 'Excellent. You\'re all set for Thursday at 10am. Our technician will call you 30 minutes before arrival. Thanks so much, and we\'ll see you Thursday!',
    timestamp: new Date(Date.now() - 110000).toISOString(),
  },
]

async function main() {
  console.log('🧪 Testing Grading Pipeline End-to-End\n')
  console.log('=' .repeat(60))

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Step 1: Create test session
  console.log('\n📝 Step 1: Creating test session with synthetic transcript...')
  
  const { data: session, error: insertError } = await supabase
    .from('live_sessions')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000', // Placeholder
      agent_name: 'Test Grading Pipeline',
      started_at: new Date(Date.now() - 180000).toISOString(),
      ended_at: new Date().toISOString(),
      duration_seconds: 180,
      full_transcript: SYNTHETIC_TRANSCRIPT,
      analytics: {
        test_session: true,
        created_by: 'test-grading-pipeline.ts',
      },
    })
    .select()
    .single()

  if (insertError) {
    console.error('❌ Failed to create test session:', insertError)
    process.exit(1)
  }

  const sessionId = session.id
  console.log(`✅ Created test session: ${sessionId}`)
  console.log(`   Transcript entries: ${SYNTHETIC_TRANSCRIPT.length}`)
  console.log(`   Duration: ${session.duration_seconds}s`)

  // Step 2: Run grading API
  console.log('\n🤖 Step 2: Running grading API...')
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  try {
    const response = await fetch(`${baseUrl}/api/grade/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Grading API failed:', error)
      process.exit(1)
    }

    const result = await response.json()
    console.log('✅ Grading completed successfully')
  } catch (error: any) {
    console.error('❌ Failed to call grading API:', error.message)
    console.error('   Make sure your dev server is running: npm run dev')
    process.exit(1)
  }

  // Step 3: Fetch and display results
  console.log('\n📊 Step 3: Fetching graded results...')
  
  const { data: gradedSession, error: fetchError } = await supabase
    .from('live_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (fetchError) {
    console.error('❌ Failed to fetch graded session:', fetchError)
    process.exit(1)
  }

  console.log('✅ Results fetched')
  console.log('\n' + '='.repeat(60))
  console.log('📈 GRADING RESULTS')
  console.log('='.repeat(60))

  // Display scores
  console.log('\n🎯 Overall Scores:')
  console.log(`   Overall Score:           ${gradedSession.overall_score || 'N/A'}/100`)
  console.log(`   Rapport Score:           ${gradedSession.rapport_score || 'N/A'}/100`)
  console.log(`   Introduction Score:      ${gradedSession.introduction_score || 'N/A'}/100`)
  console.log(`   Listening Score:         ${gradedSession.listening_score || 'N/A'}/100`)
  console.log(`   Objection Handling:      ${gradedSession.objection_handling_score || 'N/A'}/100`)
  console.log(`   Safety Score:            ${gradedSession.safety_score || 'N/A'}/100`)
  console.log(`   Close Effectiveness:     ${gradedSession.close_effectiveness_score || 'N/A'}/100`)

  // Display line ratings
  const lineRatings = gradedSession.analytics?.line_ratings || []
  if (lineRatings.length > 0) {
    console.log('\n📝 Line-by-Line Ratings:')
    lineRatings.forEach((rating: any) => {
      const entry = SYNTHETIC_TRANSCRIPT[rating.idx]
      if (entry) {
        const emoji = 
          rating.label === 'excellent' ? '🟢' :
          rating.label === 'good' ? '🟡' :
          rating.label === 'poor' ? '🔴' : '⚪'
        
        console.log(`\n   ${emoji} Line ${rating.idx}: ${rating.label.toUpperCase()}`)
        console.log(`      "${entry.text.substring(0, 80)}${entry.text.length > 80 ? '...' : ''}"`)
        if (rating.rationale) {
          console.log(`      💡 ${rating.rationale}`)
        }
      }
    })
  }

  // Display feedback
  const feedback = gradedSession.analytics?.feedback
  if (feedback) {
    if (feedback.strengths?.length > 0) {
      console.log('\n💪 Strengths:')
      feedback.strengths.forEach((s: string, i: number) => {
        console.log(`   ${i + 1}. ${s}`)
      })
    }

    if (feedback.improvements?.length > 0) {
      console.log('\n🎯 Areas for Improvement:')
      feedback.improvements.forEach((i: string, idx: number) => {
        console.log(`   ${idx + 1}. ${i}`)
      })
    }

    if (feedback.specificTips?.length > 0) {
      console.log('\n💡 Specific Tips:')
      feedback.specificTips.forEach((t: string, idx: number) => {
        console.log(`   ${idx + 1}. ${t}`)
      })
    }
  }

  // Display URL to view in app
  console.log('\n' + '='.repeat(60))
  console.log('🌐 View in App:')
  console.log(`   ${baseUrl}/trainer/analytics/${sessionId}`)
  console.log('='.repeat(60))

  console.log('\n✅ Test completed successfully!')
  console.log('\n💡 Next steps:')
  console.log('   1. Open the URL above to see the full grading UI')
  console.log('   2. Verify line-by-line highlights are showing')
  console.log('   3. Check that "What Worked/Failed" sections are populated')
  console.log('\n   If everything looks good, the issue is with live transcript capture,')
  console.log('   not the grading pipeline.')
}

main().catch(console.error)

