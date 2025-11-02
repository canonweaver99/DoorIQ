import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { email, password, full_name } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
    }

    const supabase = await createServiceSupabaseClient()

    // Try to create user first
    let { data, error } = await (supabase as any).auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name }
    })

    // If user already exists, delete the orphaned Auth user and retry
    if (error) {
      const alreadyExists = (error.message || '').toLowerCase().includes('already registered') || 
                           (error.message || '').toLowerCase().includes('already exists') ||
                           error.status === 422
      
      if (alreadyExists) {
        console.log(`🔄 User with email ${email} exists in Auth but was deleted from database. Cleaning up to allow re-registration...`)
        
        // Find the user by email and delete from Auth
        const { data: usersData } = await (supabase as any).auth.admin.listUsers()
        if (usersData?.users) {
          const existingUser = usersData.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
          
          if (existingUser) {
            // Delete the existing user from Auth
            const { error: deleteError } = await (supabase as any).auth.admin.deleteUser(existingUser.id)
            
            if (deleteError) {
              console.error('❌ Error deleting existing user from Auth:', deleteError)
              return NextResponse.json({ error: 'Failed to clean up existing account. Please contact support.' }, { status: 400 })
            }
            
            console.log('✅ Deleted orphaned user from Auth, retrying signup...')
            
            // Retry creating the user
            const retryResult = await (supabase as any).auth.admin.createUser({
              email,
              password,
              email_confirm: false,
              user_metadata: { full_name }
            })
            
            if (retryResult.error) {
              return NextResponse.json({ error: retryResult.error.message || 'Failed to create account after cleanup' }, { status: 400 })
            }
            
            return NextResponse.json({ success: true, userId: retryResult.data?.user?.id || null })
          }
        }
        
        // If we couldn't find or delete the user, return helpful error
        return NextResponse.json({ 
          error: 'Email already registered. If you deleted your account, please wait a few minutes and try again, or contact support.' 
        }, { status: 400 })
      }
      
      // Other errors
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, userId: data?.user?.id || null })
  } catch (e: any) {
    console.error('❌ Signup error:', e)
    return NextResponse.json({ error: e.message || 'Signup failed' }, { status: 500 })
  }
}


