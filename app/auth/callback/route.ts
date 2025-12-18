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
