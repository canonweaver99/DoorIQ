import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - List all learning videos for team
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

    if (!userProfile?.team_id) {
      return NextResponse.json({ videos: [] })
    }

    // Get videos for this team with uploaded_by user info
    const { data: videos, error: videosError } = await supabase
      .from('team_learning_videos')
      .select(`
        *,
        uploaded_by_user:users!team_learning_videos_uploaded_by_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq('team_id', userProfile.team_id)
      .order('created_at', { ascending: false })

    if (videosError) {
      console.error('Error fetching videos:', videosError)
      return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
    }

    // Transform to include uploaded_by name
    const transformedVideos = (videos || []).map(video => ({
      id: video.id,
      team_id: video.team_id,
      uploaded_by: video.uploaded_by,
      uploaded_by_name: video.uploaded_by_user?.full_name || video.uploaded_by_user?.email || 'Unknown',
      title: video.title,
      description: video.description,
      video_url: video.video_url,
      file_name: video.file_name,
      file_size: video.file_size,
      created_at: video.created_at
    }))

    return NextResponse.json({ 
      videos: transformedVideos
    })
  } catch (error) {
    console.error('Error in GET learning videos:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove video
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('id')

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 })
    }

    // Verify user is manager of the team that owns this video
    const { data: userProfile } = await supabase
      .from('users')
      .select('team_id, role')
      .eq('id', user.id)
      .single()

    if (!['manager', 'admin'].includes(userProfile?.role || '')) {
      return NextResponse.json({ error: 'Only managers can delete videos' }, { status: 403 })
    }

    // Get video to check team_id and get file path
    const { data: video, error: videoError } = await supabase
      .from('team_learning_videos')
      .select('team_id, video_url')
      .eq('id', videoId)
      .single()

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    if (video.team_id !== userProfile.team_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Extract file path from URL and delete from storage
    try {
      const url = new URL(video.video_url)
      const pathParts = url.pathname.split('/')
      const bucketIndex = pathParts.findIndex(part => part === 'session-videos')
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        const filePath = pathParts.slice(bucketIndex + 1).join('/')
        await supabase.storage.from('session-videos').remove([filePath])
      }
    } catch (storageError) {
      console.error('Error deleting video from storage:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('team_learning_videos')
      .delete()
      .eq('id', videoId)

    if (deleteError) {
      console.error('Error deleting video:', deleteError)
      return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE learning video:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

