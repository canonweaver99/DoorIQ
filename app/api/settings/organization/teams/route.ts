export const dynamic = "force-static";

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/settings/organization/teams
 * Fetch all teams for the user's organization with member counts
 */
export async function GET(request: NextRequest) {
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
        { error: 'Only managers can view teams' },
        { status: 403 }
      )
    }

    if (!userData.organization_id) {
      return NextResponse.json(
        { error: 'You are not part of an organization' },
        { status: 400 }
      )
    }

    // Fetch all teams in the organization
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, created_at')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false })

    if (teamsError) {
      console.error('Error fetching teams:', teamsError)
      return NextResponse.json(
        { error: 'Failed to fetch teams' },
        { status: 500 }
      )
    }

    // Get member counts for each team
    const teamsWithCounts = await Promise.all(
      (teams || []).map(async (team) => {
        const { count, error: countError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id)
          .eq('organization_id', userData.organization_id)

        return {
          ...team,
          member_count: countError ? 0 : (count || 0),
        }
      })
    )

    return NextResponse.json({ teams: teamsWithCounts })
  } catch (error: any) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings/organization/teams
 * Create a new team in the organization
 */
export async function POST(request: NextRequest) {
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
        { error: 'Only managers can create teams' },
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
    const { name, repIds } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      )
    }

    // Create the team
    const { data: newTeam, error: createError } = await supabase
      .from('teams')
      .insert({
        name: name.trim(),
        organization_id: userData.organization_id,
        owner_id: user.id,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating team:', createError)
      return NextResponse.json(
        { error: 'Failed to create team' },
        { status: 500 }
      )
    }

    // If repIds provided, assign reps to the new team
    if (repIds && Array.isArray(repIds) && repIds.length > 0) {
      // Verify all reps belong to the same organization
      const { data: reps, error: repsError } = await supabase
        .from('users')
        .select('id, organization_id, role')
        .in('id', repIds)
        .eq('organization_id', userData.organization_id)

      if (repsError) {
        console.error('Error verifying reps:', repsError)
        // Continue without assigning reps
      } else if (reps) {
        // Only assign reps (not managers/admins)
        const repIdsToAssign = reps
          .filter((r) => r.role === 'rep')
          .map((r) => r.id)

        if (repIdsToAssign.length > 0) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ team_id: newTeam.id })
            .in('id', repIdsToAssign)

          if (updateError) {
            console.error('Error assigning reps to team:', updateError)
            // Don't fail the request, team was created successfully
          }
        }
      }
    }

    // Get member count for the new team
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', newTeam.id)

    return NextResponse.json({
      success: true,
      team: {
        ...newTeam,
        member_count: count || 0,
      },
    })
  } catch (error: any) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

