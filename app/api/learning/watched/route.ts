export const dynamic = "force-static";

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST - Mark video as watched
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { video_id, video_type } = body

    if (!video_id || !video_type) {
      return NextResponse.json({ error: 'video_id and video_type are required' }, { status: 400 })
    }

    if (!['instructional', 'team'].includes(video_type)) {
      return NextResponse.json({ error: 'video_type must be "instructional" or "team"' }, { status: 400 })
    }

    // Insert or update watch record (using ON CONFLICT to handle duplicates)
    const { data, error } = await supabase
      .from('user_video_watches')
      .upsert({
        user_id: user.id,
        video_id,
        video_type,
        watched_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,video_id,video_type'
      })
      .select()
      .single()

    if (error) {
      console.error('Error marking video as watched:', error)
      return NextResponse.json({ error: 'Failed to mark video as watched' }, { status: 500 })
    }

    return NextResponse.json({ success: true, watch: data })
  } catch (error) {
    console.error('Error in POST watched:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get user's watched video IDs
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const videoType = searchParams.get('video_type') // optional filter

    let query = supabase
      .from('user_video_watches')
      .select('video_id, video_type')
      .eq('user_id', user.id)

    if (videoType && ['instructional', 'team'].includes(videoType)) {
      query = query.eq('video_type', videoType)
    }

    const { data: watches, error: watchesError } = await query

    if (watchesError) {
      console.error('Error fetching watched videos:', watchesError)
      return NextResponse.json({ error: 'Failed to fetch watched videos' }, { status: 500 })
    }

    // Return as a set of video IDs for easy lookup
    const watchedIds = (watches || []).map(w => `${w.video_type}:${w.video_id}`)

    return NextResponse.json({ 
      watched_ids: watchedIds,
      watches: watches || []
    })
  } catch (error) {
    console.error('Error in GET watched:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

