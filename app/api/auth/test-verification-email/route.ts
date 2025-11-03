import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = await createServiceSupabaseClient()
    
    console.log(`📧 Testing verification email send to ${email}...`)
    
    // First, check if user exists
    const { data: usersData } = await (supabase as any).auth.admin.listUsers()
    const existingUser = usersData?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
    
    if (!existingUser) {
      return NextResponse.json({ 
        error: 'User not found. Please sign up first, then we can send the verification email.' 
      }, { status: 404 })
    }

    console.log(`✅ Found user: ${existingUser.id}, email confirmed: ${existingUser.email_confirmed_at}`)

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
      return NextResponse.json({ 
        error: 'Failed to generate confirmation link: ' + linkError.message
      }, { status: 500 })
    }

    if (!linkData?.properties?.action_link) {
      return NextResponse.json({ 
        error: 'Failed to generate confirmation link - no action_link returned'
      }, { status: 500 })
    }

    const confirmationLink = linkData.properties.action_link
    console.log(`✅ Generated confirmation link: ${confirmationLink}`)

    // If we have Resend configured, send the email manually
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
            return NextResponse.json({ 
              error: 'Failed to send email via Resend: ' + emailError.message 
            }, { status: 500 })
          }

          console.log(`✅ Test verification email sent via Resend to ${email} (ID: ${emailData?.id})`)
          return NextResponse.json({ 
            success: true, 
            method: 'resend_fallback',
            emailId: emailData?.id,
            message: 'Verification email sent via Resend'
          })
        } catch (error: any) {
          console.error('❌ Error in Resend fallback:', error)
          return NextResponse.json({ 
            error: 'Resend failed: ' + error.message 
          }, { status: 500 })
        }
      } else {
        return NextResponse.json({ 
          error: 'Resend API key is not configured. Please set RESEND_API_KEY in your environment variables.',
          confirmationLink: confirmationLink,
          message: 'Generated link but cannot send email without Resend configuration'
        }, { status: 500 })
      }
  } catch (e: any) {
    console.error('❌ Test email error:', e)
    return NextResponse.json({ 
      error: e.message || 'Failed to send test email',
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 })
  }
}

