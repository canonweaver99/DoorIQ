import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team_id
    const { data: userData, error: userError } = await (supabase as any)
      .from('users')
      .select('team_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData || !userData.team_id) {
      return NextResponse.json({ error: 'Not part of a team' }, { status: 404 })
    }

    // Get team info with organization details
    const { data: team, error: teamError } = await (supabase as any)
      .from('teams')
      .select(`
        *,
        organization:organizations(id, name, plan_tier)
      `)
      .eq('id', userData.team_id)
      .single()

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    return NextResponse.json(team)
  } catch (error) {
    console.error('Error fetching team info:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

