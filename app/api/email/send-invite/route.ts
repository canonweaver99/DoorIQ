import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { addSignatureIfNeeded } from '@/lib/email/send'

// Lazy initialize Resend to avoid build-time errors
function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(request: NextRequest) {
  try {
    const { email, inviteUrl, inviterName, role } = await request.json()
    
    if (!email || !inviteUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resend = getResendClient()
    if (!resend) {
      console.log('⚠️ Resend API key not configured - skipping email')
      return NextResponse.json({ success: true, skipped: true, reason: 'Email service not configured' })
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'invites@dooriq.ai'
    const roleText = role === 'manager' ? 'Manager' : 'Sales Rep'

    const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
              .button { display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 24px 0; font-weight: 600; }
              .role-badge { display: inline-block; background: #f3e8ff; color: #a855f7; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin: 16px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 32px;">🚪 DoorIQ</h1>
                <p style="margin: 8px 0 0 0; opacity: 0.9;">AI-Powered Sales Training</p>
              </div>
              <div class="content">
                <h2 style="color: #a855f7; margin-top: 0;">You've Been Invited!</h2>
                <p style="font-size: 16px; color: #4b5563;">
                  ${inviterName ? `<strong>${inviterName}</strong> has` : 'You have been'} invited you to join their team on DoorIQ!
                </p>
                <div class="role-badge">${roleText}</div>
                <p style="font-size: 16px; color: #4b5563; margin-top: 24px;">
                  DoorIQ is the premier AI-powered sales training platform for door-to-door sales teams. 
                  Practice your pitch with 12 realistic AI homeowners, get instant feedback, and become a top performer.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${inviteUrl}" class="button">Accept Invitation</a>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
                  <strong>What you'll get:</strong>
                </p>
                <ul style="color: #4b5563; margin: 8px 0;">
                  <li>Access to 14 AI training agents with unique objections</li>
                  <li>Real-time performance analytics and feedback</li>
                  <li>Team leaderboards and competitions</li>
                  <li>Manager coaching and insights</li>
                  <li>Unlimited practice sessions</li>
                </ul>
                <p style="font-size: 14px; color: #ef4444; margin-top: 24px; padding: 16px; background: #fef2f2; border-radius: 6px;">
                  ⏰ This invitation expires in 7 days.
                </p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} DoorIQ. All rights reserved.</p>
                <p style="font-size: 12px; margin-top: 8px;">
                  If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </div>
            </div>
          </body>
        </html>
      `
    
    const htmlWithSignature = addSignatureIfNeeded(emailHtml, fromEmail)

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `You've been invited to join DoorIQ as a ${roleText}`,
      html: htmlWithSignature,
      reply_to: 'canonweaver@loopline.design'
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Invite email sent successfully:', data?.id)
    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (error: any) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}

