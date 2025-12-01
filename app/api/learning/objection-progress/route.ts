import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { objection_id, completed_at, time_spent_seconds } = body

    if (!objection_id) {
      return NextResponse.json(
        { error: 'objection_id is required' },
        { status: 400 }
      )
    }

    // Check if progress record exists
    const { data: existingProgress, error: checkError } = await supabase
      .from('user_objection_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('objection_id', objection_id)
      .single()

    let result
    if (existingProgress) {
      // Update existing progress
      const updateData: any = {}
      if (completed_at !== undefined) {
        updateData.completed_at = completed_at
      }
      if (time_spent_seconds !== undefined) {
        updateData.time_spent_seconds = time_spent_seconds
      }

      const { data, error } = await supabase
        .from('user_objection_progress')
        .update(updateData)
        .eq('user_id', user.id)
        .eq('objection_id', objection_id)
        .select()
        .single()

      if (error) {
        console.error('Error updating objection progress:', error)
        return NextResponse.json(
          { error: 'Failed to update progress' },
          { status: 500 }
        )
      }

      result = data
    } else {
      // Create new progress record
      const insertData: any = {
        user_id: user.id,
        objection_id,
        time_spent_seconds: time_spent_seconds || 0,
      }

      if (completed_at !== undefined) {
        insertData.completed_at = completed_at
      }

      const { data, error } = await supabase
        .from('user_objection_progress')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Error creating objection progress:', error)
        return NextResponse.json(
          { error: 'Failed to create progress' },
          { status: 500 }
        )
      }

      result = data
    }

    return NextResponse.json({ progress: result })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const objectionId = searchParams.get('objection_id')

    if (objectionId) {
      // Get specific objection progress
      const { data, error } = await supabase
        .from('user_objection_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('objection_id', objectionId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching objection progress:', error)
        return NextResponse.json(
          { error: 'Failed to fetch progress' },
          { status: 500 }
        )
      }

      return NextResponse.json({ progress: data || null })
    } else {
      // Get all objection progress for user
      const { data, error } = await supabase
        .from('user_objection_progress')
        .select('*')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error fetching objection progress:', error)
        return NextResponse.json(
          { error: 'Failed to fetch progress' },
          { status: 500 }
        )
      }

      return NextResponse.json({ progress: data || [] })
    }
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

