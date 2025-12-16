export const dynamic = "force-static";

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/errors
 * Admin-only endpoint to fetch error logs with filtering and pagination
 */
export async function GET(request: NextRequest) {
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
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const severity = searchParams.get('severity')
    const errorType = searchParams.get('error_type')
    const resolved = searchParams.get('resolved')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit
    
    // Build query
    let query = supabase
      .from('error_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (severity) {
      query = query.eq('severity', severity)
    }
    
    if (errorType) {
      query = query.eq('error_type', errorType)
    }
    
    if (resolved !== null) {
      query = query.eq('resolved', resolved === 'true')
    }
    
    if (search) {
      query = query.or(`error_message.ilike.%${search}%,user_email.ilike.%${search}%`)
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1)
    
    const { data: errors, error, count } = await query
    
    if (error) {
      console.error('Error fetching error logs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch error logs' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      errors: errors || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/errors:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/errors
 * Admin-only endpoint to update error (mark as resolved/unresolved)
 */
export async function PATCH(request: NextRequest) {
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
    
    // Parse request body
    const body = await request.json()
    const { id, resolved } = body
    
    if (!id || typeof resolved !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: id and resolved' },
        { status: 400 }
      )
    }
    
    // Update error
    const { data, error } = await supabase
      .from('error_logs')
      .update({ resolved })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating error log:', error)
      return NextResponse.json(
        { error: 'Failed to update error log' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ error: data })
  } catch (error) {
    console.error('Unexpected error in PATCH /api/admin/errors:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
