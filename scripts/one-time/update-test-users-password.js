/**
 * Update Test Users Password
 * Updates passwords for all test managers and reps to the new password
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

const NEW_PASSWORD = 'a123456'

async function updateTestUsersPassword() {
  console.log('🔐 Updating passwords for test users...\n')

  try {
    // Get all test users (managers and reps)
    const testEmails = []
    
    // Add managers
    for (let i = 1; i <= 3; i++) {
      testEmails.push(`manager${i}@test.dooriq.ai`)
    }
    
    // Add reps
    for (let i = 1; i <= 50; i++) {
      testEmails.push(`rep${i}@test.dooriq.ai`)
    }

    console.log(`📋 Found ${testEmails.length} test users to update\n`)

    let successCount = 0
    let errorCount = 0

    for (const email of testEmails) {
      try {
        // Get user by email from auth
        const { data: users, error: listError } = await supabase.auth.admin.listUsers()
        
        if (listError) {
          throw listError
        }

        const user = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
        
        if (!user) {
          console.log(`   ⚠️  User not found: ${email}`)
          errorCount++
          continue
        }

        // Update password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          { password: NEW_PASSWORD }
        )

        if (updateError) {
          console.error(`   ❌ Failed to update ${email}:`, updateError.message)
          errorCount++
        } else {
          successCount++
          if (successCount % 10 === 0) {
            console.log(`   ✅ Updated ${successCount} users...`)
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50))
      } catch (error) {
        console.error(`   ❌ Error updating ${email}:`, error.message)
        errorCount++
      }
    }

    console.log(`\n✅ Password update complete!`)
    console.log(`   - Successfully updated: ${successCount}`)
    console.log(`   - Errors: ${errorCount}`)
    console.log(`   - New password: ${NEW_PASSWORD}`)
    console.log(`\n📝 Note: Update TEST_TEAMS_CREDENTIALS.md with the new password`)

  } catch (error) {
    console.error('\n❌ Error updating passwords:', error)
    process.exit(1)
  }
}

updateTestUsersPassword()

