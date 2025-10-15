/**
 * Check User Role Script
 * Verifies user role in the database
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkUserRole() {
  console.log('🔍 Checking user roles...\n')

  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('❌ Error fetching users:', error)
      return
    }

    console.log(`Found ${users.length} recent users:\n`)

    users.forEach(user => {
      console.log(`User: ${user.full_name || 'No name'}`)
      console.log(`  Email: ${user.email}`)
      console.log(`  Role: ${user.role}`)
      console.log(`  ID: ${user.id}`)
      console.log('')
    })

    // Check for managers
    const managers = users.filter(u => u.role === 'manager' || u.role === 'admin')
    console.log(`📊 Managers/Admins: ${managers.length}`)
    console.log(`📊 Reps: ${users.length - managers.length}`)

    if (managers.length === 0) {
      console.log('\n⚠️  No managers found! You may need to update a user role to "manager"')
      console.log('\nTo fix this, run:')
      console.log(`UPDATE users SET role = 'manager' WHERE email = 'your@email.com';`)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkUserRole()

