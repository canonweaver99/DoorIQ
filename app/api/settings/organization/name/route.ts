import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * PATCH /api/settings/organization/name
 * Update organization name (for organization managers/admins)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user's organization and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()
    
    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    if (!userData.organization_id) {
      return NextResponse.json(
        { error: 'You are not part of an organization' },
        { status: 404 }
      )
    }
    
    // Check if user is manager or admin
    if (!['manager', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only managers and admins can update organization name' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { name } = body
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      )
    }
    
    // Update organization name
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update({ name: name.trim() })
      .eq('id', userData.organization_id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating organization name:', updateError)
      return NextResponse.json(
        { error: 'Failed to update organization name' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true,
      organization: updatedOrg,
      message: 'Organization name updated successfully'
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
