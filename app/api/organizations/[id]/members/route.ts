import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/organizations/[id]/members
 * List all members (active + inactive) with their status
 * Include pending invites count
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Get user's organization and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user belongs to this organization
    if (userData.organization_id !== id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not belong to this organization' },
        { status: 403 }
      )
    }

    // Get all members
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_active, created_at')
      .eq('organization_id', id)
      .order('created_at', { ascending: false })

    if (membersError) {
      console.error('Error fetching members:', membersError)
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      )
    }

    // Get pending invites count
    const { count: pendingInvitesCount, error: invitesError } = await supabase
      .from('team_invites')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())

    if (invitesError) {
      console.error('Error fetching pending invites:', invitesError)
    }

    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('seat_limit, seats_used')
      .eq('id', id)
      .single()

    if (orgError) {
      console.error('Error fetching organization:', orgError)
    }

    return NextResponse.json({
      members: members || [],
      pendingInvitesCount: pendingInvitesCount || 0,
      organization: organization || null,
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

