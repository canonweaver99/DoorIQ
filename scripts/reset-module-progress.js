/**
 * Script to reset all module progress for a user
 * Usage: node scripts/reset-module-progress.js [user_email]
 * 
 * If no email is provided, it will prompt for one
 */

const { createClient } = require('@supabase/supabase-js')
const readline = require('readline')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetProgress(userEmail) {
  try {
    // Find user by email
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', userEmail)
      .single()

    if (userError || !users) {
      console.error(`❌ User not found: ${userEmail}`)
      process.exit(1)
    }

    const userId = users.id
    console.log(`📧 Found user: ${users.full_name || users.email} (${userId})`)

    // Delete all progress for this user
    const { error: deleteError } = await supabase
      .from('user_module_progress')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('❌ Error deleting progress:', deleteError)
      process.exit(1)
    }

    console.log('✅ Successfully reset all module progress!')
    console.log('   All modules are now at 0% completion.')
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Get email from command line or prompt
const userEmail = process.argv[2]

if (userEmail) {
  resetProgress(userEmail)
} else {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question('Enter user email to reset progress: ', (email) => {
    resetProgress(email.trim())
    rl.close()
  })
}

