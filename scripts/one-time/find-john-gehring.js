require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function findJohnGehring() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name')
      .or('email.ilike.%john%gehring%,full_name.ilike.%john%gehring%,email.ilike.%gehring%,full_name.ilike.%gehring%')
      .limit(5)
    
    if (error) {
      console.error('❌ Error:', error.message)
      return
    }
    
    if (!data || data.length === 0) {
      console.log('❌ John Gehring not found in database')
      return
    }
    
    console.log('Found users:')
    data.forEach(user => {
      console.log(`  - ${user.full_name} (${user.email})`)
    })
    
    if (data.length === 1) {
      return data[0].email
    }
    
    return data[0].email // Return first match
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

findJohnGehring().then(email => {
  if (email) {
    console.log(`\n✅ Found email: ${email}`)
  }
  process.exit(0)
})

