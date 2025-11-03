import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token = requestUrl.searchParams.get('token')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const checkoutIntent = requestUrl.searchParams.get('checkout')
  
  // Check for error parameters in hash or query (Supabase redirects with error params)
  const hashParams = requestUrl.hash ? new URLSearchParams(requestUrl.hash.substring(1)) : null
  const errorParam = hashParams?.get('error') || requestUrl.searchParams.get('error')
  const errorCode = hashParams?.get('error_code') || requestUrl.searchParams.get('error_code')
  const errorDescription = hashParams?.get('error_description') || requestUrl.searchParams.get('error_description')

  console.log('🔗 Auth callback triggered:', {
    code: !!code,
    token: !!token,
    token_hash: !!token_hash,
    type,
    checkoutIntent: !!checkoutIntent,
    error: errorParam,
    errorCode,
    origin: requestUrl.origin
  })

  // Handle errors from Supabase redirect
  if (errorParam) {
    console.error('❌ Auth error from Supabase:', { error: errorParam, errorCode, errorDescription })
    if (errorCode === 'otp_expired') {
      return NextResponse.redirect(new URL('/auth/login?error=Verification link expired. Please request a new verification email.', requestUrl.origin))
    }
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(errorDescription || 'Authentication failed. Please try again.')}`, requestUrl.origin))
  }

  const supabase = await createServerSupabaseClient()

  // Handle email verification (Supabase email verification links)
  // Supabase email verification can use either 'token' or 'token_hash' parameter
  if ((token || token_hash) && type === 'signup') {
    console.log('📧 Email verification detected with token')
    
    let verificationData, verificationError
    
    // Try to verify with token_hash first, then token
    if (token_hash) {
      console.log('🔑 Verifying with token_hash')
      const result = await supabase.auth.verifyOtp({
        token_hash: token_hash,
        type: 'email'
      })
      verificationData = result.data
      verificationError = result.error
    } else if (token) {
      console.log('🔑 Verifying with token')
      const result = await supabase.auth.verifyOtp({
        token: token,
        type: 'email'
      })
      verificationData = result.data
      verificationError = result.error
    }

    if (verificationError) {
      console.error('❌ Error verifying email token:', verificationError.message)
      // If token expired, give helpful error
      if (verificationError.message?.includes('expired') || verificationError.message?.includes('invalid') || verificationError.message?.includes('already')) {
        return NextResponse.redirect(new URL('/auth/login?error=Verification link expired or invalid. Please request a new verification email.', requestUrl.origin))
      }
      return NextResponse.redirect(new URL('/auth/login?error=Unable to verify email. Please try signing in.', requestUrl.origin))
    }

    if (verificationData?.user) {
      console.log('✅ Email verified and user authenticated:', verificationData.user.email)
      console.log('📦 Session data:', { session: !!verificationData.session, user: verificationData.user.id })

      // Check if user profile exists in the users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', verificationData.user.id)
        .single()

      // If user doesn't exist in users table, create profile
      if (!existingUser) {
        console.log('📝 Creating user profile in database...')
        const userMetadata = verificationData.user.user_metadata
        
        const { error: insertError } = await supabase.from('users').insert({
          id: verificationData.user.id,
          email: verificationData.user.email,
          full_name: userMetadata.full_name || userMetadata.name || verificationData.user.email?.split('@')[0] || 'User',
          rep_id: `REP-${Date.now().toString().slice(-6)}`,
          role: 'rep',
          virtual_earnings: 0
        })

        if (insertError) {
          console.error('❌ Error creating user profile:', insertError.message)
        } else {
          console.log('✅ User profile created successfully')
        }
      } else {
        console.log('✅ User profile already exists')
      }

      // Create redirect response with session cookies
      // The session should already be set via cookies by verifyOtp, but we ensure it's persisted
      const redirectPath = requestUrl.searchParams.get('next') || '/dashboard'
      console.log('🔄 Redirecting verified user to:', redirectPath)
      
      const redirectUrl = new URL(redirectPath, requestUrl.origin)
      const response = NextResponse.redirect(redirectUrl)
      
      // Verify session is set - get fresh supabase client to check
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔐 Session after verification:', { hasSession: !!session, userId: session?.user?.id })
      
      return response
    } else {
      console.error('❌ No user in verification data')
      return NextResponse.redirect(new URL('/auth/login?error=Email verification failed. Please try again.', requestUrl.origin))
    }
  }

  // Handle OAuth callback with code (Google, etc.)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('❌ Error exchanging code for session:', error.message)
      return NextResponse.redirect(new URL('/auth/login?error=Unable to verify email. Please try signing in.', requestUrl.origin))
    }

    if (data.user) {
      console.log('✅ User authenticated:', data.user.email)

      // Check if user profile exists in the users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      // If user doesn't exist in users table, create profile
      if (!existingUser) {
        console.log('📝 Creating user profile in database...')
        const userMetadata = data.user.user_metadata
        
        const { error: insertError } = await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email,
          full_name: userMetadata.full_name || userMetadata.name || data.user.email?.split('@')[0] || 'User',
          rep_id: `REP-${Date.now().toString().slice(-6)}`,
          role: 'rep',
          virtual_earnings: 0
        })

        if (insertError) {
          console.error('❌ Error creating user profile:', insertError.message)
        } else {
          console.log('✅ User profile created successfully')
        }
      } else {
        console.log('✅ User profile already exists')
      }

      // Handle invite token if present in URL
      const inviteToken = requestUrl.searchParams.get('invite')
      if (inviteToken) {
        try {
          const inviteResponse = await fetch(`${requestUrl.origin}/api/invites/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: inviteToken })
          })
          if (inviteResponse.ok) {
            console.log('✅ Invite accepted during OAuth callback')
          } else {
            console.warn('⚠️ Failed to accept invite during OAuth callback')
          }
        } catch (e) {
          console.warn('⚠️ Error accepting invite during OAuth callback:', e)
        }
      }

      // Default redirect destination after successful authentication
      let redirectPath = requestUrl.searchParams.get('next') || '/dashboard'
      
      // Preserve checkout intent in redirect
      if (checkoutIntent && redirectPath) {
        redirectPath += `${redirectPath.includes('?') ? '&' : '?'}checkout=${checkoutIntent}`
      }

      // Redirect directly to the destination (no intermediate page)
      console.log('🔄 Redirecting after auth to:', redirectPath)
      return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
    }
  }
  
  // Fallback: redirect to home if no valid callback parameters
  console.log('⚠️ No valid callback parameters, redirecting to home')
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
