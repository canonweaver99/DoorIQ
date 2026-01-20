import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'

/**
 * DELETE /api/settings/organization/teams/[id]
 * Delete a team from the organization
 * Members will be unassigned (team_id set to null)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
        { error: 'Only managers can delete teams' },
        { status: 403 }
      )
    }

    if (!userData.organization_id) {
      return NextResponse.json(
        { error: 'You are not part of an organization' },
        { status: 400 }
      )
    }

    // Verify team exists and belongs to organization
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name, organization_id')
      .eq('id', id)
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

    // Use service client to bypass RLS for bulk updates
    const serviceSupabase = await createServiceSupabaseClient()

    // Unassign all members from this team (set team_id to null)
    const { error: unassignError } = await serviceSupabase
      .from('users')
      .update({ team_id: null })
      .eq('team_id', id)
      .eq('organization_id', userData.organization_id)

    if (unassignError) {
      console.error('Error unassigning members from team:', unassignError)
      // Continue with deletion even if unassign fails
    }

    // Delete the team
    const { error: deleteError } = await serviceSupabase
      .from('teams')
      .delete()
      .eq('id', id)
      .eq('organization_id', userData.organization_id)

    if (deleteError) {
      console.error('Error deleting team:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete team' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: `Team "${team.name}" has been deleted. Members have been unassigned.`
    })
  } catch (error: any) {
    console.error('Error deleting team:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
