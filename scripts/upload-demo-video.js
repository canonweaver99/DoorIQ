const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceKey
)

async function uploadDemoVideo() {
  try {
    const videoPath = path.join(__dirname, '..', 'public', 'Demo Video Home Compressed.mp4')
    
    if (!fs.existsSync(videoPath)) {
      console.error(`❌ Video file not found at: ${videoPath}`)
      process.exit(1)
    }

    console.log('📤 Uploading demo video to Supabase...')
    console.log(`   File: ${videoPath}`)
    
    // Read the video file
    const videoBuffer = fs.readFileSync(videoPath)
    const fileName = 'demo-video-home.mp4'
    const filePath = `public/${fileName}`

    // Check available buckets - prefer demo-assets since user created it
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      throw listError
    }
    
    console.log('📦 Available buckets:', buckets?.map(b => b.name).join(', ') || 'none')
    
    // Try Demo-Assets first (user created this bucket - note capitalization)
    let bucketName = buckets?.find(b => b.name === 'Demo-Assets' || b.name === 'demo-assets')?.name
    
    if (!bucketName) {
      // Fall back to session-videos if demo-assets doesn't exist
      bucketName = buckets?.find(b => b.name === 'session-videos')?.name
      
      if (!bucketName) {
        console.error('❌ No suitable bucket found. Please create Demo-Assets bucket in Supabase Dashboard.')
        throw new Error('Bucket not found')
      }
    }

    // Upload to bucket
    await uploadToBucket(bucketName, filePath, videoBuffer, fileName)

  } catch (error) {
    console.error('❌ Error uploading video:', error)
    process.exit(1)
  }
}

async function uploadToBucket(bucketName, filePath, buffer, fileName) {
  console.log(`   Bucket: ${bucketName}`)
  console.log(`   Path: ${filePath}`)

  // Upload the file
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, buffer, {
      contentType: 'video/mp4',
      upsert: true // Overwrite if exists
    })

  if (uploadError) {
    console.error('❌ Upload error:', uploadError)
    throw uploadError
  }

  console.log('✅ File uploaded successfully')
  console.log(`   Upload path: ${uploadData.path}`)

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath)

  console.log('\n🎉 Upload complete!')
  console.log(`\n📹 Public URL: ${publicUrl}`)
  console.log('\n💡 Copy this URL and update the video src in components/ui/interactive-demo-section.tsx')
  console.log(`   Current src: /Demo Video Home.mp4`)
  console.log(`   New src: ${publicUrl}`)
}

uploadDemoVideo()

