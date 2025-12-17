
import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import fs from 'fs'
import path from 'path'

export async function POST() {
  try {
    const supabase = await createServiceSupabaseClient()
    
    const videoPath = path.join(process.cwd(), 'public', 'Demo Video Home Compressed.mp4')
    
    if (!fs.existsSync(videoPath)) {
      return NextResponse.json(
        { error: 'Video file not found' },
        { status: 404 }
      )
    }

    // Read the video file
    const videoBuffer = fs.readFileSync(videoPath)
    const fileName = 'demo-video-home.mp4'
    const filePath = `public/${fileName}`

    // Check if session-videos bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    let bucketName = buckets?.find(b => b.name === 'session-videos')?.name
    
    if (!bucketName) {
      // Try to create a public bucket for demo assets
      const { data: bucket, error: bucketError } = await supabase.storage.createBucket('demo-assets', {
        public: true,
        fileSizeLimit: 104857600, // 100MB
        allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime']
      })
      
      if (bucketError && !bucketError.message?.includes('already exists')) {
        return NextResponse.json(
          { error: `Failed to create bucket: ${bucketError.message}` },
          { status: 500 }
        )
      }
      
      bucketName = 'demo-assets'
    }

    // Upload the file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true
      })

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      bucket: bucketName,
      path: uploadData.path,
      publicUrl
    })

  } catch (error: any) {
    console.error('Error uploading demo video:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload video' },
      { status: 500 }
    )
  }
}

