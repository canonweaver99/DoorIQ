/**
 * Add 10 fake reps to Justin Wicks' account
 * Creates realistic rep users with fake session data for demo purposes
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Fake rep names
const REP_NAMES = [
  'Sarah Johnson',
  'Michael Chen',
  'Emily Rodriguez',
  'David Martinez',
  'Jessica Williams',
  'James Anderson',
  'Amanda Taylor',
  'Robert Brown',
  'Lisa Garcia',
  'Christopher Lee'
]

const PASSWORD = 'DemoRep2024!'

/**
 * Create an auth user
 */
async function createAuthUser(email, password, fullName) {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })
    return { user: data?.user, error }
  } catch (error) {
    return { user: null, error }
  }
}

/**
 * Create user profile
 */
async function createUserProfile(userId, email, fullName, role, teamId, repId) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: email.toLowerCase(),
      full_name: fullName,
      role,
      team_id: teamId,
      rep_id: repId,
      virtual_earnings: 0
    })
    .select()
    .single()
  
  return { data, error }
}

/**
 * Create session limits
 */
async function createSessionLimits(userId) {
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase
    .from('user_session_limits')
    .upsert({
      user_id: userId,
      sessions_this_month: 0,
      sessions_limit: 5,
      last_reset_date: today
    })
  
  return { error }
}

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
      console.error(`   ⚠️ Error creating sessions for ${repName}:`, error.message)
    } else {
      console.log(`   ✅ Created ${sessions.length} fake sessions`)
    }
  }
}

/**
 * Main function
 */
async function addRepsToJustinWicks() {
  console.log('🚀 Adding 10 fake reps to Justin Wicks\' account...\n')
  
  try {
    // Find Justin Wicks' account
    const { data: justinData, error: justinError } = await supabase
      .from('users')
      .select('*')
      .or('email.ilike.%justin%wick%,full_name.ilike.%justin%wick%')
      .limit(5)
    
    if (justinError) {
      throw new Error(`Failed to find Justin Wicks: ${justinError.message}`)
    }
    
    if (!justinData || justinData.length === 0) {
      throw new Error('Justin Wicks not found. Please check the email/name.')
    }
    
    const justin = justinData[0]
    console.log(`✅ Found Justin Wicks: ${justin.full_name} (${justin.email})`)
    console.log(`   User ID: ${justin.id}`)
    console.log(`   Current role: ${justin.role}`)
    console.log(`   Current team_id: ${justin.team_id || 'None'}\n`)
    
    // Ensure Justin is a manager
    let teamId = justin.team_id
    
    if (!teamId) {
      console.log('📦 Creating team for Justin Wicks...')
      
      // Create a team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: `${justin.full_name}'s Team`,
          owner_id: justin.id
        })
        .select()
        .single()
      
      if (teamError) {
        throw new Error(`Failed to create team: ${teamError.message}`)
      }
      
      teamId = teamData.id
      console.log(`   ✅ Team created: ${teamData.name} (ID: ${teamId})`)
      
      // Update Justin to be a manager
      const { error: updateError } = await supabase
        .from('users')
        .update({
          role: 'manager',
          team_id: teamId
        })
        .eq('id', justin.id)
      
      if (updateError) {
        throw new Error(`Failed to update Justin to manager: ${updateError.message}`)
      }
      
      console.log(`   ✅ Justin upgraded to manager`)
    } else {
      // Update role to manager if not already
      if (justin.role !== 'manager') {
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'manager' })
          .eq('id', justin.id)
        
        if (updateError) {
          console.warn(`   ⚠️ Failed to update role: ${updateError.message}`)
        } else {
          console.log(`   ✅ Justin upgraded to manager`)
        }
      }
      
      // Get team name
      const { data: teamData } = await supabase
        .from('teams')
        .select('name')
        .eq('id', teamId)
        .single()
      
      if (teamData) {
        console.log(`   ✅ Using existing team: ${teamData.name} (ID: ${teamId})`)
      }
    }
    
    // Check existing reps
    const { data: existingReps } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('team_id', teamId)
      .eq('role', 'rep')
    
    const existingCount = existingReps?.length || 0
    console.log(`\n📊 Current reps in team: ${existingCount}`)
    
    if (existingCount >= 10) {
      console.log('✅ Justin already has 10+ reps. Skipping creation.')
      return
    }
    
    const repsToCreate = 10 - existingCount
    console.log(`\n👥 Creating ${repsToCreate} new reps...\n`)
    
    // Create reps
    for (let i = 0; i < repsToCreate; i++) {
      const repName = REP_NAMES[i]
      const email = `justin.rep${i + 1}@demo.dooriq.ai`
      const repId = `REP-JW-${Date.now()}-${i}`
      
      console.log(`\n${i + 1}. Creating ${repName} (${email})...`)
      
      // Create auth user
      const { user: authUser, error: authError } = await createAuthUser(email, PASSWORD, repName)
      if (authError || !authUser) {
        console.error(`   ❌ Failed to create auth user: ${authError?.message}`)
        continue
      }
      console.log(`   ✅ Auth user created: ${authUser.id}`)
      
      // Create user profile
      const { data: userProfile, error: profileError } = await createUserProfile(
        authUser.id,
        email,
        repName,
        'rep',
        teamId,
        repId
      )
      if (profileError) {
        console.error(`   ❌ Failed to create user profile: ${profileError.message}`)
        continue
      }
      console.log(`   ✅ User profile created`)
      
      // Create session limits
      await createSessionLimits(authUser.id)
      console.log(`   ✅ Session limits set`)
      
      // Create fake sessions
      const numSessions = Math.floor(Math.random() * 8) + 3 // 3-10 sessions
      await createFakeSessions(authUser.id, repName, numSessions)
    }
    
    console.log(`\n✅ Successfully added ${repsToCreate} reps to Justin Wicks' team!`)
    console.log(`\n📝 Rep credentials:`)
    console.log(`   Password for all reps: ${PASSWORD}`)
    console.log(`   Email format: justin.rep[1-10]@demo.dooriq.ai`)
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
addRepsToJustinWicks()
  .then(() => {
    console.log('\n🎉 Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

