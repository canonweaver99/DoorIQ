
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
    }

    // Get user's team_id and verify they're a manager
    const { data: userData, error: userError } = await (supabase as any)
      .from('users')
      .select('team_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData || !userData.team_id) {
      return NextResponse.json({ error: 'Not part of a team' }, { status: 404 })
    }

    // Check if user is a manager or admin
    if (!['manager', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Only managers can update team settings' }, { status: 403 })
    }

    // Update team name
    const { data: updatedTeam, error: updateError } = await (supabase as any)
      .from('teams')
      .update({ name: name.trim() })
      .eq('id', userData.team_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating team:', updateError)
      return NextResponse.json({ error: 'Failed to update team' }, { status: 500 })
    }

    return NextResponse.json({ success: true, team: updatedTeam })
  } catch (error) {
    console.error('Error in team update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

