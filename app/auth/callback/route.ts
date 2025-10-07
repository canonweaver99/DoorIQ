import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if user profile exists in the users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      // If user doesn't exist in users table, create profile
      if (!existingUser) {
        const userMetadata = data.user.user_metadata
        
        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email,
          full_name: userMetadata.full_name || userMetadata.name || data.user.email?.split('@')[0] || 'User',
          rep_id: `REP-${Date.now().toString().slice(-6)}`, // Generate a temporary rep ID
        })
      }
    }
  }

  // Redirect to trainer after successful authentication
  return NextResponse.redirect(new URL('/trainer/select-homeowner', requestUrl.origin))
}
