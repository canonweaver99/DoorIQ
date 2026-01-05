#!/usr/bin/env node

/**
 * Script to remove all fake/mock users from the database
 * 
 * This script will delete:
 * - Test accounts (@test.dooriq.ai)
 * - AI agent accounts (@dooriq-agent.ai)
 * - Other test patterns (@example.com, @test.com, etc.)
 * - Users with test/demo/mock/fake in their names
 * - Related sessions and data (via CASCADE)
 * - Empty test teams and organizations
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function findFakeUsers() {
  // Fetch all users and filter client-side (more reliable)
  const { data: allUsers, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, organization_id')
    .order('email')

  if (error) {
    console.error('❌ Error fetching users:', error)
    return []
  }

  if (!allUsers) return []

  // Filter for fake/mock users
  return allUsers.filter(user => {
    const email = (user.email || '').toLowerCase()
    const name = (user.full_name || '').toLowerCase()
    return email.includes('@test.dooriq.ai') ||
           email.includes('@dooriq-agent.ai') ||
           email.includes('@example.com') ||
           email.includes('@test.com') ||
           email.includes('@mock.com') ||
           email.includes('@fake.com') ||
           name.includes('test') ||
           name.includes('demo') ||
           name.includes('mock') ||
           name.includes('fake')
  })
}

async function deleteFakeUsers() {
  console.log('='.repeat(60))
  console.log('  Remove Fake/Mock Users')
  console.log('='.repeat(60))
  console.log('')

  // Step 1: Find fake users
  console.log('🔍 Finding fake/mock users...\n')
  const fakeUsers = await findFakeUsers()

  if (fakeUsers.length === 0) {
    console.log('✅ No fake/mock users found!')
    console.log('')
    console.log('💡 If you expected to find fake users, they may have already been deleted.')
    console.log('   You can also run the SQL file directly in Supabase SQL Editor:')
    console.log('   File: scripts/remove_fake_users.sql\n')
    return
  }

  console.log(`Found ${fakeUsers.length} fake/mock users:\n`)
  fakeUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email} (${user.full_name}) - ${user.role}`)
  })
  console.log('')

  // Step 2: Delete user_session_limits
  console.log('🗑️  Deleting user_session_limits...')
  const userIds = fakeUsers.map(u => u.id)
  
  const { error: limitsError } = await supabase
    .from('user_session_limits')
    .delete()
    .in('user_id', userIds)

  if (limitsError) {
    console.error('⚠️  Error deleting session limits:', limitsError.message)
  } else {
    console.log(`✅ Deleted session limits for ${fakeUsers.length} users\n`)
  }

  // Step 3: Delete users (this will CASCADE delete related records)
  console.log('🗑️  Deleting users (this will also delete their sessions, etc.)...')
  
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .in('id', userIds)

  if (deleteError) {
    console.error('❌ Error deleting users:', deleteError)
    return
  }

  console.log(`✅ Deleted ${fakeUsers.length} fake/mock users\n`)

  // Step 4: Delete empty test teams
  console.log('🗑️  Checking for empty test teams...')
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name')
    .in('name', ['Team Alpha', 'Team Beta', 'Team Gamma'])

  if (teams && teams.length > 0) {
    for (const team of teams) {
      const { data: teamUsers } = await supabase
        .from('users')
        .select('id')
        .eq('team_id', team.id)
        .limit(1)

      if (!teamUsers || teamUsers.length === 0) {
        const { error: teamError } = await supabase
          .from('teams')
          .delete()
          .eq('id', team.id)

        if (teamError) {
          console.error(`⚠️  Error deleting team ${team.name}:`, teamError.message)
        } else {
          console.log(`✅ Deleted empty team: ${team.name}`)
        }
      }
    }
  }
  console.log('')

  // Step 5: Delete empty test organizations
  console.log('🗑️  Checking for empty test organizations...')
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .or('name.ilike.%test%,name.ilike.%demo%,name.ilike.%mock%,name.ilike.%fake%')

  if (orgs && orgs.length > 0) {
    for (const org of orgs) {
      const { data: orgUsers } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', org.id)
        .limit(1)

      if (!orgUsers || orgUsers.length === 0) {
        const { error: orgError } = await supabase
          .from('organizations')
          .delete()
          .eq('id', org.id)

        if (orgError) {
          console.error(`⚠️  Error deleting organization ${org.name}:`, orgError.message)
        } else {
          console.log(`✅ Deleted empty organization: ${org.name}`)
        }
      }
    }
  }
  console.log('')

  // Step 6: Verify
  console.log('🔍 Verifying deletion...\n')
  const remainingFakeUsers = await findFakeUsers()

  if (remainingFakeUsers.length === 0) {
    console.log('✅ Verification passed! No fake/mock users remaining.\n')
  } else {
    console.log(`⚠️  Warning: ${remainingFakeUsers.length} fake/mock users still found:`)
    remainingFakeUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.full_name})`)
    })
    console.log('')
  }

  // Show summary
  const { data: allUsers } = await supabase
    .from('users')
    .select('role')

  if (allUsers) {
    const roleCounts = allUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {})

    console.log('📊 Remaining users by role:')
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`)
    })
  }

  console.log('\n🎉 Cleanup complete!')
}

// Run the script
deleteFakeUsers().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})

