import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ModuleWithProgress } from '@/lib/learning/types'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { slug } = await context.params

    if (!slug) {
      return NextResponse.json(
        { error: 'Module slug is required' },
        { status: 400 }
      )
    }

    // Fetch module by slug
    const { data: module, error: moduleError } = await supabase
      .from('learning_modules')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()

    if (moduleError || !module) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      )
    }

    // Fetch user progress if authenticated
    let progress = null
    if (user) {
      const { data: progressData, error: progressError } = await supabase
        .from('user_module_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('module_id', module.id)
        .single()

      if (!progressError && progressData) {
        progress = progressData
      }
    }

    const moduleWithProgress: ModuleWithProgress = {
      ...module,
      progress,
    }

    return NextResponse.json(
      { module: moduleWithProgress },
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

