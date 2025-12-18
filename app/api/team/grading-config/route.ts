
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
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team and verify manager role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('team_id, role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: 'Failed to get user profile' }, { status: 500 })
    }

    if (!userProfile?.team_id) {
      console.error('User not in team:', user.id)
      return NextResponse.json({ error: 'User not in a team' }, { status: 404 })
    }

    if (!['manager', 'admin'].includes(userProfile.role)) {
      console.error('User not manager/admin:', userProfile.role)
      return NextResponse.json({ error: 'Only managers can update grading config' }, { status: 403 })
    }

    const body = await request.json()
    console.log('Received config update:', JSON.stringify(body, null, 2))

    // Clean up the body to only include valid fields
    const cleanBody: any = {}
    const validFields = [
      'company_name', 'company_mission', 'product_description', 
      'service_guarantees', 'company_values', 'pricing_info', 
      'objection_handlers', 'custom_grading_rubric', 'passing_score', 'enabled'
    ]
    
    validFields.forEach(field => {
      if (body[field] !== undefined) {
        cleanBody[field] = body[field]
      }
    })

    // Check if config exists
    const { data: existingConfig, error: checkError } = await supabase
      .from('team_grading_configs')
      .select('id')
      .eq('team_id', userProfile.team_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking config:', checkError)
    }

    let result
    if (existingConfig) {
      // Update existing config
      console.log('Updating existing config for team:', userProfile.team_id)
      const { data, error } = await supabase
        .from('team_grading_configs')
        .update({
          ...cleanBody,
          updated_by: user.id,
        })
        .eq('team_id', userProfile.team_id)
        .select()
        .single()

      if (error) {
        console.error('Update error:', error)
        throw error
      }
      result = data
      console.log('Config updated successfully')
    } else {
      // Create new config
      console.log('Creating new config for team:', userProfile.team_id)
      const { data, error } = await supabase
        .from('team_grading_configs')
        .insert({
          team_id: userProfile.team_id,
          ...cleanBody,
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single()

      if (error) {
        console.error('Insert error:', error)
        throw error
      }
      result = data
      console.log('Config created successfully')
    }

    return NextResponse.json({ success: true, config: result })
  } catch (error: any) {
    console.error('Error in POST grading-config:', error)
    return NextResponse.json({ 
      error: 'Failed to update config',
      details: error.message || 'Unknown error',
      code: error.code
    }, { status: 500 })
  }
}

