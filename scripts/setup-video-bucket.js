/**
 * Setup video storage bucket in Supabase
 * Run with: node scripts/setup-video-bucket.js
 */

const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

async function setupVideoBucket() {
  const { createClient } = require('@supabase/supabase-js')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    console.error('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  console.log('📹 Setting up session-videos storage bucket...')
  
  // Read the migration file
  const migrationPath = path.join(__dirname, '../lib/supabase/migrations/051_create_video_storage_bucket.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')
  
  try {
    // Execute the migration
    console.log('🔧 Creating bucket and policies...')
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      // Try alternative method - execute statements one by one
      console.log('⚠️  RPC method failed, trying direct execution...')
      
      // Create bucket directly via REST API
      const bucketResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          id: 'session-videos',
          name: 'session-videos',
          public: true,
          file_size_limit: 104857600,
          allowed_mime_types: ['video/webm', 'video/mp4', 'video/quicktime']
        })
      })
      
      if (bucketResponse.ok) {
        console.log('✅ Bucket created successfully')
      } else {
        const bucketError = await bucketResponse.text()
        if (bucketError.includes('already exists')) {
          console.log('ℹ️  Bucket already exists, updating policies...')
        } else {
          console.error('❌ Failed to create bucket:', bucketError)
        }
      }
      
      // Now we need to create the policies via SQL
      console.log('🔐 Creating storage policies via SQL...')
      
      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('INSERT INTO storage.buckets'))
      
      for (const statement of statements) {
        if (!statement) continue
        
        console.log('  Executing:', statement.substring(0, 60) + '...')
        const { error: stmtError } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        })
        
        if (stmtError && !stmtError.message.includes('already exists')) {
          console.warn('  ⚠️  Warning:', stmtError.message)
        }
      }
    }
    
    console.log('✅ Video storage bucket setup complete!')
    console.log('')
    console.log('📝 Next steps:')
    console.log('1. Go to Supabase Dashboard > Storage')
    console.log('2. Verify the "session-videos" bucket exists')
    console.log('3. Check that it\'s marked as Public')
    console.log('4. Test uploading a video in a practice session')
    console.log('')
    
  } catch (error) {
    console.error('❌ Error setting up video bucket:', error.message)
    console.log('')
    console.log('🔧 Manual Setup Instructions:')
    console.log('1. Go to Supabase Dashboard > Storage')
    console.log('2. Click "Create new bucket"')
    console.log('3. Set ID to: session-videos')
    console.log('4. Enable "Public bucket"')
    console.log('5. Set file size limit to: 100MB')
    console.log('6. Add allowed MIME types: video/webm, video/mp4, video/quicktime')
    console.log('')
    console.log('Then run this SQL in the SQL Editor:')
    console.log(sql)
    process.exit(1)
  }
}

setupVideoBucket().catch(console.error)

