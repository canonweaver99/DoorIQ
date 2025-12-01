import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { LearningObjection } from '@/lib/learning/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Fetch all published objections
    const { data: objections, error: objectionsError } = await supabase
      .from('learning_objections')
      .select('*')
      .order('display_order', { ascending: true })

    if (objectionsError) {
      console.error('Error fetching objections:', objectionsError)
      return NextResponse.json(
        { error: 'Failed to fetch objections' },
        { status: 500 }
      )
    }

    // Fetch user progress if authenticated
    let progressMap: Record<string, any> = {}
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: progressData } = await supabase
        .from('user_objection_progress')
        .select('*')
        .eq('user_id', user.id)

      if (progressData) {
        progressData.forEach(progress => {
          progressMap[progress.objection_id] = progress
        })
      }
    }

    // Attach progress to each objection
    const objectionsWithProgress = (objections || []).map(obj => ({
      ...obj,
      progress: progressMap[obj.id] || null
    }))

    return NextResponse.json(
      { objections: objectionsWithProgress },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


