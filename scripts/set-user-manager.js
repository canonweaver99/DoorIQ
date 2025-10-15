/**
 * Set User as Manager
 * Updates a user's role to manager
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const EMAIL_TO_UPDATE = 'canonweaver@loopline.design'

async function setUserAsManager() {
  console.log(`🔧 Setting ${EMAIL_TO_UPDATE} as manager...\n`)

  try {
    // Update user role
    const { data, error } = await supabase
      .from('users')
      .update({ role: 'manager' })
      .eq('email', EMAIL_TO_UPDATE)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating user:', error)
      return
    }

    console.log('✅ User updated successfully!')
    console.log(`  Name: ${data.full_name}`)
    console.log(`  Email: ${data.email}`)
    console.log(`  Role: ${data.role} (was: rep)`)
    console.log(`  ID: ${data.id}`)
    console.log('')
    console.log('🎯 You now have manager access!')
    console.log('   - Manager Panel will appear in navigation')
    console.log('   - You can invite team members')
    console.log('   - You can access team analytics')
    console.log('')
    console.log('🔄 Refresh your browser to see the changes')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

setUserAsManager()

