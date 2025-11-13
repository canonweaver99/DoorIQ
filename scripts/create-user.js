/**
 * Create a single user account
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

async function createUser(email, password, fullName) {
  try {
    console.log(`\n👤 Creating user: ${email}`)

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true, // Auto-confirm so they can login immediately
      user_metadata: { full_name: fullName }
    })

    if (authError) {
      if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
        console.log(`   ⚠️  User ${email} already exists in Auth`)
        // Try to get existing user
        const { data: users } = await supabase.auth.admin.listUsers()
        const existingUser = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
        if (existingUser) {
          console.log(`   ✅ Found existing user: ${existingUser.id}`)
          return { user: existingUser, error: null }
        }
      }
      throw authError
    }

    const userId = authData.user.id
    console.log(`   ✅ Auth user created: ${userId}`)

    // Generate rep ID
    const repId = `REP-${Date.now().toString().slice(-6)}`

    // Create user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email.toLowerCase(),
        full_name: fullName,
        rep_id: repId,
        role: 'rep',
        virtual_earnings: 0
      })
      .select()
      .single()

    if (profileError) {
      if (profileError.code === '23505') {
        console.log(`   ⚠️  User profile already exists, updating...`)
        const { data: updated, error: updateError } = await supabase
          .from('users')
          .update({
            full_name: fullName
          })
          .eq('id', userId)
          .select()
          .single()

        if (updateError) throw updateError
        console.log(`   ✅ User profile updated`)
        return { user: authData.user, profile: updated, error: null }
      }
      throw profileError
    }

    console.log(`   ✅ User profile created`)

    // Create session limits (5 credits for free plan)
    const today = new Date().toISOString().split('T')[0]
    const { error: limitsError } = await supabase
      .from('user_session_limits')
      .upsert({
        user_id: userId,
        sessions_this_month: 0,
        sessions_limit: 5,
        last_reset_date: today
      }, {
        onConflict: 'user_id'
      })

    if (limitsError && limitsError.code !== '23505') {
      console.log(`   ⚠️  Warning: Could not set session limits: ${limitsError.message}`)
    } else {
      console.log(`   ✅ Session limits set (5 credits)`)
    }

    console.log(`\n✅ User created successfully!`)
    console.log(`\n📝 Account Details:`)
    console.log(`   - Email: ${email}`)
    console.log(`   - Password: ${password}`)
    console.log(`   - Full Name: ${fullName}`)
    console.log(`   - User ID: ${userId}`)
    console.log(`   - Rep ID: ${repId}`)
    console.log(`   - Role: rep`)
    console.log(`   - Credits: 5`)

    return { user: authData.user, profile: userProfile, error: null }
  } catch (error) {
    console.error(`\n❌ Error creating user:`, error.message)
    return { user: null, profile: null, error }
  }
}

// Get email and password from command line arguments or use defaults
const email = process.argv[2] || 'peterdouglas32@gmail.com'
const password = process.argv[3] || '1234567'
const fullName = process.argv[4] || email.split('@')[0]

// Run the script
createUser(email, password, fullName)
  .then(({ error }) => {
    if (error) {
      process.exit(1)
    }
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

