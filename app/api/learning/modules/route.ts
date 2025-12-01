import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ModuleWithProgress } from '@/lib/learning/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const url = new URL(request.url)
    const category = url.searchParams.get('category')

    // Build query for published modules
    let query = supabase
      .from('learning_modules')
      .select('*')
      .eq('is_published', true)
      .order('category', { ascending: true })
      .order('display_order', { ascending: true })

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category)
    }

    const { data: modules, error: modulesError } = await query

    if (modulesError) {
      console.error('Error fetching modules:', modulesError)
      return NextResponse.json(
        { error: 'Failed to fetch modules' },
        { status: 500 }
      )
    }

    // If user is authenticated, fetch their progress
    let modulesWithProgress: ModuleWithProgress[] = modules || []
    
    if (user) {
      const moduleIds = modules?.map(m => m.id) || []
      
      if (moduleIds.length > 0) {
        const { data: progressData, error: progressError } = await supabase
          .from('user_module_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('module_id', moduleIds)

        if (!progressError && progressData) {
          // Create a map of progress by module_id
          const progressMap = new Map(
            progressData.map(p => [p.module_id, p])
          )

          // Merge progress into modules
          modulesWithProgress = modules?.map(module => ({
            ...module,
            progress: progressMap.get(module.id) || null,
          })) || []
        }
      }
    } else {
      // For unauthenticated users, modules have no progress
      modulesWithProgress = modules?.map(module => ({
        ...module,
        progress: null,
      })) || []
    }

    return NextResponse.json(
      { modules: modulesWithProgress },
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


