/**
 * Add fake session data to Justin Wicks' reps
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Create fake session data for a rep
 */
async function createFakeSessions(repId, repName, numSessions = 5) {
  const sessions = []
  const now = new Date()
  
  // Generate sessions over the last 30 days
  for (let i = 0; i < numSessions; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const sessionDate = new Date(now)
    sessionDate.setDate(sessionDate.getDate() - daysAgo)
    
    // Random scores between 60-95
    const overallScore = Math.floor(Math.random() * 35) + 60
    const discoveryScore = Math.floor(Math.random() * 15) + 75
    const objectionScore = Math.floor(Math.random() * 15) + 70
    const closingScore = Math.floor(Math.random() * 15) + 70
    
    // Random duration between 3-15 minutes
    const durationSeconds = Math.floor(Math.random() * 720) + 180
    
    // 30% chance of closing a sale
    const saleClosed = Math.random() < 0.3
    const virtualEarnings = saleClosed ? Math.floor(Math.random() * 500) + 100 : 0
    
    // Fake transcript
    const transcript = [
      { speaker: 'salesrep', text: `Hi, I'm ${repName.split(' ')[0]} from DoorIQ. How are you today?`, time: '0:00' },
      { speaker: 'homeowner', text: "I'm doing well, thanks. What can I help you with?", time: '0:05' },
      { speaker: 'salesrep', text: "I wanted to talk to you about pest control solutions for your home.", time: '0:10' },
      { speaker: 'homeowner', text: "Oh, we already have a service.", time: '0:15' },
      { speaker: 'salesrep', text: "That's great! What company are you with?", time: '0:20' },
      { speaker: 'homeowner', text: "We use Orkin.", time: '0:25' },
      { speaker: 'salesrep', text: "How long have you been with them?", time: '0:30' },
      { speaker: 'homeowner', text: "About two years now.", time: '0:35' },
      { speaker: 'salesrep', text: "And how has your experience been?", time: '0:40' },
      { speaker: 'homeowner', text: "It's been okay, but it's getting expensive.", time: '0:45' },
      { speaker: 'salesrep', text: "I understand. We offer competitive pricing and comprehensive coverage.", time: '0:50' },
      { speaker: 'homeowner', text: "What kind of pricing are we talking about?", time: '1:00' },
      { speaker: 'salesrep', text: "For a home your size, we'd be looking at around $120 per month.", time: '1:10' },
      { speaker: 'homeowner', text: "That's actually less than what we're paying now.", time: '1:20' },
      { speaker: 'salesrep', text: "Great! Would you like to schedule a free inspection?", time: '1:30' },
      { speaker: 'homeowner', text: saleClosed ? "Yes, that sounds good." : "Let me think about it.", time: '1:40' }
    ]
    
    const session = {
      user_id: repId,
      agent_name: 'Average Austin',
      full_transcript: transcript,
      duration_seconds: durationSeconds,
      started_at: sessionDate.toISOString(),
      ended_at: new Date(sessionDate.getTime() + durationSeconds * 1000).toISOString(),
      upload_type: 'live_recording',
      overall_score: overallScore,
      analytics: {
        scores: {
          overall: overallScore,
          discovery: discoveryScore,
          objection_handling: objectionScore,
          closing: closingScore
        },
        sale_closed: saleClosed,
        virtual_earnings: virtualEarnings,
        graded_at: sessionDate.toISOString()
      }
    }
    
    sessions.push(session)
  }
  
  // Insert all sessions
  if (sessions.length > 0) {
    const { error } = await supabase
      .from('live_sessions')
      .insert(sessions)
    
    if (error) {
      console.error(`   ❌ Error creating sessions:`, error.message)
      return false
    } else {
      console.log(`   ✅ Created ${sessions.length} fake sessions`)
      return true
    }
  }
  
  return false
}

async function addSessionsToReps() {
  console.log('🚀 Adding fake sessions to Justin Wicks\' reps...\n')
  
  try {
    // Find Justin Wicks
    const { data: justinData } = await supabase
      .from('users')
      .select('team_id')
      .or('email.ilike.%justin%wick%,full_name.ilike.%justin%wick%')
      .limit(1)
      .single()
    
    if (!justinData || !justinData.team_id) {
      throw new Error('Justin Wicks not found or has no team')
    }
    
    const teamId = justinData.team_id
    console.log(`✅ Found team: ${teamId}\n`)
    
    // Get all reps in the team
    const { data: reps } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('team_id', teamId)
      .eq('role', 'rep')
    
    if (!reps || reps.length === 0) {
      console.log('No reps found in team')
      return
    }
    
    console.log(`Found ${reps.length} reps\n`)
    
    // Check existing sessions
    const repIds = reps.map(r => r.id)
    const { data: existingSessions } = await supabase
      .from('live_sessions')
      .select('user_id')
      .in('user_id', repIds)
    
    const sessionsByRep = {}
    existingSessions?.forEach(s => {
      sessionsByRep[s.user_id] = (sessionsByRep[s.user_id] || 0) + 1
    })
    
    // Add sessions to each rep
    for (const rep of reps) {
      const existingCount = sessionsByRep[rep.id] || 0
      const numSessions = Math.max(0, 5 - existingCount) // Add up to 5 sessions per rep
      
      if (numSessions > 0) {
        console.log(`Adding ${numSessions} sessions to ${rep.full_name}...`)
        await createFakeSessions(rep.id, rep.full_name, numSessions)
      } else {
        console.log(`✅ ${rep.full_name} already has ${existingCount} sessions`)
      }
    }
    
    console.log('\n✅ Done adding sessions!')
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

addSessionsToReps()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

