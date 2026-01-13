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
    
    // Check if this is a new user (first time OAuth signup)
    const { createServiceSupabaseClient } = await import('@/lib/supabase/server')
    const serviceSupabase = await createServiceSupabaseClient()
    const { data: existingUser } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('id', data.user.id)
      .single()
    
    const isNewUser = !existingUser
    const checkoutIntent = requestUrl.searchParams.get('checkout')
    
    // If this is a new user signup (not login), require checkout
    if (isNewUser && !checkoutIntent) {
      console.log('⚠️ New OAuth user without checkout - redirecting to checkout')
      return NextResponse.redirect(new URL('/checkout?error=Please complete checkout before creating an account', requestUrl.origin))
    }
    
    // If checkout intent provided, validate it
    if (checkoutIntent && isNewUser) {
      try {
        const stripeKey = process.env.STRIPE_SECRET_KEY
        if (stripeKey) {
          const Stripe = (await import('stripe')).default
          const stripe = new Stripe(stripeKey, { apiVersion: '2025-09-30.clover' })
          const session = await stripe.checkout.sessions.retrieve(checkoutIntent)
          
          if (session.status !== 'complete' || 
              (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required')) {
            console.log('⚠️ Invalid checkout session - redirecting to checkout')
            return NextResponse.redirect(new URL('/checkout?error=Invalid checkout session', requestUrl.origin))
          }
        }
      } catch (error) {
        console.error('Error validating checkout session:', error)
        return NextResponse.redirect(new URL('/checkout?error=Failed to validate checkout', requestUrl.origin))
      }
    }
    
    // Get redirect path from query params or default to /home
    const redirectPath = requestUrl.searchParams.get('next') || '/home'
    const redirectUrl = new URL(redirectPath, requestUrl.origin)
    
    console.log('🔄 Redirecting to:', redirectUrl.href)
    
    // Redirect to the intended destination
    return NextResponse.redirect(redirectUrl)
    
  } catch (err: any) {
    console.error('❌ Unexpected error:', err)
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(err.message || 'Authentication failed')}`, requestUrl.origin))
  }
}
