import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=No authorization code', requestUrl.origin))
  }

  try {
    // Exchange code for session
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.session || !data.user) {
      return NextResponse.redirect(new URL('/auth/login?error=Authentication failed', requestUrl.origin))
    }

    // Get user profile - ensure user exists in users table
    const serviceSupabase = await createServiceSupabaseClient()
    let { data: user, error: fetchError } = await (serviceSupabase as any)
      .from('users')
      .select('id, role')
      .eq('id', data.user.id)
      .maybeSingle()

    // Create user record if doesn't exist - CRITICAL: must succeed or session creation will fail
    if (!user) {
      const { data: newUser, error: createError } = await (serviceSupabase as any)
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email || '',
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          rep_id: `REP-${Date.now().toString().slice(-6)}`,
          role: 'rep',
          virtual_earnings: 0,
        })
        .select('id, role')
        .single()
      
      if (createError) {
        console.error('❌ Failed to create user profile:', createError)
        // If user already exists (race condition), fetch it
        if (createError.code === '23505') {
          const { data: existingUser } = await (serviceSupabase as any)
            .from('users')
            .select('id, role')
            .eq('id', data.user.id)
            .single()
          user = existingUser
        } else {
          throw new Error(`Failed to create user profile: ${createError.message}`)
        }
      } else {
        user = newUser
      }
    }

    // Ensure user exists - fail if not
    if (!user) {
      throw new Error('User profile not found and could not be created')
    }

    // Check if there's an invite token to handle
    const inviteToken = requestUrl.searchParams.get('invite')
    
    // If there's an invite token, try to accept it automatically
    if (inviteToken) {
      try {
        // Get the invite to validate email match and get full details
        const { data: invite, error: inviteError } = await (serviceSupabase as any)
          .from('team_invites')
          .select('*')
          .eq('token', inviteToken)
          .single()

        if (!inviteError && invite) {
          // Check if invite is still valid
          if (invite.status === 'pending' && new Date(invite.expires_at) >= new Date()) {
            // Check if user's email matches the invite email
            if (data.user.email && data.user.email.toLowerCase() === invite.email.toLowerCase()) {
              // Get organization_id from invite (prefer organization_id over team_id)
              const orgId = invite.organization_id || invite.team_id

              // Check seat availability before accepting (for organizations)
              if (orgId) {
                const { data: organization, error: orgError } = await (serviceSupabase as any)
                  .from('organizations')
                  .select('seat_limit, seats_used')
                  .eq('id', orgId)
                  .single()

                if (!orgError && organization) {
                  // Check if seats are full
                  if (organization.seats_used >= organization.seat_limit) {
                    const inviteUrl = new URL(`/invite/${inviteToken}`, requestUrl.origin)
                    inviteUrl.searchParams.set('error', 'no_seats')
                    return NextResponse.redirect(inviteUrl)
                  }
                }
              }

              // Get existing user to preserve name if available
              const { data: existingUser } = await (serviceSupabase as any)
                .from('users')
                .select('id, full_name, is_active')
                .eq('id', data.user.id)
                .maybeSingle()

              // Use existing name if available, otherwise from user metadata or email
              const userName = existingUser?.full_name || data.user.user_metadata?.full_name || invite.email.split('@')[0]

              // Update user record - activate them and set organization/role
              const { error: updateError } = await (serviceSupabase as any)
                .from('users')
                .upsert({
                  id: data.user.id,
                  email: data.user.email,
                  full_name: userName,
                  team_id: invite.team_id,
                  organization_id: orgId,
                  role: invite.role,
                  is_active: true, // Set as active - trigger will handle seats_used increment
                  virtual_earnings: existingUser ? undefined : 0, // Only set if new user
                }, {
                  onConflict: 'id'
                })

              if (updateError) {
                console.error('❌ Error updating user for invite:', updateError)
                const inviteUrl = new URL(`/invite/${inviteToken}`, requestUrl.origin)
                inviteUrl.searchParams.set('error', 'update_failed')
                return NextResponse.redirect(inviteUrl)
              }

              // Mark the invite as accepted
              const { error: inviteUpdateError } = await (serviceSupabase as any)
                .from('team_invites')
                .update({ 
                  status: 'accepted',
                  used_at: new Date().toISOString(),
                  used_by: data.user.id
                })
                .eq('id', invite.id)

              if (inviteUpdateError) {
                console.error('❌ Error updating invite status:', inviteUpdateError)
                // Don't fail the request if we can't update the invite status
              }

              console.log('✅ Invite accepted automatically for:', data.user.email)
              
              // Refresh user data after invite acceptance
              const { data: updatedUser } = await (serviceSupabase as any)
                .from('users')
                .select('id, role')
                .eq('id', data.user.id)
                .single()
              
              if (updatedUser) {
                user = updatedUser
              }

              // Continue with normal flow - redirect to invite page or dashboard
              const nextUrl = requestUrl.searchParams.get('next')
              if (nextUrl) {
                return NextResponse.redirect(new URL(nextUrl, requestUrl.origin))
              }
              // Redirect to dashboard after accepting invite
              return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
            } else {
              console.warn('⚠️ User email does not match invite email:', {
                userEmail: data.user.email,
                inviteEmail: invite.email
              })
              // Redirect to invite page with error message
              const inviteUrl = new URL(`/invite/${inviteToken}`, requestUrl.origin)
              inviteUrl.searchParams.set('error', 'email_mismatch')
              return NextResponse.redirect(inviteUrl)
            }
          } else {
            console.warn('⚠️ Invite is not valid:', { status: invite.status, expires_at: invite.expires_at })
            const inviteUrl = new URL(`/invite/${inviteToken}`, requestUrl.origin)
            inviteUrl.searchParams.set('error', 'invalid_invite')
            return NextResponse.redirect(inviteUrl)
          }
        } else {
          console.warn('⚠️ Invite not found:', inviteError)
        }
      } catch (inviteErr: any) {
        console.error('❌ Error handling invite:', inviteErr)
        // Continue with normal flow even if invite handling fails
      }
    }

    // Check if there's a next parameter to redirect to
    const nextUrl = requestUrl.searchParams.get('next')
    
    // SIMPLE RULE: If user has a role, go to next URL or home. Otherwise, onboarding.
    const hasRole = (user as any)?.role && ['manager', 'rep', 'admin'].includes((user as any).role)
    
    if (hasRole) {
      // If there's a next parameter, redirect there; otherwise go to home
      if (nextUrl) {
        return NextResponse.redirect(new URL(nextUrl, requestUrl.origin))
      }
      return NextResponse.redirect(new URL('/home', requestUrl.origin))
    }

    // New user needs onboarding
    const sessionId = requestUrl.searchParams.get('session_id')
    const email = data.user.email
    const onboardingUrl = new URL('/onboarding', requestUrl.origin)
    if (sessionId) onboardingUrl.searchParams.set('session_id', sessionId)
    if (email) onboardingUrl.searchParams.set('email', email)
    // Preserve next parameter for after onboarding
    if (nextUrl) onboardingUrl.searchParams.set('next', nextUrl)
    
    return NextResponse.redirect(onboardingUrl)

  } catch (err: any) {
    return NextResponse.redirect(new URL('/auth/login?error=Authentication failed', requestUrl.origin))
  }
}
