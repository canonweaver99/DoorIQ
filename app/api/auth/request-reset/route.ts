import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY
  
  if (!secretKey) {
    console.error('❌ RECAPTCHA_SECRET_KEY not configured')
    return false
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`,
    })

    const data = await response.json()
    return data.success && data.score >= 0.5 // Adjust score threshold as needed
  } catch (error) {
    console.error('❌ reCAPTCHA verification error:', error)
    return false
  }
}

async function sendPasswordResetEmail(email: string, resetLink: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not configured - cannot send password reset email')
    return false
  }

  console.log('📧 Attempting to send password reset email to:', email)
  console.log('📧 Resend API key configured:', !!process.env.RESEND_API_KEY)

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
            .warning { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 16px; margin: 24px 0; }
            .warning-text { color: #fca5a5; font-size: 14px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-container">
                <img src="https://dooriq.ai/dooriqlogo.png" alt="DoorIQ" class="logo" />
              </div>
              <h1 class="header-text">Reset Your Password</h1>
              <p class="header-subtext">AI-Powered Sales Training</p>
            </div>
            <div class="content">
              <p style="margin-bottom: 24px;">
                We received a request to reset your password for your DoorIQ account.
              </p>
              <p style="margin-bottom: 32px;">
                Click the button below to reset your password. This link will expire in 1 hour for security reasons.
              </p>
              <div class="button-container">
                <a href="${resetLink}" class="button">Reset Password</a>
              </div>
              <div class="fallback-text">
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <a href="${resetLink}" class="fallback-link">${resetLink}</a>
              </div>
              <div class="warning">
                <p class="warning-text">
                  <strong>Didn't request this?</strong> If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} DoorIQ. All rights reserved.</p>
              <p style="margin-top: 8px;">This password reset link will expire in 1 hour.</p>
            </div>
          </div>
        </body>
      </html>
    `
    
    // Use a verified email address - prefer notifications@dooriq.ai which is used elsewhere
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'DoorIQ <notifications@dooriq.ai>'
    console.log('📧 Sending email from:', fromEmail)
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: email.toLowerCase(),
      subject: 'Reset your DoorIQ password',
      html: emailHtml,
      reply_to: 'canonweaver@loopline.design'
    })

    if (emailError) {
      console.error('❌ Error sending password reset email via Resend:', JSON.stringify(emailError, null, 2))
      console.error('❌ Email details:', { from: fromEmail, to: email.toLowerCase(), subject: 'Reset your DoorIQ password' })
      return false
    }

    if (!emailData?.id) {
      console.error('❌ No email ID returned from Resend:', emailData)
      return false
    }

    console.log(`✅ Password reset email sent via Resend to ${email} (ID: ${emailData.id})`)
    return true
  } catch (error: any) {
    console.error('❌ Exception sending password reset email via Resend:', error)
    console.error('❌ Error stack:', error?.stack)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const { email, recaptchaToken } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Verify reCAPTCHA if provided (optional for authenticated users calling from settings)
    if (recaptchaToken) {
      const isValidRecaptcha = await verifyRecaptcha(recaptchaToken)
      if (!isValidRecaptcha) {
        return NextResponse.json(
          { error: 'reCAPTCHA verification failed' },
          { status: 400 }
        )
      }
    }
    // Note: reCAPTCHA is optional when called from authenticated settings page
    // but recommended for public password reset flows

    const supabase = await createServiceSupabaseClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dooriq.ai'

    // Check if user exists (to prevent email enumeration)
    const { data: usersData } = await (supabase as any).auth.admin.listUsers()
    const existingUser = usersData?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())

    // Always return success to prevent email enumeration, but only send email if user exists
    if (!existingUser) {
      console.log(`⚠️ Password reset requested for non-existent email: ${email}`)
      return NextResponse.json({
        message: 'If an account exists with this email, you will receive a password reset link.',
      })
    }

    // Generate password reset link using admin API
    const { data: linkData, error: linkError } = await (supabase as any).auth.admin.generateLink({
      type: 'recovery',
      email: email.toLowerCase(),
      options: {
        redirectTo: `${siteUrl}/auth/reset-password`
      }
    })

    if (linkError) {
      console.error('❌ Error generating password reset link:', linkError)
      return NextResponse.json(
        { error: 'Failed to generate password reset link. Please try again later.' },
        { status: 500 }
      )
    }

    if (!linkData?.properties?.action_link) {
      console.error('❌ No action_link in generated link response')
      return NextResponse.json(
        { error: 'Failed to generate password reset link. Please try again later.' },
        { status: 500 }
      )
    }

    const resetLink = linkData.properties.action_link
    console.log(`✅ Generated password reset link for ${email}`)

    // Send email via Resend if configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured - cannot send password reset email')
      return NextResponse.json({
        error: 'Email service not configured. Please contact support.',
      }, { status: 500 })
    }

    const emailSent = await sendPasswordResetEmail(email, resetLink)

    if (!emailSent) {
      console.error(`❌ Failed to send password reset email to ${email}. Check logs above for details.`)
      return NextResponse.json({
        error: 'Failed to send password reset email. Please check your email service configuration or try again later.',
      }, { status: 500 })
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a password reset link.',
    })

  } catch (error: any) {
    console.error('❌ Request reset error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}

