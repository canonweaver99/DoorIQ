
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { LearningObjection } from '@/lib/learning/types'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { slug } = await context.params

    if (!slug) {
      return NextResponse.json(
        { error: 'Objection slug is required' },
        { status: 400 }
      )
    }

    // Fetch objection by slug
    const { data: objection, error: objectionError } = await supabase
      .from('learning_objections')
      .select('*')
      .eq('slug', slug)
      .single()

    if (objectionError || !objection) {
      return NextResponse.json(
        { error: 'Objection not found' },
        { status: 404 }
      )
    }

    // Fetch user progress if authenticated
    let progress = null
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: progressData, error: progressError } = await supabase
        .from('user_objection_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('objection_id', objection.id)
        .single()

      if (!progressError && progressData) {
        progress = progressData
      }
    }

    return NextResponse.json(
      { objection: { ...objection, progress } },
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


