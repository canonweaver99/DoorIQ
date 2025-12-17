
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * PATCH /api/settings/organization/members/[id]/team
 * Update a user's team_id to move them to a different team
 * Supports bulk updates via array of member IDs in body
 */
export async function PATCH(
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
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!userData || (userData.role !== 'manager' && userData.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only managers can move team members' },
        { status: 403 }
      )
    }

    if (!userData.organization_id) {
      return NextResponse.json(
        { error: 'You are not part of an organization' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { team_id, member_ids } = body

    // Support both single member (from URL param) and bulk (from body)
    const memberIds = member_ids && Array.isArray(member_ids) ? member_ids : [params.id]

    if (memberIds.length === 0) {
      return NextResponse.json(
        { error: 'No members specified' },
        { status: 400 }
      )
    }

    // If team_id is null, that's valid (unassigning from team)
    // Otherwise, verify the team belongs to the organization
    if (team_id !== null && team_id !== undefined) {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, organization_id')
        .eq('id', team_id)
        .single()

      if (teamError || !team) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        )
      }

      if (team.organization_id !== userData.organization_id) {
        return NextResponse.json(
          { error: 'Team does not belong to your organization' },
          { status: 403 }
        )
      }
    }

    // Verify all members belong to the same organization
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('id, organization_id, role')
      .in('id', memberIds)

    if (membersError) {
      return NextResponse.json(
        { error: 'Failed to verify members' },
        { status: 500 }
      )
    }

    if (!members || members.length === 0) {
      return NextResponse.json(
        { error: 'No valid members found' },
        { status: 404 }
      )
    }

    // Verify all members belong to the same organization
    const invalidMembers = members.filter(
      (m) => m.organization_id !== userData.organization_id
    )
    if (invalidMembers.length > 0) {
      return NextResponse.json(
        { error: 'Some members do not belong to your organization' },
        { status: 403 }
      )
    }

    // Prevent moving admins unless requester is admin
    if (userData.role !== 'admin') {
      const adminMembers = members.filter((m) => m.role === 'admin')
      if (adminMembers.length > 0) {
        return NextResponse.json(
          { error: 'Cannot move admin users' },
          { status: 403 }
        )
      }
    }

    // Update team_id for all members
    const memberIdsToUpdate = members.map((m) => m.id)
    const { error: updateError } = await supabase
      .from('users')
      .update({ team_id: team_id || null })
      .in('id', memberIdsToUpdate)

    if (updateError) {
      console.error('Error updating team assignments:', updateError)
      return NextResponse.json(
        { error: 'Failed to update team assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      updated_count: memberIdsToUpdate.length,
    })
  } catch (error: any) {
    console.error('Error updating team assignment:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

