import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
    console.log('🔗 Callback hit')
    console.log('📍 Code:', code ? 'yes' : 'no')
    console.log('📍 Origin:', requestUrl.origin)
    console.log('📍 Full URL:', requestUrl.href)
    console.log('📍 Query params:', {
      next: requestUrl.searchParams.get('next'),
      session_id: requestUrl.searchParams.get('session_id'),
      email: requestUrl.searchParams.get('email'),
      checkout: requestUrl.searchParams.get('checkout'),
    })
  
  // If no code, redirect to login
  if (!code) {
    console.error('❌ No code parameter found')
    return NextResponse.redirect(new URL('/auth/login?error=No authorization code received', requestUrl.origin))
  }
  
  try {
    // Exchange code for session
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('❌ Error exchanging code:', error.message)
      return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin))
    }
    
    if (!data.session || !data.user) {
      console.error('❌ No session or user in response')
      return NextResponse.redirect(new URL('/auth/login?error=Failed to create session', requestUrl.origin))
    }
    
    console.log('✅ Session created successfully:', data.user.email)
    
    // Get query params first
    const checkoutIntent = requestUrl.searchParams.get('checkout')
    const sessionId = requestUrl.searchParams.get('session_id')
    const nextPath = requestUrl.searchParams.get('next')
    const email = requestUrl.searchParams.get('email')
    
    // Check if this is a new user (first time OAuth signup) and onboarding status
    const { createServiceSupabaseClient } = await import('@/lib/supabase/server')
    const serviceSupabase = await createServiceSupabaseClient()
    let { data: existingUser } = await serviceSupabase
      .from('users')
      .select('id, role, onboarding_completed, account_setup_completed_at, checkout_session_id')
      .eq('id', data.user.id)
      .maybeSingle()
    
    // CRITICAL: If user doesn't exist in users table, create the record
    // This prevents foreign key constraint errors when creating sessions
    if (!existingUser) {
      console.log('📝 User record not found in users table - creating profile...')
      const userMetadata = data.user.user_metadata || {}
      const repId = `REP-${Date.now().toString().slice(-6)}`
      
      const { data: newUser, error: createError } = await serviceSupabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email || '',
          full_name: userMetadata.full_name || userMetadata.name || data.user.email?.split('@')[0] || 'User',
          rep_id: repId,
          role: 'rep',
          virtual_earnings: 0,
        })
        .select('id, role, onboarding_completed, account_setup_completed_at, checkout_session_id')
        .single()
      
      if (createError) {
        console.error('❌ Failed to create user profile:', createError)
        // Continue anyway - user is authenticated even if profile creation fails
        // They'll get an error when trying to create a session, but at least they're logged in
      } else {
        console.log('✅ User profile created successfully')
        existingUser = newUser
      }
    }
    
    type UserProfile = {
      id: string
      role: string | null
      onboarding_completed: boolean | null
      account_setup_completed_at: string | null
      checkout_session_id: string | null
    }
    
    const userProfile = existingUser as UserProfile | null
    const isNewUser = !userProfile
    const hasExistingRole = userProfile ? (!!userProfile.role && (userProfile.role === 'manager' || userProfile.role === 'rep' || userProfile.role === 'admin')) : false
    const hasCompletedOnboarding = userProfile?.onboarding_completed === true
    const hasCompletedAccountSetup = !!userProfile?.account_setup_completed_at
    const hasCheckoutSession = !!userProfile?.checkout_session_id || !!sessionId
    
    // CRITICAL: For new users, if they have sessionId in query params, they MUST complete onboarding
    // For existing users, check checkout_session_id in their record
    // If user has a checkout session (from recent checkout), they MUST complete onboarding
    const requiresOnboarding = (hasCheckoutSession && !hasCompletedOnboarding) || (isNewUser && !!sessionId)
    
    // If query params are missing, this might be a case where Supabase didn't preserve them
    // We'll handle this in the redirect logic below by checking onboarding status
    
    // If this is a new user signup (not login), require checkout validation
    // Check for either 'checkout' param (old flow) or 'session_id' param (onboarding flow)
    if (isNewUser && !checkoutIntent && !sessionId) {
      console.log('⚠️ New OAuth user without checkout - redirecting to checkout')
      return NextResponse.redirect(new URL('/checkout?error=Please complete checkout before creating an account', requestUrl.origin))
    }
    
    // Validate checkout session if provided (either via checkout param or session_id param)
    const sessionToValidate = checkoutIntent || sessionId
    if (sessionToValidate && isNewUser) {
      try {
        const stripeKey = process.env.STRIPE_SECRET_KEY
        if (stripeKey) {
          const Stripe = (await import('stripe')).default
          const stripe = new Stripe(stripeKey, { apiVersion: '2025-09-30.clover' })
          const session = await stripe.checkout.sessions.retrieve(sessionToValidate)
          
          if (session.status !== 'complete' || 
              (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required')) {
            console.log('⚠️ Invalid checkout session - redirecting to checkout')
            return NextResponse.redirect(new URL('/checkout?error=Invalid checkout session', requestUrl.origin))
          }
          
          console.log('✅ Checkout session validated:', sessionToValidate)
        }
      } catch (error) {
        console.error('Error validating checkout session:', error)
        return NextResponse.redirect(new URL('/checkout?error=Failed to validate checkout', requestUrl.origin))
      }
    }
    
    // Get redirect path from query params or default based on onboarding status
    // CRITICAL: If next=/onboarding is explicitly set, ALWAYS redirect to onboarding (from onboarding flow)
    let redirectPath = nextPath || '/home'
    
    // PRIORITY 1: If next is /onboarding, ALWAYS redirect there (user clicked Google from onboarding page)
    if (nextPath === '/onboarding') {
      const onboardingUrl = new URL('/onboarding', requestUrl.origin)
      // Preserve session_id from query param or from user record
      const finalSessionId = sessionId || (userProfile?.checkout_session_id || null)
      if (finalSessionId) {
        onboardingUrl.searchParams.set('session_id', finalSessionId)
      }
      // Preserve email from query param or use user's email
      const finalEmail = email || data.user.email
      if (finalEmail) {
        onboardingUrl.searchParams.set('email', finalEmail)
      }
      redirectPath = onboardingUrl.pathname + onboardingUrl.search
      console.log('🔄 Explicit onboarding redirect - continuing onboarding flow:', redirectPath)
    } else if (requiresOnboarding) {
      // PRIORITY 2: If user has a checkout session (recent checkout), force onboarding
      const onboardingUrl = new URL('/onboarding', requestUrl.origin)
      // Use session_id from query param or from user record
      const finalSessionId = sessionId || (userProfile?.checkout_session_id || null)
      if (finalSessionId) {
        onboardingUrl.searchParams.set('session_id', finalSessionId)
      }
      if (email) {
        onboardingUrl.searchParams.set('email', email)
      } else if (data.user.email) {
        onboardingUrl.searchParams.set('email', data.user.email)
      }
      redirectPath = onboardingUrl.pathname + onboardingUrl.search
      console.log('🔄 User has checkout session - FORCING onboarding:', redirectPath)
    } else if (!nextPath) {
      // If no explicit next path, ONLY redirect to onboarding if user has a checkout session
      // Regular logins (without checkout) should go to /home, not onboarding
      // CRITICAL: If user already has a role set, they should NEVER go to onboarding
      if (hasExistingRole && !hasCheckoutSession) {
        // User already has a role and no checkout session - go straight to home
        redirectPath = '/home'
        console.log('✅ User already has role set - redirecting to home (no onboarding required)')
      } else if (hasCheckoutSession && (!hasCompletedAccountSetup || !hasCompletedOnboarding)) {
        const onboardingUrl = new URL('/onboarding', requestUrl.origin)
        if (sessionId) {
          onboardingUrl.searchParams.set('session_id', sessionId)
        }
        if (email) {
          onboardingUrl.searchParams.set('email', email)
        }
        redirectPath = onboardingUrl.pathname + onboardingUrl.search
        console.log('🔄 User has checkout session and needs onboarding, redirecting to:', redirectPath)
      } else {
        // No checkout session - just go to home (don't force onboarding)
        console.log('✅ Regular login - redirecting to home (no onboarding required)')
      }
    }
    
    const redirectUrl = new URL(redirectPath, requestUrl.origin)
    
    console.log('🔄 Redirecting to:', redirectUrl.href)
    
    // Redirect to the intended destination
    return NextResponse.redirect(redirectUrl)
    
  } catch (err: any) {
    console.error('❌ Unexpected error:', err)
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(err.message || 'Authentication failed')}`, requestUrl.origin))
  }
}
