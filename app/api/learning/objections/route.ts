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

    return NextResponse.json(
      { objections: objections || [] },
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

