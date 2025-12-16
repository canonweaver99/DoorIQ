export const dynamic = "force-static";

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function generateStaticParams() {
  return []
}

/**
 * GET /api/admin/organizations/[id]
 * Admin-only endpoint to get organization details
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }
    
    const { id } = params
    
    // Get organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()
    
    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }
    
    // Get members
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at')
      .eq('organization_id', id)
      .order('created_at', { ascending: false })
    
    // Get pending invitations
    const { data: invitations, error: invitesError } = await supabase
      .from('team_invites')
      .select('*')
      .eq('organization_id', id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    return NextResponse.json({
      organization,
      members: members || [],
      invitations: invitations || []
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/organizations/[id]
 * Admin-only endpoint to update organization
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }
    
    const { id } = params
    const body = await request.json()
    
    // Allowed fields to update
    const allowedFields = ['name', 'plan_tier', 'seat_limit', 'stripe_customer_id', 'stripe_subscription_id']
    const updates: any = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }
    
    // Validate seat_limit can't be less than seats_used
    if (updates.seat_limit !== undefined) {
      const { data: org } = await supabase
        .from('organizations')
        .select('seats_used')
        .eq('id', id)
        .single()
      
      if (org && updates.seat_limit < org.seats_used) {
        return NextResponse.json(
          { error: `Cannot set seat_limit below current usage (${org.seats_used} seats)` },
          { status: 400 }
        )
      }
    }
    
    const { data: organization, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating organization:', error)
      return NextResponse.json(
        { error: 'Failed to update organization' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ organization })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

