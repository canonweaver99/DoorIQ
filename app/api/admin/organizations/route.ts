import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/organizations
 * Admin-only endpoint to list all organizations
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const planTier = searchParams.get('plan_tier')
    const search = searchParams.get('search')
    
    // Build query
    let query = supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (planTier) {
      query = query.eq('plan_tier', planTier)
    }
    
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }
    
    const { data: organizations, error } = await query
    
    if (error) {
      console.error('Error fetching organizations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch organizations' },
        { status: 500 }
      )
    }
    
    // Get member counts for each organization
    const organizationsWithCounts = await Promise.all(
      (organizations || []).map(async (org) => {
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
        
        return {
          ...org,
          member_count: count || 0
        }
      })
    )
    
    return NextResponse.json({ organizations: organizationsWithCounts })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

