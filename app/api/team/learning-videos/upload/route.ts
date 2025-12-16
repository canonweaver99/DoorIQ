export const dynamic = "force-static";

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('📤 Video upload request received')
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ User authenticated:', user.id)

    // Get user's team and verify manager role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('team_id, role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ 
        error: 'Failed to fetch user profile',
        details: profileError.message 
      }, { status: 500 })
    }

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!userProfile.team_id) {
      return NextResponse.json({ 
        error: 'User not in a team',
        details: 'You must be part of a team to upload training videos'
      }, { status: 404 })
    }

    if (!userProfile.role || !['manager', 'admin'].includes(userProfile.role)) {
      return NextResponse.json({ 
        error: 'Only managers can upload videos',
        details: `Your role is "${userProfile.role || 'not set'}". Manager or admin role required.`
      }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string | null
    
    console.log('📋 Form data received:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      title,
      hasDescription: !!description
    })
    
    if (!file) {
      console.error('❌ No file provided')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!title || title.trim() === '') {
      console.error('❌ No title provided')
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type',
        details: `File type "${file.type}" is not supported. Please upload a video file (MP4, WebM, MOV, AVI)`
      }, { status: 400 })
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large',
        details: `File size is ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum allowed size is 500MB.`
      }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `learning-videos/team-${userProfile.team_id}/${timestamp}-${safeName}`

    console.log('📁 Uploading to path:', filePath)
    console.log('📦 File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Upload to session-videos bucket (supports video files)
    const bucketName = 'session-videos'

    // Upload to Supabase Storage
    console.log('⬆️ Starting Supabase storage upload...')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      })
    
    console.log('📤 Upload result:', { uploadData, uploadError })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      // Check for specific error types
      let errorMessage = uploadError.message || 'Unknown storage error'
      if (uploadError.message?.includes('already exists')) {
        errorMessage = 'A file with this name already exists. Please rename your file.'
      } else if (uploadError.message?.includes('size')) {
        errorMessage = 'File is too large. Please upload a smaller video file.'
      } else if (uploadError.message?.includes('permission') || uploadError.message?.includes('policy')) {
        errorMessage = 'Permission denied. Please contact support.'
      }
      return NextResponse.json({ 
        error: 'Failed to upload video to storage.',
        details: errorMessage,
        code: uploadError.code,
        fullError: process.env.NODE_ENV === 'development' ? uploadError.message : undefined
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    // Store metadata in database
    const { data: videoRecord, error: dbError } = await supabase
      .from('team_learning_videos')
      .insert({
        team_id: userProfile.team_id,
        uploaded_by: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        video_url: publicUrl,
        file_name: file.name,
        file_size: file.size
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Try to clean up uploaded file
      try {
        await supabase.storage.from(bucketName).remove([filePath])
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError)
      }
      return NextResponse.json({ 
        error: 'Failed to save video metadata.',
        details: dbError.message || 'Database error occurred',
        code: dbError.code,
        hint: dbError.hint
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      video: videoRecord
    })
  } catch (error: any) {
    console.error('Error in video upload:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error name:', error?.name)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message || 'An unexpected error occurred',
      type: error?.name || 'UnknownError'
    }, { status: 500 })
  }
}

