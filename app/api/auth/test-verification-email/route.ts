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
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #e2e8f0; margin: 0; padding: 0; background: #02010A; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #0A0420 0%, #120836 100%); border: 1px solid rgba(168, 85, 247, 0.2); padding: 50px 40px; text-align: center; border-radius: 12px 12px 0 0; }
                  .logo-container { margin-bottom: 20px; }
                  .logo { max-width: 180px; height: auto; margin: 0 auto; }
                  .header-text { color: white; font-size: 28px; font-weight: 700; margin: 16px 0 8px 0; letter-spacing: -0.5px; }
                  .header-subtext { color: rgba(255, 255, 255, 0.7); font-size: 14px; margin: 0; }
                  .content { background: #0A0420; border: 1px solid rgba(168, 85, 247, 0.1); border-top: none; padding: 50px 40px; border-radius: 0 0 12px 12px; }
                  .content h2 { color: #f1f5f9; font-size: 24px; font-weight: 600; margin-top: 0; margin-bottom: 20px; }
                  .content p { color: #cbd5e1; font-size: 16px; line-height: 1.7; margin: 16px 0; }
                  .button-container { text-align: center; margin: 40px 0; }
                  .button { display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: #ffffff !important; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4); transition: transform 0.2s; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); }
                  .button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(168, 85, 247, 0.5); color: #ffffff !important; }
                  .fallback-text { color: #94a3b8; font-size: 14px; margin-top: 32px; }
                  .fallback-link { color: #a855f7; font-size: 12px; word-break: break-all; margin-top: 8px; display: block; }
                  .footer { text-align: center; padding: 30px 20px; color: #64748b; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <div class="logo-container">
                      <img src="https://dooriq.ai/dooriqlogo.png" alt="DoorIQ" class="logo" />
                    </div>
                    <h1 class="header-text">Confirm Your Email</h1>
                    <p class="header-subtext">AI-Powered Sales Training</p>
                  </div>
                  <div class="content">
                    <p style="margin-bottom: 24px;">
                      Thanks for signing up for DoorIQ! We're excited to help you master door-to-door sales.
                    </p>
                    <p style="margin-bottom: 32px;">
                      Please confirm your email address by clicking the button below to activate your account and start training.
                    </p>
                    <div class="button-container">
                      <a href="${confirmationLink}" class="button">Confirm Email Address</a>
                    </div>
                    <div class="fallback-text">
                      <p>If the button doesn't work, copy and paste this link into your browser:</p>
                      <a href="${confirmationLink}" class="fallback-link">${confirmationLink}</a>
                    </div>
                  </div>
                  <div class="footer">
                    <p>© ${new Date().getFullYear()} DoorIQ. All rights reserved.</p>
                    <p style="margin-top: 8px;">This email was sent to verify your account. If you didn't sign up, you can safely ignore this email.</p>
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

