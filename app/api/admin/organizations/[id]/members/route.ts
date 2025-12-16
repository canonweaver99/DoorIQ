export const dynamic = "force-static";

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function generateStaticParams() {
  return []
}

/**
 * GET /api/admin/organizations/[id]/members
 * Admin-only endpoint to list organization members
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const { id } = params
    
    // Get members with session counts
    const { data: members, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        created_at,
        training_sessions:training_sessions(count)
      `)
      .eq('organization_id', id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching members:', error)
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      )
    }
    
    // Get session counts separately (Supabase doesn't support count in nested select easily)
    const membersWithStats = await Promise.all(
      (members || []).map(async (member) => {
        const { count } = await supabase
          .from('training_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', member.id)
        
        return {
          ...member,
          sessions_count: count || 0
        }
      })
    )
    
    return NextResponse.json({ members: membersWithStats })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

