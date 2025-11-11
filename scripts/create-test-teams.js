/**
 * Create Test Teams
 * Creates 3 teams with 1 manager each and 50 sales reps divided evenly
 * All users get the 5 credit free plan
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Configuration
const PASSWORD = 'TestPassword123!'
const TEAMS = [
  { name: 'Team Alpha', managerName: 'Manager Alpha' },
  { name: 'Team Beta', managerName: 'Manager Beta' },
  { name: 'Team Gamma', managerName: 'Manager Gamma' }
]

// Rep distribution: 17, 17, 16
const REPS_PER_TEAM = [17, 17, 16]

// Store credentials for MD file
const credentials = {
  managers: [],
  reps: [],
  loginUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://dooriq.ai'
}

/**
 * Create an auth user with email confirmation
 */
async function createAuthUser(email, password, fullName) {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true, // Auto-confirm so they can login immediately
      user_metadata: { full_name: fullName }
    })

    if (error) {
      // If user already exists, try to get them
      if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
        console.log(`   ⚠️  User ${email} already exists, fetching...`)
        const { data: users } = await supabase.auth.admin.listUsers()
        const existingUser = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
        if (existingUser) {
          return { user: existingUser, error: null }
        }
      }
      throw error
    }

    return { user: data.user, error: null }
  } catch (error) {
    return { user: null, error }
  }
}

/**
 * Create user profile in users table
 */
async function createUserProfile(userId, email, fullName, role, teamId, repId) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: email.toLowerCase(),
      full_name: fullName,
      rep_id: repId,
      role: role,
      team_id: teamId,
      virtual_earnings: 0
    })
    .select()
    .single()

  if (error) {
    // If user already exists, update them
    if (error.code === '23505') {
      console.log(`   ⚠️  User profile already exists, updating...`)
      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update({
          role: role,
          team_id: teamId,
          full_name: fullName
        })
        .eq('id', userId)
        .select()
        .single()

      if (updateError) throw updateError
      return { data: updated, error: null }
    }
    throw error
  }

  return { data, error: null }
}

/**
 * Create session limits (5 credits for free plan)
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
    }, {
      onConflict: 'user_id'
    })

  if (error) {
    // If already exists, that's okay
    if (error.code !== '23505') {
      throw error
    }
  }
}

/**
 * Create a team
 */
async function createTeam(teamName, ownerId) {
  const { data, error } = await supabase
    .from('teams')
    .insert({
      name: teamName,
      owner_id: ownerId
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

/**
 * Create a manager user
 */
async function createManager(teamIndex, teamId) {
  const team = TEAMS[teamIndex]
  const email = `manager${teamIndex + 1}@test.dooriq.ai`
  const fullName = team.managerName
  const repId = `MGR-${Date.now()}-${teamIndex}`

  console.log(`\n👤 Creating manager ${teamIndex + 1}: ${fullName} (${email})`)

  // Create auth user
  const { user: authUser, error: authError } = await createAuthUser(email, PASSWORD, fullName)
  if (authError || !authUser) {
    throw new Error(`Failed to create auth user: ${authError?.message}`)
  }
  console.log(`   ✅ Auth user created: ${authUser.id}`)

  // Create user profile
  const { data: userProfile, error: profileError } = await createUserProfile(
    authUser.id,
    email,
    fullName,
    'manager',
    teamId,
    repId
  )
  if (profileError) {
    throw new Error(`Failed to create user profile: ${profileError.message}`)
  }
  console.log(`   ✅ User profile created`)

  // Create session limits
  await createSessionLimits(authUser.id)
  console.log(`   ✅ Session limits set (5 credits)`)

  credentials.managers.push({
    email,
    password: PASSWORD,
    fullName,
    role: 'manager',
    team: team.name,
    userId: authUser.id
  })

  return { authUser, userProfile }
}

/**
 * Create a sales rep user
 */
async function createRep(repNumber, teamId, teamName) {
  const email = `rep${repNumber}@test.dooriq.ai`
  const fullName = `Sales Rep ${repNumber}`
  const repId = `REP-${Date.now()}-${repNumber}`

  // Create auth user
  const { user: authUser, error: authError } = await createAuthUser(email, PASSWORD, fullName)
  if (authError || !authUser) {
    throw new Error(`Failed to create auth user for rep ${repNumber}: ${authError?.message}`)
  }

  // Create user profile
  const { data: userProfile, error: profileError } = await createUserProfile(
    authUser.id,
    email,
    fullName,
    'rep',
    teamId,
    repId
  )
  if (profileError) {
    throw new Error(`Failed to create user profile for rep ${repNumber}: ${profileError.message}`)
  }

  // Create session limits
  await createSessionLimits(authUser.id)

  credentials.reps.push({
    email,
    password: PASSWORD,
    fullName,
    role: 'rep',
    team: teamName,
    repNumber,
    userId: authUser.id
  })

  return { authUser, userProfile }
}

/**
 * Generate credentials markdown file
 */
function generateCredentialsFile() {
  const mdContent = `# Test Teams Credentials

Generated on: ${new Date().toISOString()}

## Overview

This document contains login credentials for test teams created for sales demo purposes.

**Total Users:** 53 (3 managers + 50 sales reps)
**Teams:** 3 teams (Team Alpha, Team Beta, Team Gamma)
**Plan:** Free Plan (5 credits per month)

## Login URL

${credentials.loginUrl}/auth/login

---

## Managers

${credentials.managers.map((m, i) => `
### Manager ${i + 1}: ${m.fullName}

- **Email:** \`${m.email}\`
- **Password:** \`${m.password}\`
- **Role:** ${m.role}
- **Team:** ${m.team}
- **User ID:** \`${m.userId}\`
`).join('\n')}

---

## Sales Reps

### Team Alpha (17 reps)

${credentials.reps.filter(r => r.team === 'Team Alpha').map(r => `
- **Rep ${r.repNumber}:** \`${r.email}\` / \`${r.password}\` - ${r.fullName}
`).join('')}

### Team Beta (17 reps)

${credentials.reps.filter(r => r.team === 'Team Beta').map(r => `
- **Rep ${r.repNumber}:** \`${r.email}\` / \`${r.password}\` - ${r.fullName}
`).join('')}

### Team Gamma (16 reps)

${credentials.reps.filter(r => r.team === 'Team Gamma').map(r => `
- **Rep ${r.repNumber}:** \`${r.email}\` / \`${r.password}\` - ${r.fullName}
`).join('')}

---

## Quick Reference

### All Manager Emails
${credentials.managers.map(m => `- ${m.email}`).join('\n')}

### All Rep Emails (by team)
${credentials.reps.filter(r => r.team === 'Team Alpha').map(r => r.email).join(', ')}
${credentials.reps.filter(r => r.team === 'Team Beta').map(r => r.email).join(', ')}
${credentials.reps.filter(r => r.team === 'Team Gamma').map(r => r.email).join(', ')}

---

## Notes

- All users use the same password: \`${PASSWORD}\`
- All users are on the Free Plan with 5 credits per month
- Managers can access the Manager Panel to view team analytics
- All users can login immediately (email confirmation bypassed for testing)
`

  const filePath = path.join(process.cwd(), 'TEST_TEAMS_CREDENTIALS.md')
  fs.writeFileSync(filePath, mdContent)
  console.log(`\n✅ Credentials file created: ${filePath}`)
}

/**
 * Main function
 */
async function createTestTeams() {
  console.log('🚀 Creating test teams...\n')
  console.log('Configuration:')
  console.log(`  - Teams: ${TEAMS.length}`)
  console.log(`  - Managers: ${TEAMS.length}`)
  console.log(`  - Sales Reps: 50 (${REPS_PER_TEAM.join(', ')} per team)`)
  console.log(`  - Plan: Free (5 credits/month)`)
  console.log(`  - Password: ${PASSWORD}\n`)

  const teams = []
  let repCounter = 1

  try {
    // Create teams and managers
    for (let i = 0; i < TEAMS.length; i++) {
      const team = TEAMS[i]
      console.log(`\n📦 Creating ${team.name}...`)

      // Create manager first (without team_id, we'll update after team creation)
      const { authUser: managerAuth } = await createManager(i, null)
      
      // Create team with manager as owner
      const teamData = await createTeam(team.name, managerAuth.id)
      teams.push(teamData)
      console.log(`   ✅ Team created: ${teamData.name} (ID: ${teamData.id})`)

      // Update manager's team_id and role to ensure they're linked
      const { error: updateError } = await supabase
        .from('users')
        .update({ team_id: teamData.id, role: 'manager' })
        .eq('id', managerAuth.id)

      if (updateError) {
        throw new Error(`Failed to update manager team_id: ${updateError.message}`)
      }
      console.log(`   ✅ Manager linked to team`)

      // Create reps for this team
      const repsToCreate = REPS_PER_TEAM[i]
      console.log(`\n   📋 Creating ${repsToCreate} sales reps for ${team.name}...`)
      
      for (let j = 0; j < repsToCreate; j++) {
        try {
          await createRep(repCounter, teamData.id, team.name)
          if ((j + 1) % 5 === 0) {
            console.log(`      ✅ Created ${j + 1}/${repsToCreate} reps...`)
          }
          repCounter++
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.error(`      ❌ Failed to create rep ${repCounter}:`, error.message)
          repCounter++
          // Continue with next rep instead of failing completely
        }
      }

      console.log(`   ✅ Created ${repsToCreate} reps for ${team.name}`)
    }

    console.log('\n✅ All teams, managers, and reps created successfully!')
    console.log(`\n📊 Summary:`)
    console.log(`   - Teams: ${teams.length}`)
    console.log(`   - Managers: ${credentials.managers.length}`)
    console.log(`   - Sales Reps: ${credentials.reps.length}`)
    console.log(`   - Total Users: ${credentials.managers.length + credentials.reps.length}`)

    // Generate credentials file
    generateCredentialsFile()

    console.log('\n🎉 Setup complete!')
    console.log('\n📝 Next steps:')
    console.log('   1. Check TEST_TEAMS_CREDENTIALS.md for login credentials')
    console.log('   2. Test manager panel access with manager accounts')
    console.log('   3. Verify team assignments in dashboard')
    console.log('   4. Confirm all users have 5 credits')

  } catch (error) {
    console.error('\n❌ Error creating test teams:', error)
    console.error('   Details:', error.message)
    process.exit(1)
  }
}

// Run the script
createTestTeams()

