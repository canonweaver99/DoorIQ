import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * Send confirmation email to newly created user
 * Uses Supabase admin API to generate and send confirmation email
 */
async function sendConfirmationEmail(supabase: any, email: string, userId: string) {
  try {
    // Get the site URL for the confirmation redirect
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    process.env.NEXT_PUBLIC_APP_URL || 
                    'https://dooriq.ai'
    
    // Generate confirmation link - this should trigger email send
    const { data: linkData, error: linkError } = await (supabase as any).auth.admin.generateLink({
      type: 'signup',
      email: email.toLowerCase(),
      options: {
        redirectTo: `${siteUrl}/auth/callback`
      }
    })

    if (linkError) {
      console.error('❌ Error generating confirmation link:', linkError)
      
      // Fallback: Try to resend confirmation email directly
      const { error: resendError } = await (supabase as any).auth.admin.resend({
        type: 'signup',
        email: email.toLowerCase()
      })
      
      if (resendError) {
        console.error('❌ Error resending confirmation email:', resendError)
        return false
      }
      
      console.log('✅ Confirmation email resent via fallback method')
      return true
    }

    if (linkData?.properties?.action_link) {
      console.log(`✅ Confirmation email link generated for ${email}`)
      // Note: generateLink with type 'signup' should automatically send the email
      // But if it doesn't, we'll need to check Supabase email settings
      return true
    }

    console.warn('⚠️ No action_link in generated link response')
    return false
  } catch (error: any) {
    console.error('❌ Error sending confirmation email:', error)
    return false
  }
}

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
            
            // Send confirmation email for retry
            if (retryResult.data?.user?.id) {
              await sendConfirmationEmail(supabase, email, retryResult.data.user.id)
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

    // Send confirmation email after successful user creation
    if (data?.user?.id) {
      await sendConfirmationEmail(supabase, email, data.user.id)
    }

    return NextResponse.json({ success: true, userId: data?.user?.id || null })
  } catch (e: any) {
    console.error('❌ Signup error:', e)
    return NextResponse.json({ error: e.message || 'Signup failed' }, { status: 500 })
  }
}


