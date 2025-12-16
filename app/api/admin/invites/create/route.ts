export const dynamic = "force-static";

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

/**
 * POST /api/admin/invites/create
 * 
 * Admin-only endpoint to create invite tokens for signup
 * 
 * Body:
 * {
 *   email?: string (optional - if provided, invite is only valid for this email)
 *   expiresInDays?: number (default: 7)
 *   purpose?: string (optional notes)
 * }
 */
export async function POST(request: NextRequest) {
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
    
    // Parse request body
    const body = await request.json()
    const { email, expiresInDays = 7, purpose } = body
    
    if (expiresInDays < 1 || expiresInDays > 365) {
      return NextResponse.json(
        { error: 'Expiration days must be between 1 and 365' },
        { status: 400 }
      )
    }
    
    // Generate secure token
    const token = randomBytes(32).toString('hex')
    
    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)
    
    // Create invite using service role for admin operations
    const serviceSupabase = await createServiceSupabaseClient()
    const { data: invite, error: inviteError } = await serviceSupabase
      .from('admin_invites')
      .insert({
        token,
        created_by: user.id,
        email: email ? email.toLowerCase().trim() : null,
        expires_at: expiresAt.toISOString(),
        purpose: purpose || null
      })
      .select()
      .single()
    
    if (inviteError) {
      console.error('Error creating invite:', inviteError)
      return NextResponse.json(
        { error: 'Failed to create invite' },
        { status: 500 }
      )
    }
    
    // Generate invite URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://dooriq.ai'
    const inviteUrl = `${siteUrl}/auth/signup?invite=${token}`
    
    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        token: invite.token,
        email: invite.email,
        expires_at: invite.expires_at,
        purpose: invite.purpose,
        invite_url: inviteUrl
      }
    })
  } catch (error) {
    console.error('Error in admin invites create API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
