import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function setupVideoStorage() {
  try {
    console.log('🎬 Setting up video storage bucket...')

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'session-videos')
    
    if (bucketExists) {
      console.log('✅ session-videos bucket already exists')
    } else {
      // Create the bucket
      const { data, error } = await supabase.storage.createBucket('session-videos', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 500, // 500MB limit
        allowedMimeTypes: ['video/webm', 'video/mp4', 'video/quicktime']
      })

      if (error) {
        console.error('Error creating bucket:', error)
        return
      }

      console.log('✅ Created session-videos bucket')
    }

    // Set up bucket policies
    console.log('📝 Setting up storage policies...')

    // The policies would typically be set via SQL in the Supabase dashboard
    console.log(`
To complete setup, run this SQL in your Supabase SQL editor:

-- Allow authenticated users to upload their own videos
CREATE POLICY "Users can upload their own session videos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'session-videos' AND auth.uid()::text = (string_to_array(name, '/'))[2]);

-- Allow authenticated users to view their own videos
CREATE POLICY "Users can view their own session videos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'session-videos' AND auth.uid()::text = (string_to_array(name, '/'))[2]);

-- Allow service role to manage all videos
CREATE POLICY "Service role can manage all videos" ON storage.objects
FOR ALL TO service_role
USING (bucket_id = 'session-videos');
    `)

    console.log('\n✅ Video storage setup complete!')
    
  } catch (error) {
    console.error('Setup failed:', error)
  }
}

setupVideoStorage()
