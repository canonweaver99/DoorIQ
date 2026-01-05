/**
 * Create Auth Accounts for Loopline Reps
 * Run this AFTER running the SQL migration 077_setup_loopline_organization.sql
 * This creates the Supabase Auth accounts for the 10 rep users
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

const repEmails = [
  'alex.anderson123@loopline.com',
  'jordan.brown456@loopline.com',
  'taylor.davis789@loopline.com',
  'morgan.garcia234@loopline.com',
  'casey.harris567@loopline.com',
  'riley.jackson890@loopline.com',
  'avery.johnson345@loopline.com',
  'quinn.martinez678@loopline.com',
  'blake.miller901@loopline.com',
  'cameron.moore234@loopline.com'
]

const password = 'Loopline2024!'

async function createAuthAccounts() {
  console.log('\n🔐 Creating auth accounts for Loopline reps...\n')

  // Get Loopline organization ID
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'Loopline')
    .single()

  if (orgError || !org) {
    console.error('❌ Loopline organization not found. Make sure you ran the SQL migration first.')
    process.exit(1)
  }

  // Get all Loopline rep users from database
  const { data: reps, error: fetchError } = await supabase
    .from('users')
    .select('id, email, full_name')
    .eq('organization_id', org.id)
    .eq('role', 'rep')

  if (fetchError) {
    console.error('❌ Error fetching reps:', fetchError)
    process.exit(1)
  }

  if (!reps || reps.length === 0) {
    console.error('❌ No rep users found. Make sure you ran the SQL migration first.')
    process.exit(1)
  }

  console.log(`Found ${reps.length} rep users\n`)

  for (const rep of reps) {
    try {
      // Check if auth user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === rep.email)

      if (existingUser) {
        console.log(`⚠️  Auth account already exists: ${rep.email}`)
        continue
      }

      // Create auth user with the same ID as the database user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        id: rep.id, // Use the same UUID from database
        email: rep.email,
        password: password,
        email_confirm: true,
        user_metadata: { full_name: rep.full_name }
      })

      if (authError) {
        console.error(`❌ Failed to create auth for ${rep.email}:`, authError.message)
        continue
      }

      console.log(`✅ Created auth account: ${rep.full_name} (${rep.email})`)
    } catch (error) {
      console.error(`❌ Error creating auth for ${rep.email}:`, error.message)
    }
  }

  console.log(`\n✅ Done! All auth accounts created.`)
  console.log(`\n📋 Login credentials:`)
  console.log(`   Password for all reps: ${password}`)
  console.log(`\n   Rep emails:`)
  repEmails.forEach((email, idx) => {
    console.log(`   ${idx + 1}. ${email}`)
  })
}

createAuthAccounts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

