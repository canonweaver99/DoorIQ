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
    let { data: user, error: fetchError } = await serviceSupabase
      .from('users')
      .select('id, role')
      .eq('id', data.user.id)
      .maybeSingle()

    // Create user record if doesn't exist - CRITICAL: must succeed or session creation will fail
    if (!user) {
      const { data: newUser, error: createError } = await serviceSupabase
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
          const { data: existingUser } = await serviceSupabase
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

    // SIMPLE RULE: If user has a role, go to home. Otherwise, onboarding.
    const hasRole = user?.role && ['manager', 'rep', 'admin'].includes(user.role)
    
    if (hasRole) {
      return NextResponse.redirect(new URL('/home', requestUrl.origin))
    }

    // New user needs onboarding
    const sessionId = requestUrl.searchParams.get('session_id')
    const email = data.user.email
    const onboardingUrl = new URL('/onboarding', requestUrl.origin)
    if (sessionId) onboardingUrl.searchParams.set('session_id', sessionId)
    if (email) onboardingUrl.searchParams.set('email', email)
    
    return NextResponse.redirect(onboardingUrl)

  } catch (err: any) {
    return NextResponse.redirect(new URL('/auth/login?error=Authentication failed', requestUrl.origin))
  }
}
