import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendNewUserNotification } from '@/lib/email/send'

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

  // Handle email verification with code parameter (magic link style)
  // This is the recommended approach for email verification
  if (code && (type === 'email' || type === 'signup')) {
    console.log('📧 Email verification detected with code', { type })
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('❌ Error exchanging code for session:', error.message)
        return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error.message || 'Email verification failed')}`, requestUrl.origin))
      }
      
      if (data.user) {
        console.log('✅ Email verified via code exchange:', data.user.email)
        
        // Create user profile if it doesn't exist
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        if (!existingUser) {
          const serviceSupabase = await createServiceSupabaseClient()
          const userMetadata = data.user.user_metadata
          
          await serviceSupabase.from('users').insert({
            id: data.user.id,
            email: data.user.email,
            full_name: userMetadata.full_name || userMetadata.name || data.user.email?.split('@')[0] || 'User',
            rep_id: `REP-${Date.now().toString().slice(-6)}`,
            role: 'rep',
            virtual_earnings: 0
          })
          
          await serviceSupabase.from('user_session_limits').insert({
            user_id: data.user.id,
            sessions_this_month: 0,
            sessions_limit: 5,
            last_reset_date: new Date().toISOString().split('T')[0]
          })
          console.log('✅ User profile created with 5 credits')
          
          // Send notification email to admin about new user signup
          const userName = userMetadata.full_name || userMetadata.name || data.user.email?.split('@')[0] || 'User'
          await sendNewUserNotification(data.user.email || '', userName, data.user.id)
        }
        
        // Verify session was set
        const { data: { session: finalSession } } = await supabase.auth.getSession()
        if (!finalSession) {
          return NextResponse.redirect(new URL('/auth/login?error=Unable to sign you in. Please try signing in manually.', requestUrl.origin))
        }
        
        const redirectPath = requestUrl.searchParams.get('next') || '/dashboard'
        return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
      }
    } catch (error: any) {
      console.error('❌ Error in code exchange:', error)
      return NextResponse.redirect(new URL('/auth/login?error=Email verification failed. Please try again.', requestUrl.origin))
    }
  }

  // Handle email verification with token parameter (OTP style)
  if ((token || token_hash) && type === 'signup') {
    console.log('📧 Email verification detected with token')
    
    let verificationData, verificationError
    
    if (token_hash) {
      const result = await supabase.auth.verifyOtp({
        token_hash: token_hash,
        type: 'email'
      })
      verificationData = result.data
      verificationError = result.error
    } else if (token) {
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
        
        // Use service role client to bypass RLS for user creation
        const serviceSupabase = await createServiceSupabaseClient()
        
        const { error: insertError } = await serviceSupabase.from('users').insert({
          id: verificationData.user.id,
          email: verificationData.user.email,
          full_name: userMetadata.full_name || userMetadata.name || verificationData.user.email?.split('@')[0] || 'User',
          rep_id: `REP-${Date.now().toString().slice(-6)}`,
          role: 'rep',
          virtual_earnings: 0
        })

        if (insertError) {
          console.error('❌ Error creating user profile:', insertError.message, insertError)
          // Don't fail the flow - user is authenticated even if profile creation fails
          // They can be created later or via admin
        } else {
          console.log('✅ User profile created successfully')
          
          // Grant 5 free credits to new free users
          const { error: creditsError } = await serviceSupabase
            .from('user_session_limits')
            .insert({
              user_id: verificationData.user.id,
              sessions_this_month: 0,
              sessions_limit: 5,
              last_reset_date: new Date().toISOString().split('T')[0]
            })

          if (creditsError) {
            console.error('⚠️ Failed to create credits record:', creditsError)
          } else {
            console.log('✅ Granted 5 free credits to new user')
          }
          
          // Send notification email to admin about new user signup
          const userName = userMetadata.full_name || userMetadata.name || verificationData.user.email?.split('@')[0] || 'User'
          await sendNewUserNotification(verificationData.user.email || '', userName, verificationData.user.id)
        }
      } else {
        console.log('✅ User profile already exists')
      }

      // Ensure session is properly set before redirecting
      // verifyOtp should have set cookies via setAll callback, but we need to verify
      const redirectPath = requestUrl.searchParams.get('next') || '/dashboard'
      console.log('🔄 Redirecting verified user to:', redirectPath)
      
      // Create fresh supabase client to verify session was set in cookies
      const freshSupabase = await createServerSupabaseClient()
      const { data: { session }, error: sessionError } = await freshSupabase.auth.getSession()
      
      if (sessionError) {
        console.error('❌ Error getting session:', sessionError.message)
      }
      
      // If no session found in cookies, but we have a session from verification, set it explicitly
      if (!session && verificationData.session) {
        console.log('⚠️ Session not in cookies, setting it explicitly from verification data')
        // The session should already be set via verifyOtp, but if not, we'll refresh
        // to ensure the session is properly established
        const { data: refreshData, error: refreshError } = await freshSupabase.auth.refreshSession(verificationData.session)
        if (refreshError) {
          console.error('❌ Error refreshing session:', refreshError.message)
        } else if (refreshData.session) {
          console.log('✅ Session refreshed and set')
        }
      }
      
      // Verify session one more time before redirecting
      const { data: { session: finalSession } } = await freshSupabase.auth.getSession()
      
      if (!finalSession) {
        console.error('❌ No session found after verification - redirecting to login')
        return NextResponse.redirect(new URL('/auth/login?error=Unable to sign you in. Please try signing in manually.', requestUrl.origin))
      }
      
      console.log('✅ Session confirmed in cookies:', { hasSession: !!finalSession, userId: finalSession?.user?.id })
      
      // Create redirect response
      // Cookies set via cookies().set() in setAll callback should automatically be included
      const redirectUrl = new URL(redirectPath, requestUrl.origin)
      return NextResponse.redirect(redirectUrl)
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
        
        // Use service role client to bypass RLS for user creation
        const serviceSupabase = await createServiceSupabaseClient()
        
        const { error: insertError } = await serviceSupabase.from('users').insert({
          id: data.user.id,
          email: data.user.email,
          full_name: userMetadata.full_name || userMetadata.name || data.user.email?.split('@')[0] || 'User',
          rep_id: `REP-${Date.now().toString().slice(-6)}`,
          role: 'rep',
          virtual_earnings: 0
        })

        if (insertError) {
          console.error('❌ Error creating user profile:', insertError.message, insertError)
          // Don't fail the flow - user is authenticated even if profile creation fails
          // They can be created later or via admin
        } else {
          console.log('✅ User profile created successfully')
          
          // Grant 5 free credits to new free users
          const { error: creditsError } = await serviceSupabase
            .from('user_session_limits')
            .insert({
              user_id: data.user.id,
              sessions_this_month: 0,
              sessions_limit: 5,
              last_reset_date: new Date().toISOString().split('T')[0]
            })

          if (creditsError) {
            console.error('⚠️ Failed to create credits record:', creditsError)
          } else {
            console.log('✅ Granted 5 free credits to new user')
          }
          
          // Send notification email to admin about new user signup
          const userName = userMetadata.full_name || userMetadata.name || data.user.email?.split('@')[0] || 'User'
          await sendNewUserNotification(data.user.email || '', userName, data.user.id)
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
  
  // Fallback: redirect to dashboard if no valid callback parameters
  console.log('⚠️ No valid callback parameters, redirecting to dashboard')
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
