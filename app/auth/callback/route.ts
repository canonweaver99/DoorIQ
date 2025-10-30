import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const checkoutIntent = requestUrl.searchParams.get('checkout')

  console.log('🔗 Auth callback triggered:', {
    code: !!code,
    token_hash: !!token_hash,
    type,
    checkoutIntent: !!checkoutIntent,
    origin: requestUrl.origin
  })

  // Default redirect destination after successful authentication
  let redirectPath = requestUrl.searchParams.get('next') || '/'
  
  // Preserve checkout intent in redirect
  if (checkoutIntent && redirectPath) {
    redirectPath += `${redirectPath.includes('?') ? '&' : '?'}checkout=${checkoutIntent}`
  }

  if (code) {
    const supabase = await createServerSupabaseClient()
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

      // Redirect directly to the destination (no intermediate page)
      console.log('🔄 Redirecting after auth to:', redirectPath)
    }
  }
  
  console.log('🔄 Final redirect path:', redirectPath)
  
  // Redirect to home page or custom destination after successful authentication
  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
}
