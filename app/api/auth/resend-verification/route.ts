import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
// Import the email sending function
async function sendEmailWithLink(email: string, confirmationLink: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured - cannot send confirmation email')
    return false
  }

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
      html: emailHtml,
      reply_to: 'canonweaver@loopline.design'
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
}

export const runtime = 'nodejs'

/**
 * Resend verification email to user
 * Generates a fresh confirmation link and sends it via Resend
 */
export async function POST(req: Request) {
  try {
    const { email, redirectUrl } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = await createServiceSupabaseClient()

    // Check if user exists
    const { data: usersData } = await (supabase as any).auth.admin.listUsers()
    const existingUser = usersData?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())

    if (!existingUser) {
      return NextResponse.json({ 
        error: 'No account found with this email address. Please sign up first.' 
      }, { status: 404 })
    }

    // Check if email is already confirmed
    if (existingUser.email_confirmed_at) {
      return NextResponse.json({ 
        success: true,
        message: 'Your email is already confirmed. You can sign in now.',
        alreadyConfirmed: true
      })
    }

    console.log(`📧 Resending verification email to ${email}...`)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    process.env.NEXT_PUBLIC_APP_URL || 
                    'https://dooriq.ai'
    
    // Use provided redirect URL or default to callback
    const finalRedirectTo = redirectUrl || `${siteUrl}/auth/callback`

    // Generate a fresh confirmation link
    const { data: linkData, error: linkError } = await (supabase as any).auth.admin.generateLink({
      type: 'signup',
      email: email.toLowerCase(),
      options: {
        redirectTo: finalRedirectTo
      }
    })

    if (linkError) {
      console.error('❌ Error generating confirmation link:', linkError)
      return NextResponse.json({ 
        error: 'Failed to generate confirmation link. Please try again later.' 
      }, { status: 500 })
    }

    if (!linkData?.properties?.action_link) {
      console.error('❌ No action_link in generated link response')
      return NextResponse.json({ 
        error: 'Failed to generate confirmation link. Please try again later.' 
      }, { status: 500 })
    }

    const confirmationLink = linkData.properties.action_link
    console.log(`✅ Generated fresh confirmation link for ${email}`)

    // Send email via Resend if configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured - cannot send confirmation email')
      return NextResponse.json({ 
        error: 'Email service not configured. Please contact support.' 
      }, { status: 500 })
    }

    const emailSent = await sendEmailWithLink(email, confirmationLink)

    if (!emailSent) {
      return NextResponse.json({ 
        error: 'Failed to send verification email. Please try again later.' 
      }, { status: 500 })
    }

    console.log(`✅ Verification email resent to ${email}`)
    return NextResponse.json({ 
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    })

  } catch (error: any) {
    console.error('❌ Error resending verification email:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to resend verification email' 
    }, { status: 500 })
  }
}

