import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team
    const { data: userProfile } = await supabase
      .from('users')
      .select('team_id')
      .eq('id', user.id)
      .single()

    if (!userProfile?.team_id) {
      return NextResponse.json({ error: 'User not in a team' }, { status: 404 })
    }

    // Get team grading config
    const { data: config, error: configError } = await supabase
      .from('team_grading_configs')
      .select('*')
      .eq('team_id', userProfile.team_id)
      .single()

    if (configError && configError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching config:', configError)
      return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
    }

    return NextResponse.json({ config: config || null })
  } catch (error) {
    console.error('Error in GET grading-config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team and verify manager role
    const { data: userProfile } = await supabase
      .from('users')
      .select('team_id, role')
      .eq('id', user.id)
      .single()

    if (!userProfile?.team_id) {
      return NextResponse.json({ error: 'User not in a team' }, { status: 404 })
    }

    if (!['manager', 'admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Only managers can update grading config' }, { status: 403 })
    }

    const body = await request.json()

    // Check if config exists
    const { data: existingConfig } = await supabase
      .from('team_grading_configs')
      .select('id')
      .eq('team_id', userProfile.team_id)
      .single()

    let result
    if (existingConfig) {
      // Update existing config
      const { data, error } = await supabase
        .from('team_grading_configs')
        .update({
          ...body,
          updated_by: user.id,
        })
        .eq('team_id', userProfile.team_id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new config
      const { data, error } = await supabase
        .from('team_grading_configs')
        .insert({
          team_id: userProfile.team_id,
          ...body,
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({ success: true, config: result })
  } catch (error) {
    console.error('Error in POST grading-config:', error)
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
  }
}

