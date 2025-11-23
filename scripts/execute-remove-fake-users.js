#!/usr/bin/env node

/**
 * Script to remove all fake/mock users from the database
 * 
 * This script will delete:
 * - Test accounts (@test.dooriq.ai)
 * - AI agent accounts (@dooriq-agent.ai)
 * - Other test patterns (@example.com, @test.com, etc.)
 * - Users with test/demo/mock/fake in their names
 * - Related sessions and data
 * - Empty test teams and organizations
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function previewDeletions() {
  console.log('📋 Preview: Users that will be deleted:\n')
  
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      full_name,
      role,
      organization_id,
      organizations(name)
    `)
    .or(`
      email.ilike.%@test.dooriq.ai,
      email.ilike.%@dooriq-agent.ai,
      email.ilike.%@example.com,
      email.ilike.%@test.com,
      email.ilike.%@mock.com,
      email.ilike.%@fake.com,
      full_name.ilike.%test%,
      full_name.ilike.%demo%,
      full_name.ilike.%mock%,
      full_name.ilike.%fake%
    `)
    .order('email')

  if (error) {
    console.error('❌ Error fetching users:', error)
    return false
  }

  if (!data || data.length === 0) {
    console.log('✅ No fake/mock users found!')
    return false
  }

  console.log(`Found ${data.length} fake/mock users:\n`)
  data.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email} (${user.full_name}) - ${user.role}`)
    if (user.organizations) {
      console.log(`   Organization: ${user.organizations.name || 'None'}`)
    }
  })
  console.log('')
  return true
}

async function executeDeletion() {
  console.log('🚀 Executing deletion...\n')

  // Read the SQL file
  const sqlPath = path.join(__dirname, 'remove_fake_users.sql')
  const sqlContent = fs.readFileSync(sqlPath, 'utf8')

  // Extract just the DO block (STEP 2)
  const doBlockMatch = sqlContent.match(/DO \$\$[\s\S]*?END \$\$;/)
  if (!doBlockMatch) {
    console.error('❌ Could not find DO block in SQL file')
    return false
  }

  const doBlockSQL = doBlockMatch[0]

  // Execute the SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql: doBlockSQL })

  if (error) {
    // Try alternative method - execute via direct query
    console.log('⚠️  RPC method failed, trying direct execution...')
    
    // Split into individual statements and execute
    const statements = [
      // Delete user_session_limits
      `DELETE FROM user_session_limits WHERE user_id IN (
        SELECT id FROM users WHERE 
          email LIKE '%@test.dooriq.ai' OR
          email LIKE '%@dooriq-agent.ai' OR
          email LIKE '%@example.com' OR
          email LIKE '%@test.com' OR
          email LIKE '%@mock.com' OR
          email LIKE '%@fake.com' OR
          full_name ILIKE '%test%' OR
          full_name ILIKE '%demo%' OR
          full_name ILIKE '%mock%' OR
          full_name ILIKE '%fake%'
      )`,
      
      // Delete users
      `DELETE FROM users WHERE 
        email LIKE '%@test.dooriq.ai' OR
        email LIKE '%@dooriq-agent.ai' OR
        email LIKE '%@example.com' OR
        email LIKE '%@test.com' OR
        email LIKE '%@mock.com' OR
        email LIKE '%@fake.com' OR
        full_name ILIKE '%test%' OR
        full_name ILIKE '%demo%' OR
        full_name ILIKE '%mock%' OR
        full_name ILIKE '%fake%'`,
      
      // Delete empty test teams
      `DELETE FROM teams WHERE name IN ('Team Alpha', 'Team Beta', 'Team Gamma')
        AND id NOT IN (SELECT DISTINCT team_id FROM users WHERE team_id IS NOT NULL)`,
      
      // Delete empty test organizations
      `DELETE FROM organizations WHERE 
        (name ILIKE '%test%' OR name ILIKE '%demo%' OR name ILIKE '%mock%' OR name ILIKE '%fake%' OR name IN ('Team Alpha', 'Team Beta', 'Team Gamma'))
        AND id NOT IN (SELECT DISTINCT organization_id FROM users WHERE organization_id IS NOT NULL)`
    ]

    for (const statement of statements) {
      const { error: stmtError } = await supabase.from('users').select('id').limit(0)
      // Use a workaround - we'll need to execute via Supabase dashboard or psql
      console.log('⚠️  Direct SQL execution requires database admin access.')
      console.log('   Please run the SQL file directly in Supabase SQL Editor:')
      console.log(`   File: ${sqlPath}`)
      return false
    }
  }

  console.log('✅ Deletion executed successfully!')
  return true
}

async function verifyDeletion() {
  console.log('\n🔍 Verifying deletion...\n')

  const { data, error } = await supabase
    .from('users')
    .select('email, full_name')
    .or(`
      email.ilike.%@test.dooriq.ai,
      email.ilike.%@dooriq-agent.ai,
      email.ilike.%@example.com,
      email.ilike.%@test.com,
      email.ilike.%@mock.com,
      email.ilike.%@fake.com,
      full_name.ilike.%test%,
      full_name.ilike.%demo%,
      full_name.ilike.%mock%,
      full_name.ilike.%fake%
    `)

  if (error) {
    console.error('❌ Error verifying:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('✅ Verification passed! No fake/mock users remaining.')
  } else {
    console.log(`⚠️  Warning: ${data.length} fake/mock users still found:`)
    data.forEach(user => {
      console.log(`   - ${user.email} (${user.full_name})`)
    })
  }

  // Show summary
  const { data: summary } = await supabase
    .from('users')
    .select('role')
  
  if (summary) {
    const roleCounts = summary.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {})
    
    console.log('\n📊 Remaining users by role:')
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`)
    })
  }
}

async function main() {
  console.log('='.repeat(60))
  console.log('  Remove Fake/Mock Users Script')
  console.log('='.repeat(60))
  console.log('')

  // Step 1: Preview
  const hasUsersToDelete = await previewDeletions()
  
  if (!hasUsersToDelete) {
    console.log('✅ No fake users to delete. Exiting.')
    return
  }

  // Confirm deletion
  console.log('⚠️  WARNING: This will permanently delete the users listed above!')
  console.log('   This action cannot be undone.\n')
  
  // For safety, we'll require manual SQL execution
  console.log('📝 To execute the deletion:')
  console.log('   1. Open Supabase Dashboard')
  console.log('   2. Go to SQL Editor')
  console.log('   3. Copy and paste the contents of: scripts/remove_fake_users.sql')
  console.log('   4. Run STEP 2 (the DO block)')
  console.log('   5. Run STEP 3 (verification queries)\n')
  
  console.log('   Or run this SQL file directly via psql:\n')
  console.log(`   psql -h [your-db-host] -U postgres -d postgres -f ${path.join(__dirname, 'remove_fake_users.sql')}\n`)

  // Verify after (if they want to run it manually)
  console.log('After running the SQL, you can verify with:')
  console.log('   node scripts/execute-remove-fake-users.js --verify\n')
}

// Handle command line arguments
if (process.argv.includes('--verify')) {
  verifyDeletion().catch(console.error)
} else {
  main().catch(console.error)
}

