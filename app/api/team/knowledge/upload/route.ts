import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team and verify manager role
    const { data: userProfile } = await supabase
      .from('users')
      .select('team_id, role')
      .eq('id', user.id)
      .single()

    if (!userProfile?.team_id) {
      return NextResponse.json({ error: 'User not in a team' }, { status: 404 })
    }

    if (!['manager', 'admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Only managers can upload files' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `team-${userProfile.team_id}/${timestamp}-${safeName}`

    // First, try to create the bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(bucket => bucket.id === 'knowledge-base')
    
    if (!bucketExists) {
      const { error: bucketError } = await supabase.storage.createBucket('knowledge-base', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      })
      
      if (bucketError) {
        console.error('Bucket creation error:', bucketError)
        return NextResponse.json({ 
          error: 'Storage bucket not available. Please contact support.',
          details: bucketError.message 
        }, { status: 500 })
      }
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('knowledge-base')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload file. Please try again.',
        details: uploadError.message 
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('knowledge-base')
      .getPublicUrl(filePath)

    // Extract text content if it's a supported file type
    let extractedContent = ''
    
    if (file.type === 'text/plain') {
      extractedContent = await file.text()
    } else if (file.type === 'application/pdf') {
      // For PDFs, we'll extract text on the client side or use a service
      // For now, just note that it's a PDF
      extractedContent = '[PDF Document - Text extraction pending]'
    }

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type,
        extractedContent
      }
    })
  } catch (error) {
    console.error('Error in upload:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

