/**
 * Update All Users Password
 * Updates passwords for ALL users in the system to the new password
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

async function updateAllUsersPassword() {
  console.log('🔐 Updating passwords for ALL users...\n')
  console.log(`📝 New password: ${NEW_PASSWORD}\n`)

  try {
    // Get all users from auth
    let allUsers = []
    let page = 1
    const perPage = 1000
    
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage
      })
      
      if (error) {
        throw error
      }
      
      if (!data?.users || data.users.length === 0) {
        break
      }
      
      allUsers = allUsers.concat(data.users)
      
      if (data.users.length < perPage) {
        break
      }
      
      page++
    }

    console.log(`📋 Found ${allUsers.length} total users to update\n`)

    let successCount = 0
    let errorCount = 0

    for (const user of allUsers) {
      try {
        // Skip users without email
        if (!user.email) {
          console.log(`   ⚠️  Skipping user ${user.id} (no email)`)
          continue
        }

        // Update password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          { password: NEW_PASSWORD }
        )

        if (updateError) {
          console.error(`   ❌ Failed to update ${user.email}:`, updateError.message)
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
        console.error(`   ❌ Error updating ${user.email || user.id}:`, error.message)
        errorCount++
      }
    }

    console.log(`\n✅ Password update complete!`)
    console.log(`   - Successfully updated: ${successCount}`)
    console.log(`   - Errors: ${errorCount}`)
    console.log(`   - New password: ${NEW_PASSWORD}`)
    console.log(`\n📝 All users can now login with password: ${NEW_PASSWORD}`)

  } catch (error) {
    console.error('\n❌ Error updating passwords:', error)
    process.exit(1)
  }
}

updateAllUsersPassword()

