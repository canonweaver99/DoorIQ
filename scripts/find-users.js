require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function findUsers() {
  const names = [
    { search: 'peter douglas', label: 'Peter Douglas' },
    { search: 'lincoln weaver', label: 'Lincoln Weaver' }
  ]
  
  const results = {}
  
  for (const { search, label } of names) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name')
        .or(`email.ilike.%${search.split(' ')[0]}%,full_name.ilike.%${search.split(' ')[0]}%,email.ilike.%${search.split(' ')[1]}%,full_name.ilike.%${search.split(' ')[1]}%`)
        .limit(5)
      
      if (error) {
        console.error(`❌ Error finding ${label}:`, error.message)
        continue
      }
      
      if (!data || data.length === 0) {
        console.log(`❌ ${label} not found`)
        continue
      }
      
      console.log(`\n✅ Found ${label}:`)
      data.forEach(user => {
        console.log(`  - ${user.full_name} (${user.email})`)
      })
      
      results[label] = data[0].email
    } catch (error) {
      console.error(`❌ Error finding ${label}:`, error)
    }
  }
  
  return results
}

findUsers().then(results => {
  console.log('\n📧 Email addresses found:')
  Object.entries(results).forEach(([name, email]) => {
    console.log(`  ${name}: ${email}`)
  })
  process.exit(0)
})

