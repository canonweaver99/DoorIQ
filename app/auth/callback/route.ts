import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  console.log('🔗 Callback hit')
  console.log('📍 Code:', code ? 'yes' : 'no')
  console.log('📍 Origin:', requestUrl.origin)
  console.log('📍 Full URL:', requestUrl.href)
  
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
    
    // Check if this is a new user (first time OAuth signup) and onboarding status
    const { createServiceSupabaseClient } = await import('@/lib/supabase/server')
    const serviceSupabase = await createServiceSupabaseClient()
    const { data: existingUser } = await serviceSupabase
      .from('users')
      .select('id, onboarding_completed, account_setup_completed_at')
      .eq('id', data.user.id)
      .single()
    
    const isNewUser = !existingUser
    const hasCompletedOnboarding = existingUser?.onboarding_completed === true
    const hasCompletedAccountSetup = !!existingUser?.account_setup_completed_at
    const checkoutIntent = requestUrl.searchParams.get('checkout')
    const sessionId = requestUrl.searchParams.get('session_id')
    const nextPath = requestUrl.searchParams.get('next')
    
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
    // If coming from onboarding, always redirect there and preserve params
    let redirectPath = nextPath || '/home'
    
    // If next is /onboarding, always redirect there (onboarding page will handle step logic)
    if (nextPath === '/onboarding') {
      const email = requestUrl.searchParams.get('email')
      const onboardingUrl = new URL('/onboarding', requestUrl.origin)
      if (sessionId) {
        onboardingUrl.searchParams.set('session_id', sessionId)
      }
      if (email) {
        onboardingUrl.searchParams.set('email', email)
      }
      redirectPath = onboardingUrl.pathname + onboardingUrl.search
      console.log('🔄 Redirecting to onboarding with params:', redirectPath)
    } else if (!nextPath) {
      // If no explicit next path, check if user needs to complete onboarding
      // If user hasn't completed account setup or onboarding, redirect to onboarding
      if (!hasCompletedAccountSetup || !hasCompletedOnboarding) {
        // Preserve session_id and email if they exist in the callback URL
        const email = requestUrl.searchParams.get('email')
        const onboardingUrl = new URL('/onboarding', requestUrl.origin)
        if (sessionId) {
          onboardingUrl.searchParams.set('session_id', sessionId)
        }
        if (email) {
          onboardingUrl.searchParams.set('email', email)
        }
        redirectPath = onboardingUrl.pathname + onboardingUrl.search
        console.log('🔄 User needs to complete onboarding, redirecting to:', redirectPath)
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
