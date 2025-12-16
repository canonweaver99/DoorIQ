export const dynamic = "force-static";

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch instructional videos for user's team (top 4, ordered)
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team
    const { data: userProfile } = await supabase
      .from('users')
      .select('team_id')
      .eq('id', user.id)
      .single()

    // Fetch instructional videos for user's team (or company-wide if team_id is NULL)
    // Order by display_order to show top 4
    let query = supabase
      .from('instructional_videos')
      .select('*')
    
    // Filter: show videos for user's team OR company-wide videos (team_id IS NULL)
    if (userProfile?.team_id) {
      query = query.or(`team_id.eq.${userProfile.team_id},team_id.is.null`)
    } else {
      // User has no team, only show company-wide videos
      query = query.is('team_id', null)
    }
    
    const { data: videos, error: videosError } = await query
      .order('display_order', { ascending: true })
      .limit(4)

    if (videosError) {
      console.error('Error fetching instructional videos:', videosError)
      return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
    }

    return NextResponse.json({ 
      videos: videos || []
    })
  } catch (error) {
    console.error('Error in GET instructional videos:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Upload instructional videos (admin only)
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin or manager
    const { data: userProfile } = await supabase
      .from('users')
      .select('role, team_id')
      .eq('id', user.id)
      .single()

    if (!userProfile || !['admin', 'manager'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Only admins and managers can upload instructional videos' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string | null
    let teamId = formData.get('team_id') as string | null
    const displayOrder = formData.get('display_order') as string | null

    // If manager is uploading, use their team_id (unless admin explicitly sets a different team_id)
    if (userProfile.role === 'manager' && userProfile.team_id) {
      // Managers can only upload for their own team
      teamId = userProfile.team_id
    } else if (userProfile.role === 'admin') {
      // Admins can upload for any team or company-wide (team_id = null)
      // Use the provided team_id or null for company-wide
      teamId = teamId && teamId !== 'null' ? teamId : null
    }
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload a video file (MP4, WebM, MOV, AVI)' 
      }, { status: 400 })
    }

    // Validate display_order (1-4)
    const order = displayOrder ? parseInt(displayOrder) : 1
    if (order < 1 || order > 4) {
      return NextResponse.json({ error: 'Display order must be between 1 and 4' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `instructional-${timestamp}-${safeName}`

    // Upload to session-videos bucket
    const bucketName = 'session-videos'

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload video to storage.',
        details: uploadError.message,
        code: uploadError.code
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    // Store metadata in database
    const { data: videoRecord, error: dbError } = await supabase
      .from('instructional_videos')
      .insert({
        team_id: teamId && teamId !== 'null' ? teamId : null,
        title: title.trim(),
        description: description?.trim() || null,
        video_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        display_order: order
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Try to clean up uploaded file
      await supabase.storage.from(bucketName).remove([filePath])
      return NextResponse.json({ 
        error: 'Failed to save video metadata.',
        details: dbError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      video: videoRecord
    })
  } catch (error: any) {
    console.error('Error in video upload:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

