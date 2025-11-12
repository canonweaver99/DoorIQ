const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function makeBucketPublic() {
  try {
    console.log('🔓 Making Demo-Assets bucket public...')
    
    // Note: Supabase JS client doesn't have a direct method to update bucket settings
    // We need to use the REST API or SQL
    
    // Option 1: Use SQL to update the bucket
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        UPDATE storage.buckets 
        SET public = true 
        WHERE id = 'Demo-Assets';
      `
    }).catch(() => {
      // If RPC doesn't work, we'll need to use the REST API
      return { data: null, error: { message: 'RPC not available' } }
    })
    
    if (error && !error.message?.includes('not available')) {
      console.error('❌ Error:', error)
      console.log('\n📝 You need to make the bucket public manually:')
      console.log('   1. Go to Supabase Dashboard → Storage')
      console.log('   2. Click on "Demo-Assets" bucket')
      console.log('   3. Click "Settings" tab')
      console.log('   4. Enable "Public bucket"')
      console.log('   5. Save changes')
      return
    }
    
    console.log('✅ Bucket should now be public')
    console.log('\n💡 If this didn\'t work, make it public manually in the Supabase Dashboard')
    
  } catch (error) {
    console.error('❌ Error:', error)
    console.log('\n📝 Please make the bucket public manually:')
    console.log('   1. Go to Supabase Dashboard → Storage')
    console.log('   2. Click on "Demo-Assets" bucket')
    console.log('   3. Click "Settings" tab')
    console.log('   4. Enable "Public bucket"')
    console.log('   5. Save changes')
  }
}

makeBucketPublic()

