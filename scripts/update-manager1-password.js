/**
 * Update Manager1 Password
 * Updates password for manager1@test.dooriq.ai
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

const EMAIL = 'manager1@test.dooriq.ai'
const NEW_PASSWORD = 'a123456' // Using 'a123456' because Supabase requires at least one letter and one number

async function updateManager1Password() {
  console.log(`🔐 Updating password for ${EMAIL}...\n`)

  try {
    // Get all users to find manager1
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      throw listError
    }

    let user = usersData?.users?.find(u => u.email?.toLowerCase() === EMAIL.toLowerCase())
    let isNewUser = false
    let passwordAlreadyUpdated = false
    
    if (!user) {
      console.log(`⚠️  User not found in active list: ${EMAIL}`)
      console.log(`🔧 Attempting to create or recover user...\n`)
      
      // Try to create the user (will fail if exists)
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: EMAIL.toLowerCase(),
        password: NEW_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'Manager Alpha' }
      })

      if (createError) {
        if (createError.message.includes('already been registered')) {
          console.log(`⚠️  User exists but may be deleted or hidden`)
          console.log(`🔧 Trying to find user ID from database...\n`)
          
          // Try to get user ID from the users table
          const { data: dbUser, error: dbError } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', EMAIL.toLowerCase())
            .single()
          
          if (dbUser && dbUser.id) {
            console.log(`✅ Found user ID in database: ${dbUser.id}`)
            console.log(`🔧 Attempting to update password via user ID...\n`)
            
            // Try to update using the ID from database
            const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
              dbUser.id,
              { 
                password: NEW_PASSWORD,
                email_confirm: true
              }
            )
            
            if (updateError) {
              console.error(`❌ Failed to update: ${updateError.message}`)
              throw new Error(`Cannot update password. User may be soft-deleted. Error: ${updateError.message}`)
            }
            
            user = updatedUser.user || { id: dbUser.id, email: EMAIL }
            passwordAlreadyUpdated = true
            console.log(`✅ Password updated successfully via database lookup!`)
          } else {
            console.log(`⚠️  User not found in database either`)
            console.log(`   Please update password manually in Supabase dashboard`)
            throw new Error(`User exists in auth but cannot be found. Email: ${EMAIL}`)
          }
        } else {
          throw new Error(`Failed to create user: ${createError.message}`)
        }
      } else {
        user = newUser.user
        isNewUser = true
        console.log(`✅ User created: ${user.email}`)
        console.log(`   ID: ${user.id}\n`)

        // Create user profile
        const { data: team } = await supabase
          .from('teams')
          .select('id')
          .eq('name', 'Team Alpha')
          .single()

        const teamId = team?.id || null

        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: EMAIL.toLowerCase(),
            full_name: 'Manager Alpha',
            rep_id: `MGR-${Date.now()}-1`,
            role: 'manager',
            team_id: teamId,
            virtual_earnings: 0
          })

        if (profileError && profileError.code !== '23505') {
          console.warn(`⚠️  Profile creation warning: ${profileError.message}`)
        } else {
          console.log(`✅ User profile created`)
        }

        // Create session limits
        const today = new Date().toISOString().split('T')[0]
        await supabase
          .from('user_session_limits')
          .upsert({
            user_id: user.id,
            sessions_this_month: 0,
            sessions_limit: 5,
            last_reset_date: today
          }, { onConflict: 'user_id' })

        console.log(`✅ Session limits created\n`)
      }
    }
    
    // Update password (for both new and existing users)
    if (!isNewUser && !passwordAlreadyUpdated) {
      console.log(`✅ Found user: ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}\n`)

      console.log(`🔧 Updating password to: ${NEW_PASSWORD}...`)
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { 
          password: NEW_PASSWORD,
          email_confirm: true // Ensure email is confirmed
        }
      )

      if (updateError) {
        throw new Error(`Failed to update password: ${updateError.message}`)
      }

      console.log(`✅ Password updated successfully!`)
    }

    console.log(`\n📝 Login credentials:`)
    console.log(`   Email: ${EMAIL}`)
    console.log(`   Password: ${NEW_PASSWORD}`)

  } catch (error) {
    console.error('\n❌ Error updating password:', error.message)
    process.exit(1)
  }
}

updateManager1Password()

