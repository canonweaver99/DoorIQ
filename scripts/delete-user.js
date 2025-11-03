/**
 * Delete User Script
 * Removes a user from both the database and auth
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteUser(searchTerm) {
  console.log(`🔍 Searching for user: ${searchTerm}\n`)

  try {
    // First, search for users in the users table (partial match)
    const { data: usersData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
      .limit(10)

    if (userError) {
      console.error('❌ Error searching users:', userError)
      return
    }

    if (!usersData || usersData.length === 0) {
      console.log('⚠️  No users found in database matching:', searchTerm)
      console.log('   Searching in auth...\n')
    } else if (usersData.length > 1) {
      console.log(`⚠️  Found ${usersData.length} users matching "${searchTerm}":\n`)
      usersData.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.full_name || 'No name'} - ${u.email} (${u.id})`)
      })
      console.log('\n❌ Please be more specific with the email or full name')
      return
    }

    // If we found exactly one user, use it
    let userData = usersData && usersData.length === 1 ? usersData[0] : null
    let userId = null

    if (userData) {
      userId = userData.id
      console.log(`✅ Found user in database:`)
      console.log(`   ID: ${userId}`)
      console.log(`   Name: ${userData.full_name}`)
      console.log(`   Email: ${userData.email}\n`)

      // Delete from user_session_limits
      console.log('🗑️  Deleting user_session_limits...')
      const { error: limitsError } = await supabase
        .from('user_session_limits')
        .delete()
        .eq('user_id', userId)

      if (limitsError) {
        console.error('⚠️  Error deleting session limits:', limitsError.message)
      } else {
        console.log('✅ Deleted user_session_limits\n')
      }

      // Delete from users table
      console.log('🗑️  Deleting from users table...')
      const { error: deleteUserError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (deleteUserError) {
        console.error('❌ Error deleting user from database:', deleteUserError)
        return
      }
      console.log('✅ Deleted from users table\n')
    } else {
      console.log('⚠️  User not found in database, checking auth...\n')
    }

    // If we don't have userId yet, try to find user in auth
    if (!userId) {
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      const authUser = authUsers?.users?.find((u) => 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.user_metadata?.full_name && u.user_metadata.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      
      if (authUser) {
        userId = authUser.id
        console.log(`✅ Found user in auth:`)
        console.log(`   ID: ${userId}`)
        console.log(`   Email: ${authUser.email}`)
        if (authUser.user_metadata?.full_name) {
          console.log(`   Name: ${authUser.user_metadata.full_name}`)
        }
        console.log('')
      } else {
        console.log('⚠️  User not found in auth either\n')
        console.log('💡 Make sure you have the correct email or name')
        return
      }
    }

    // Delete from auth
    if (userId) {
      console.log('🗑️  Deleting from auth...')
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId)

      if (deleteAuthError) {
        console.error('❌ Error deleting user from auth:', deleteAuthError)
        return
      }
      console.log('✅ Deleted from auth\n')
    }

    console.log('✅ User deletion complete!')
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Get search term from command line argument
const searchTerm = process.argv[2]

if (!searchTerm) {
  console.error('❌ Please provide an email or name to search for')
  console.log('Usage: node scripts/delete-user.js <email-or-name>')
  console.log('Example: node scripts/delete-user.js bennett')
  console.log('Example: node scripts/delete-user.js bennett@example.com')
  process.exit(1)
}

deleteUser(searchTerm)
