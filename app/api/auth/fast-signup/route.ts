import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * Send confirmation email to newly created user
 * Uses Supabase admin API to resend confirmation email
 */
async function sendConfirmationEmail(supabase: any, email: string, userId: string) {
  try {
    console.log(`📧 Attempting to send confirmation email to ${email}...`)
    
    // Generate confirmation link
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    process.env.NEXT_PUBLIC_APP_URL || 
                    'https://dooriq.ai'
    
    const { data: linkData, error: linkError } = await (supabase as any).auth.admin.generateLink({
      type: 'signup',
      email: email.toLowerCase(),
      options: {
        redirectTo: `${siteUrl}/auth/callback`
      }
    })

    if (linkError) {
      console.error('❌ Error generating confirmation link:', linkError)
      return false
    }

    if (!linkData?.properties?.action_link) {
      console.error('❌ No action_link in generated link response')
      return false
    }

    const confirmationLink = linkData.properties.action_link
    console.log(`✅ Generated confirmation link: ${confirmationLink}`)

    // Send email via Resend if configured
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        
        const emailHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; }
                  .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
                  .button { display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 24px 0; font-weight: 600; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0; font-size: 32px;">🚪 DoorIQ</h1>
                    <p style="margin: 8px 0 0 0; opacity: 0.9;">AI-Powered Sales Training</p>
                  </div>
                  <div class="content">
                    <h2 style="color: #a855f7; margin-top: 0;">Confirm Your Email</h2>
                    <p style="font-size: 16px; color: #4b5563;">
                      Thanks for signing up for DoorIQ! Please confirm your email address by clicking the button below.
                    </p>
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${confirmationLink}" class="button">Confirm Email Address</a>
                    </div>
                    <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
                      If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">
                      ${confirmationLink}
                    </p>
                  </div>
                  <div class="footer">
                    <p>© ${new Date().getFullYear()} DoorIQ. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
          `
          
          const fromEmail = process.env.RESEND_FROM_EMAIL || 'DoorIQ <noreply@dooriq.ai>'
          
          const { data: emailData, error: emailError } = await resend.emails.send({
            from: fromEmail,
            to: email.toLowerCase(),
            subject: 'Confirm your DoorIQ account',
            html: emailHtml
          })

          if (emailError) {
            console.error('❌ Error sending email via Resend:', emailError)
            return false
          }

          console.log(`✅ Confirmation email sent via Resend to ${email} (ID: ${emailData?.id})`)
          return true
        } catch (error: any) {
          console.error('❌ Error sending email via Resend:', error)
          return false
        }
      } else {
        console.warn('⚠️ RESEND_API_KEY not configured - cannot send confirmation email')
        console.warn('⚠️ Confirmation link generated but email not sent:', confirmationLink)
        return false
      }
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


