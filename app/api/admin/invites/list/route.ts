export const dynamic = "force-static";

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/invites/list
 * 
 * Admin-only endpoint to list all admin invites
 * 
 * Query params:
 * - status?: 'all' | 'active' | 'used' | 'expired' (default: 'all')
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
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
    
    // Get status filter from query params
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'all'
    
    // Build query based on status
    const serviceSupabase = await createServiceSupabaseClient()
    let query = serviceSupabase
      .from('admin_invites')
      .select(`
        id,
        token,
        email,
        expires_at,
        used_at,
        used_by,
        created_at,
        purpose,
        created_by,
        users!admin_invites_created_by_fkey(full_name, email)
      `)
      .order('created_at', { ascending: false })
    
    const now = new Date().toISOString()
    
    if (status === 'active') {
      query = query.is('used_at', null).gt('expires_at', now)
    } else if (status === 'used') {
      query = query.not('used_at', 'is', null)
    } else if (status === 'expired') {
      query = query.is('used_at', null).lt('expires_at', now)
    }
    // 'all' - no filter
    
    const { data: invites, error: invitesError } = await query
    
    if (invitesError) {
      console.error('Error fetching invites:', invitesError)
      return NextResponse.json(
        { error: 'Failed to fetch invites' },
        { status: 500 }
      )
    }
    
    // Format response with status
    const formattedInvites = invites?.map(invite => {
      const isExpired = new Date(invite.expires_at) < new Date()
      const isUsed = !!invite.used_at
      const isActive = !isUsed && !isExpired
      
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://dooriq.ai'
      const inviteUrl = `${siteUrl}/auth/signup?invite=${invite.token}`
      
      return {
        id: invite.id,
        token: invite.token,
        email: invite.email,
        expires_at: invite.expires_at,
        used_at: invite.used_at,
        used_by: invite.used_by,
        created_at: invite.created_at,
        purpose: invite.purpose,
        created_by: invite.users ? {
          name: invite.users.full_name,
          email: invite.users.email
        } : null,
        status: isUsed ? 'used' : isExpired ? 'expired' : 'active',
        invite_url: inviteUrl
      }
    }) || []
    
    return NextResponse.json({
      success: true,
      invites: formattedInvites,
      count: formattedInvites.length
    })
  } catch (error) {
    console.error('Error in admin invites list API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
