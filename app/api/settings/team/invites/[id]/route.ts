
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is manager/admin
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, team_id, role')
      .eq('id', user.id)
      .single()

    if (!userData || (userData.role !== 'manager' && userData.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only managers can cancel invites' },
        { status: 403 }
      )
    }

    const { id } = params

    // Get the organization/team ID
    const orgId = userData.organization_id || userData.team_id
    if (!orgId) {
      return NextResponse.json(
        { error: 'You are not part of an organization' },
        { status: 400 }
      )
    }

    // Verify invite belongs to same organization and is pending using service client
    const serviceSupabase = await createServiceSupabaseClient()
    
    // First, try with organization_id
    let inviteQuery = serviceSupabase
      .from('team_invites')
      .select('id, organization_id, team_id, status, email')
      .eq('id', id)

    // Check both organization_id and team_id
    if (userData.organization_id) {
      inviteQuery = inviteQuery.eq('organization_id', userData.organization_id)
    } else if (userData.team_id) {
      inviteQuery = inviteQuery.eq('team_id', userData.team_id)
    }

    const { data: invite, error: inviteError } = await inviteQuery.single()

    if (inviteError) {
      console.error('Error fetching invite:', inviteError)
      if (inviteError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Invite not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to verify invite', details: inviteError.message },
        { status: 500 }
      )
    }

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      )
    }

    // Verify the invite belongs to the user's org/team
    const inviteOrgId = invite.organization_id || invite.team_id
    if (inviteOrgId !== orgId) {
      return NextResponse.json(
        { error: 'Invite not found or not in your organization' },
        { status: 404 }
      )
    }

    // Delete the invite using service client to bypass RLS
    const { error: deleteError } = await serviceSupabase
      .from('team_invites')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting invite:', deleteError)
      throw deleteError
    }

    return NextResponse.json({ success: true, message: 'Invite canceled successfully' })
  } catch (error: any) {
    console.error('Error canceling invite:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
